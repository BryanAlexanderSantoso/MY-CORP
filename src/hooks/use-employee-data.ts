'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export function useMyEmployee() {
    return useQuery({
        queryKey: ['my-employee'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return null
            const { data } = await supabase
                .from('employees')
                .select('*, organizations(name, slug)')
                .eq('profile_id', user.id)
                .single()
            return data
        }
    })
}

export function useMyAttendance(employeeId: string | undefined) {
    return useQuery({
        queryKey: ['my-attendance', employeeId],
        enabled: !!employeeId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('attendance')
                .select('*')
                .eq('employee_id', employeeId)
                .order('clock_in', { ascending: false })
                .limit(30)
            if (error) throw error
            return data || []
        }
    })
}

export function useTodayAttendance(employeeId: string | undefined) {
    return useQuery({
        queryKey: ['today-attendance', employeeId],
        enabled: !!employeeId,
        queryFn: async () => {
            const today = new Date().toISOString().split('T')[0]
            const { data } = await supabase
                .from('attendance')
                .select('*')
                .eq('employee_id', employeeId)
                .gte('clock_in', today + 'T00:00:00')
                .lte('clock_in', today + 'T23:59:59')
                .limit(1)
                .single()
            return data
        }
    })
}

export function useMyLeaves(employeeId: string | undefined) {
    return useQuery({
        queryKey: ['my-leaves', employeeId],
        enabled: !!employeeId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('leave_requests')
                .select('*')
                .eq('employee_id', employeeId)
                .order('created_at', { ascending: false })
            if (error) throw error
            return data || []
        }
    })
}

export function getDuration(ci: string, co?: string | null) {
    if (!co) return null
    const m = Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 60000)
    return `${Math.floor(m / 60)}j ${m % 60}m`
}
