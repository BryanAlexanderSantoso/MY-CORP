import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Uses service_role key to bypass RLS for initial account setup
const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: Request) {
    try {
        const { email, password, orgName, fullName } = await req.json()

        if (!email || !password || !orgName || !fullName) {
            return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
        }

        // 1. Create auth user
        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
            email: email.trim(),
            password: password.trim(),
            email_confirm: true, // auto-confirm so they can login immediately
        })
        if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })
        if (!authData.user) return NextResponse.json({ error: 'User creation failed' }, { status: 500 })

        const userId = authData.user.id
        const slug = orgName.toLowerCase().replace(/\s+/g, '-') + '-' + Math.random().toString(36).substring(7)

        // 2. Create Organization
        const { data: orgData, error: orgError } = await adminClient
            .from('organizations')
            .insert({ name: orgName, slug, owner_id: userId })
            .select()
            .single()
        if (orgError) {
            // Rollback: delete auth user
            await adminClient.auth.admin.deleteUser(userId)
            return NextResponse.json({ error: orgError.message }, { status: 500 })
        }

        // 3. Create Profile
        const { error: profileError } = await adminClient
            .from('profiles')
            .insert({ id: userId, tenant_id: orgData.id, full_name: fullName, role: 'OWNER' })
        if (profileError) {
            await adminClient.auth.admin.deleteUser(userId)
            return NextResponse.json({ error: profileError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
    }
}
