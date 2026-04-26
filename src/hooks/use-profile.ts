'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface UserProfile {
    id: string
    full_name: string | null
    role: string
    email: string | undefined
    tenant_id: string
}

export function useProfile() {
    return useQuery<UserProfile | null>({
        queryKey: ['user-profile'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return null
            const { data } = await supabase
                .from('profiles')
                .select('id, full_name, role, tenant_id')
                .eq('id', user.id)
                .single()
            if (!data) return null
            return { ...data, email: user.email }
        },
        staleTime: 1000 * 60 * 5, // cache for 5 minutes
    })
}

export function isEmployee(role: string | undefined | null): boolean {
    return role === 'EMPLOYEE'
}

export function isAdmin(role: string | undefined | null): boolean {
    return role === 'OWNER' || role === 'ADMIN' || role === 'STAFF'
}
