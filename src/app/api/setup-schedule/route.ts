import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST() {
    try {
        // Try adding work_start_time and work_end_time columns
        // Using .rpc or direct update approach since we can't run DDL via REST

        // Check if columns exist by trying to read them
        const { data: org, error } = await adminClient
            .from('organizations')
            .select('id, work_start_time, work_end_time')
            .limit(1)
            .maybeSingle()

        if (error && error.message.includes('work_start_time')) {
            // Columns don't exist — need SQL migration
            return NextResponse.json({
                success: false,
                message: 'Kolom work_start_time dan work_end_time belum ada di tabel organizations. Jalankan SQL berikut di Supabase SQL Editor:',
                sql: `ALTER TABLE organizations
    ADD COLUMN IF NOT EXISTS work_start_time TIME DEFAULT '09:00',
    ADD COLUMN IF NOT EXISTS work_end_time TIME DEFAULT '17:00';`,
            })
        }

        // Columns exist — update with defaults if needed
        if (org && !org.work_start_time) {
            await adminClient
                .from('organizations')
                .update({ work_start_time: '09:00', work_end_time: '17:00' })
                .eq('id', org.id)
        }

        return NextResponse.json({
            success: true,
            message: 'Work schedule columns are ready!',
            current: org,
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
