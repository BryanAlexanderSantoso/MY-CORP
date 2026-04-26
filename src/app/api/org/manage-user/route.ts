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
            return NextResponse.json({ error: 'Unauthorized to manage users' }, { status: 403 })
        }

        const { targetUserId, action } = await req.json()

        if (!targetUserId || !action) {
            return NextResponse.json({ error: 'targetUserId and action are required' }, { status: 400 })
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
            return NextResponse.json({ error: 'Cannot manage user in another organization' }, { status: 403 })
        }

        // Cannot ban/delete an OWNER if you are an ADMIN
        if (currentUserProfile.role === 'ADMIN' && targetProfile.role === 'OWNER') {
            return NextResponse.json({ error: 'ADMINs cannot modify OWNERs' }, { status: 403 })
        }

        // Cannot delete yourself
        if (targetUserId === user.id) {
            return NextResponse.json({ error: 'Cannot perform this action on yourself' }, { status: 400 })
        }

        if (action === 'ban') {
            const { error } = await admin.auth.admin.updateUserById(targetUserId, { ban_duration: '876000h' })
            if (error) throw error
        } else if (action === 'unban') {
            const { error } = await admin.auth.admin.updateUserById(targetUserId, { ban_duration: 'none' })
            if (error) throw error
        } else if (action === 'delete') {
            const { error } = await admin.auth.admin.deleteUser(targetUserId)
            if (error) throw error
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
