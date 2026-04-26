import { createClient as createAdmin } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET() {
    try {
        const serverSupabase = await createServerClient()
        const { data: { user } } = await serverSupabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Check if current user is OWNER or ADMIN
        const { data: currentUserProfile } = await admin
            .from('profiles')
            .select('tenant_id, role')
            .eq('id', user.id)
            .single()

        if (!currentUserProfile || (currentUserProfile.role !== 'OWNER' && currentUserProfile.role !== 'ADMIN')) {
            return NextResponse.json({ error: 'Unauthorized to view users' }, { status: 403 })
        }

        // We fetch profiles
        const { data: profiles, error: pErr } = await admin
            .from('profiles')
            .select('id, full_name, role, employees(email, department)')
            .eq('tenant_id', currentUserProfile.tenant_id)

        if (pErr) throw pErr

        // We fetch auth users to see who is banned
        // This lists ALL users in auth database. Pagination logic would normally be used here, 
        // but for now we'll fetch up to 1000
        const { data: { users }, error: uErr } = await admin.auth.admin.listUsers({ perPage: 1000 })
        if (uErr) throw uErr

        // Map ban status
        const banMap = new Map()
        users.forEach(u => {
            banMap.set(u.id, !!u.banned_until) // !! ensures boolean
        })

        const detailedProfiles = profiles.map(p => ({
            ...p,
            is_banned: banMap.get(p.id) || false
        }))

        return NextResponse.json(detailedProfiles)
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
