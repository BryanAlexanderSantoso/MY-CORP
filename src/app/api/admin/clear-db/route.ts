import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: Request) {
    // SECURITY checks: this should wipe the whole DB except meta tables! Be careful!
    try {
        const { authConfirm } = await req.json()
        if (authConfirm !== 'DELETE_EVERYTHING') {
            return NextResponse.json({ error: 'Not confirmed' }, { status: 400 })
        }

        // Delete all auth users (this will cascade delete profiles, employees, attendance, leave_requests, orgs if CASCADE is set)
        const { data: { users }, error } = await adminClient.auth.admin.listUsers()
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        const deletePromises = users.map(user => adminClient.auth.admin.deleteUser(user.id))
        await Promise.all(deletePromises)

        // As a fallback to be safe, delete all records explicitly in case referential actions are not cascade.
        await adminClient.from('leave_requests').delete().neq('id', 'uuid-force-delete-all')
        await adminClient.from('attendance').delete().neq('id', 'uuid-force-delete-all')
        await adminClient.from('employees').delete().neq('id', 'uuid-force-delete-all')
        await adminClient.from('organizations').delete().neq('id', 'uuid-force-delete-all')
        await adminClient.from('profiles').delete().neq('id', 'uuid-force-delete-all')

        return NextResponse.json({ success: true, message: 'Database wiped clean successfully. Added onboarding schemas in migrations.' })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
