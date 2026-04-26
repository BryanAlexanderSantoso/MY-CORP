import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET() {
    try {
        // 1. List all profiles
        const { data: profiles, error: pErr } = await adminClient
            .from('profiles')
            .select('id, full_name, role, tenant_id')

        // 2. List all employees
        const { data: employees, error: eErr } = await adminClient
            .from('employees')
            .select('id, full_name, email, tenant_id, profile_id, status')

        // 3. List all organizations
        const { data: orgs, error: oErr } = await adminClient
            .from('organizations')
            .select('id, name, slug')

        // 4. List auth users
        const { data: authUsers, error: aErr } = await adminClient.auth.admin.listUsers()

        return NextResponse.json({
            profiles: { data: profiles, error: pErr?.message },
            employees: { data: employees, error: eErr?.message },
            organizations: { data: orgs, error: oErr?.message },
            auth_users: {
                data: authUsers?.users?.map(u => ({
                    id: u.id,
                    email: u.email,
                    created_at: u.created_at,
                })),
                error: aErr?.message
            },
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
