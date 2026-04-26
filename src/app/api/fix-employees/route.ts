import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST() {
    try {
        const results: string[] = []

        // 1. Find all EMPLOYEE profiles that DON'T have an employee record
        const { data: empProfiles, error: profErr } = await adminClient
            .from('profiles')
            .select('id, full_name, tenant_id')
            .eq('role', 'EMPLOYEE')

        if (profErr) {
            return NextResponse.json({ error: profErr.message }, { status: 500 })
        }

        if (!empProfiles || empProfiles.length === 0) {
            return NextResponse.json({ success: true, results: ['No EMPLOYEE profiles found'] })
        }

        for (const profile of empProfiles) {
            // Check if employee record already exists for this profile
            const { data: existing } = await adminClient
                .from('employees')
                .select('id, tenant_id')
                .eq('profile_id', profile.id)
                .maybeSingle()

            if (existing) {
                // Fix tenant_id if it's NULL
                if (!existing.tenant_id && profile.tenant_id) {
                    await adminClient
                        .from('employees')
                        .update({ tenant_id: profile.tenant_id })
                        .eq('id', existing.id)
                    results.push(`✅ Fixed NULL tenant_id for ${profile.full_name}`)
                } else {
                    results.push(`⏭️ ${profile.full_name} already has correct employee record`)
                }
                continue
            }

            // Get the auth user's email
            const { data: authUser } = await adminClient.auth.admin.getUserById(profile.id)
            const email = authUser?.user?.email || ''

            // Create the missing employee record
            const { data: newEmp, error: insertErr } = await adminClient
                .from('employees')
                .insert({
                    tenant_id: profile.tenant_id,
                    profile_id: profile.id,
                    full_name: profile.full_name,
                    email: email,
                    status: 'ACTIVE',
                    joined_at: new Date().toISOString().split('T')[0],
                })
                .select('id')
                .single()

            if (insertErr) {
                results.push(`❌ Failed to create employee for ${profile.full_name}: ${insertErr.message}`)
            } else {
                // Ensure tenant_id is correct (in case trigger overwrote it)
                if (newEmp) {
                    await adminClient
                        .from('employees')
                        .update({ tenant_id: profile.tenant_id })
                        .eq('id', newEmp.id)
                }
                results.push(`✅ Created employee record for ${profile.full_name} (${email})`)
            }
        }

        // Verify
        const { data: allEmployees } = await adminClient
            .from('employees')
            .select('id, full_name, email, tenant_id, profile_id, status')

        return NextResponse.json({
            success: true,
            results,
            employees: allEmployees,
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
