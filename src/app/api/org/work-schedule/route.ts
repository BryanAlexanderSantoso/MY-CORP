import { createClient as createAdmin } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: Request) {
    try {
        const serverSupabase = await createServerClient()
        const { data: { user } } = await serverSupabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Verify user is admin/owner
        const { data: profile } = await admin
            .from('profiles')
            .select('tenant_id, role')
            .eq('id', user.id)
            .single()

        if (!profile?.tenant_id) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        if (profile.role === 'EMPLOYEE') {
            return NextResponse.json({ error: 'Unauthorized — employees cannot change work schedule' }, { status: 403 })
        }

        const { work_start_time, work_end_time } = await req.json()

        if (!work_start_time || !work_end_time) {
            return NextResponse.json({ error: 'Jam masuk dan jam pulang wajib diisi.' }, { status: 400 })
        }

        const { error } = await admin
            .from('organizations')
            .update({
                work_start_time,
                work_end_time,
            })
            .eq('id', profile.tenant_id)

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
