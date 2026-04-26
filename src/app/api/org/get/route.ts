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

        // Try tenant_id first
        const { data: profile } = await admin
            .from('profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .maybeSingle()

        let org = null

        if (profile?.tenant_id) {
            const { data } = await admin
                .from('organizations')
                .select('*')
                .eq('id', profile.tenant_id)
                .maybeSingle()
            org = data
        }

        // Fallback: find org by owner_id
        if (!org) {
            const { data } = await admin
                .from('organizations')
                .select('*')
                .eq('owner_id', user.id)
                .maybeSingle()
            org = data

            // Auto-fix null tenant_id
            if (org) {
                await admin.from('profiles').update({ tenant_id: org.id }).eq('id', user.id)
            }
        }

        if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

        return NextResponse.json(org)
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
