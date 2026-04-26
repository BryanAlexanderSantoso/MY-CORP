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
        const { name, slug } = await req.json()

        if (!name?.trim() || !slug?.trim()) {
            return NextResponse.json({ error: 'Nama dan slug tidak boleh kosong.' }, { status: 400 })
        }

        const slugRegex = /^[a-z0-9-]+$/
        if (!slugRegex.test(slug.trim())) {
            return NextResponse.json({ error: 'Slug hanya boleh huruf kecil, angka, dan tanda hubung (-).' }, { status: 400 })
        }

        // Get authenticated user
        const serverSupabase = await createServerClient()
        const { data: { user }, error: authError } = await serverSupabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Sesi tidak valid, silakan login ulang.' }, { status: 401 })
        }

        // Try to get tenant_id from profile
        const { data: profile } = await admin
            .from('profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .maybeSingle()

        let orgId = profile?.tenant_id

        // Fallback: find org where this user is the owner
        if (!orgId) {
            const { data: ownedOrg } = await admin
                .from('organizations')
                .select('id')
                .eq('owner_id', user.id)
                .maybeSingle()

            if (ownedOrg?.id) {
                orgId = ownedOrg.id

                // Also fix the null tenant_id while we're here
                await admin
                    .from('profiles')
                    .update({ tenant_id: orgId })
                    .eq('id', user.id)
            }
        }

        if (!orgId) {
            return NextResponse.json({ error: 'Organisasi tidak ditemukan untuk akun ini.' }, { status: 404 })
        }

        // Check slug uniqueness
        const { data: existing } = await admin
            .from('organizations')
            .select('id')
            .eq('slug', slug.trim().toLowerCase())
            .neq('id', orgId)
            .maybeSingle()

        if (existing) {
            return NextResponse.json({ error: 'Slug sudah digunakan oleh organisasi lain.' }, { status: 409 })
        }

        // Update org
        const { error: updateError } = await admin
            .from('organizations')
            .update({ name: name.trim(), slug: slug.trim().toLowerCase() })
            .eq('id', orgId)

        if (updateError) {
            return NextResponse.json({ error: 'Gagal update: ' + updateError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
    }
}
