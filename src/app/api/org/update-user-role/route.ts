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

        // Check if current user is OWNER or ADMIN
        const { data: currentUserProfile } = await admin
            .from('profiles')
            .select('tenant_id, role')
            .eq('id', user.id)
            .single()

        if (!currentUserProfile || (currentUserProfile.role !== 'OWNER' && currentUserProfile.role !== 'ADMIN')) {
            return NextResponse.json({ error: 'Unauthorized to change roles' }, { status: 403 })
        }

        const { targetUserId, newRole } = await req.json()

        if (!targetUserId || !newRole) {
            return NextResponse.json({ error: 'targetUserId and newRole are required' }, { status: 400 })
        }

        // Validate that target user belongs to the same tenant
        const { data: targetProfile, error: checkError } = await admin
            .from('profiles')
            .select('tenant_id, role')
            .eq('id', targetUserId)
            .single()

        if (checkError || !targetProfile) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        if (targetProfile.tenant_id !== currentUserProfile.tenant_id) {
            return NextResponse.json({ error: 'Cannot change role for user in another organization' }, { status: 403 })
        }

        // Only OWNERs can promote/demote other OWNERs or ADMINs.
        if (currentUserProfile.role === 'ADMIN' && (targetProfile.role === 'OWNER' || newRole === 'OWNER')) {
            return NextResponse.json({ error: 'ADMINs cannot modify OWNER roles' }, { status: 403 })
        }

        // Update role
        const { error: updateError } = await admin
            .from('profiles')
            .update({ role: newRole })
            .eq('id', targetUserId)

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
