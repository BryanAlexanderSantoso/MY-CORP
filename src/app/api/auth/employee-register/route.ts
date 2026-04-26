import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: Request) {
    try {
        const { email, password, fullName, companySlug } = await req.json()

        if (!email || !password || !fullName || !companySlug) {
            return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
        }

        // 1. Find the organization by slug
        const { data: org, error: orgError } = await adminClient
            .from('organizations')
            .select('id, name')
            .eq('slug', companySlug.trim().toLowerCase())
            .single()

        if (orgError || !org) {
            return NextResponse.json({ error: 'Company code not found. Please contact your admin.' }, { status: 404 })
        }

        // 2. Create auth user (email confirmed immediately)
        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
            email: email.trim(),
            password: password.trim(),
            email_confirm: true,
        })
        if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })
        if (!authData.user) return NextResponse.json({ error: 'User creation failed' }, { status: 500 })

        const userId = authData.user.id

        // 3. Create profile with EMPLOYEE role in the same org
        const { error: profileError } = await adminClient
            .from('profiles')
            .insert({ id: userId, tenant_id: org.id, full_name: fullName, role: 'EMPLOYEE' })

        if (profileError) {
            await adminClient.auth.admin.deleteUser(userId)
            return NextResponse.json({ error: profileError.message }, { status: 500 })
        }

        // 4. Create an employee record linked to this profile
        //    Note: auto_set_tenant_id trigger may overwrite tenant_id to NULL
        //    when using service-role key. We work around this by:
        //    a) Inserting the record
        //    b) Immediately updating tenant_id after insert
        let employeeCreated = false

        // First attempt: normal insert
        const { data: empData, error: empError } = await adminClient
            .from('employees')
            .insert({
                tenant_id: org.id,
                profile_id: userId,
                full_name: fullName,
                email: email.trim(),
                status: 'ACTIVE',
                joined_at: new Date().toISOString().split('T')[0],
            })
            .select('id')
            .single()

        if (empError) {
            console.warn('Employee insert failed (trigger issue?):', empError.message)

            // Second attempt: insert minimal record, then update tenant_id
            // Some triggers may cause NOT NULL violation, so try with a raw approach
            const { data: empData2, error: empError2 } = await adminClient
                .from('employees')
                .insert({
                    profile_id: userId,
                    full_name: fullName,
                    email: email.trim(),
                    status: 'ACTIVE',
                    joined_at: new Date().toISOString().split('T')[0],
                })
                .select('id')
                .single()

            if (!empError2 && empData2) {
                // Fix the tenant_id
                await adminClient
                    .from('employees')
                    .update({ tenant_id: org.id })
                    .eq('id', empData2.id)
                employeeCreated = true
            } else {
                console.warn('Employee insert 2nd attempt also failed:', empError2?.message)
            }
        } else if (empData) {
            // Ensure tenant_id is correct (trigger may have set it to NULL)
            await adminClient
                .from('employees')
                .update({ tenant_id: org.id })
                .eq('id', empData.id)
            employeeCreated = true
        }

        return NextResponse.json({ success: true, orgName: org.name })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
    }
}
