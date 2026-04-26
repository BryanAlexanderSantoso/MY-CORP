import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'

const supabase = createClient()

// 1. Dashboard Summary Hook
export function useDashboardStats() {
    return useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_dashboard_summary')
            if (error) throw error
            return data
        }
    })
}

// 2. Sales Chart Hook
export function useSalesChart(days = 7) {
    return useQuery({
        queryKey: ['sales-chart', days],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_sales_chart_data', { p_days: days })
            if (error) throw error
            return data
        }
    })
}

// 3. Products Hook
export function useProducts() {
    return useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('products')
                .select(`
          *,
          inventory_transactions(quantity)
        `)

            if (error) throw error

            // Calculate stock from ledger
            return data.map((p: any) => ({
                ...p,
                stock: p.inventory_transactions.reduce((acc: number, t: any) => acc + t.quantity, 0)
            }))
        }
    })
}

// 4. Leads & CRM Hook
export function useLeads() {
    return useQuery({
        queryKey: ['leads'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .order('created_at', { ascending: false })
            if (error) throw error
            return data
        }
    })
}

// 5. Warehouses Hook
export function useWarehouses() {
    return useQuery({
        queryKey: ['warehouses'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('warehouses')
                .select('*')
            if (error) throw error
            return data
        }
    })
}

// 6. Inventory Ledger Hook
export function useTransactions() {
    return useQuery({
        queryKey: ['transactions'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('inventory_transactions')
                .select(`
          *,
          products(name, sku),
          warehouses(name)
        `)
                .order('created_at', { ascending: false })
            if (error) throw error
            return data
        }
    })
}

// 7. Employees Hook
export function useEmployees() {
    return useQuery({
        queryKey: ['employees'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('employees')
                .select(`
          *,
          profiles(full_name)
        `)
            if (error) throw error
            return data
        }
    })
}

// 8. Attendance Hook
export function useAttendance() {
    return useQuery({
        queryKey: ['attendance'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('attendance')
                .select(`
          *,
          employees(profiles(full_name))
        `)
                .order('clock_in', { ascending: false })
            if (error) throw error
            return data
        }
    })
}

// 9. Payroll Hook (using RPC)
export function usePayrollData(month: number, year: number) {
    return useQuery({
        queryKey: ['payroll', month, year],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('calculate_monthly_payroll', {
                p_month: month,
                p_year: year
            })
            if (error) throw error
            return data
        }
    })
}

// 10. Real-time Subscription Hook
export function useRealtimeSync(table: string, queryKey: string[]) {
    const queryClient = useQueryClient()

    useEffect(() => {
        const channel = supabase
            .channel(`realtime-${table}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table },
                () => {
                    queryClient.invalidateQueries({ queryKey })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [table, queryKey, queryClient])
}
