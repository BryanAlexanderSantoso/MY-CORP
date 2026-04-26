'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import {
    Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
    ArrowDownRight, ArrowUpRight, Box, DollarSign,
    Package, ShoppingCart, TrendingUp, Users
} from 'lucide-react'
import { useRealtimeSync } from '@/hooks/use-erp-data'
import Link from 'next/link'

const supabase = createClient()

function useDashboardData() {
    return useQuery({
        queryKey: ['dashboard-all'],
        queryFn: async () => {
            const [leadsRes, productsRes, txRes] = await Promise.all([
                supabase.from('leads').select('id, status, created_at'),
                supabase.from('products').select('id'),
                supabase.from('inventory_transactions').select('id, quantity, transaction_type, created_at, products(name, sku)').order('created_at', { ascending: false }).limit(100)
            ])

            const leads = leadsRes.data || []
            const products = productsRes.data || []
            const transactions = txRes.data || []

            // Revenue = sum of absolute quantity of SALE transactions (treat as revenue units)
            const salesTx = transactions.filter((t: any) => t.transaction_type === 'SALE')
            const revenue = salesTx.reduce((sum: number, t: any) => sum + Math.abs(Number(t.quantity)), 0)

            // Sales chart — group last 7 days
            const last7: Record<string, number> = {}
            for (let i = 6; i >= 0; i--) {
                const d = new Date()
                d.setDate(d.getDate() - i)
                const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                last7[key] = 0
            }
            salesTx.forEach((t: any) => {
                const d = new Date(t.created_at)
                const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                if (key in last7) last7[key] += Math.abs(Number(t.quantity))
            })
            const chartData = Object.entries(last7).map(([name, value]) => ({ name, value }))

            // Recent activity = last 5 transactions
            const recent = transactions.slice(0, 5)

            return {
                totalLeads: leads.length,
                activeLeads: leads.filter((l: any) => !['CLOSED', 'LOST'].includes(l.status)).length,
                totalProducts: products.length,
                totalTx: transactions.length,
                revenue,
                chartData,
                recent,
            }
        }
    })
}

export default function DashboardPage() {
    const { data, isLoading } = useDashboardData()

    useRealtimeSync('inventory_transactions', ['dashboard-all'])
    useRealtimeSync('leads', ['dashboard-all'])
    useRealtimeSync('products', ['dashboard-all'])

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
                </div>
                <Skeleton className="h-[400px] w-full rounded-2xl" />
            </div>
        )
    }

    const stats = data || { totalLeads: 0, activeLeads: 0, totalProducts: 0, totalTx: 0, revenue: 0, chartData: [], recent: [] }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Executive Overview</h1>
                <p className="text-muted-foreground">Real-time performance metrics across your organization.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="rounded-2xl border-none shadow-md bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-blue-100">Sales Volume</CardTitle>
                        <DollarSign className="h-4 w-4 text-blue-100" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.revenue.toLocaleString()} <span className="text-base font-normal text-blue-200">units</span></div>
                        <div className="flex items-center mt-1 text-xs text-blue-100">
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                            <span>All time sales out</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-none shadow-md bg-gradient-to-br from-indigo-600 to-indigo-700 text-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-indigo-100">Active Leads</CardTitle>
                        <Users className="h-4 w-4 text-indigo-100" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.activeLeads.toLocaleString()}</div>
                        <div className="flex items-center mt-1 text-xs text-indigo-100">
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                            <span>{stats.totalLeads} total leads in CRM</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Products</CardTitle>
                        <Box className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.totalProducts.toLocaleString()}</div>
                        <div className="flex items-center mt-1 text-xs text-muted-foreground">
                            <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                            <span>Active SKUs in inventory</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.totalTx.toLocaleString()}</div>
                        <div className="flex items-center mt-1 text-xs text-muted-foreground">
                            <Package className="h-3 w-3 mr-1 text-blue-500" />
                            <span>Ledger entries recorded</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Sales Chart */}
                <Card className="lg:col-span-4 rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <CardHeader>
                        <CardTitle>Sales Activity (Last 7 Days)</CardTitle>
                        <CardDescription>Units sold per day from inventory ledger.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {stats.chartData.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                                No sales transactions yet. Record some in Stock Ledger.
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#fff', borderRadius: '12px',
                                            border: '1px solid #e2e8f0',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                        }}
                                    />
                                    <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Ledger Activity */}
                <Card className="lg:col-span-3 rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-primary" />
                            Recent Ledger Activity
                        </CardTitle>
                        <CardDescription>Live feed of inventory movements.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {stats.recent.length === 0 ? (
                            <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
                                No transactions yet.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {stats.recent.map((item: any) => (
                                    <div key={item.id} className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${Number(item.quantity) < 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                {Number(item.quantity) < 0
                                                    ? <ArrowDownRight className="h-4 w-4" />
                                                    : <ArrowUpRight className="h-4 w-4" />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold truncate max-w-[140px]">{item.products?.name || 'Unknown'}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{item.transaction_type}</p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className={`text-sm font-bold ${Number(item.quantity) < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                {Number(item.quantity) > 0 ? '+' : ''}{item.quantity} u
                                            </p>
                                            <p className="text-[10px] text-muted-foreground">
                                                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <Link href="/dashboard/inventory/ledger">
                            <Button variant="outline" className="w-full mt-4 rounded-xl h-10 border-dashed text-sm">
                                View Full Audit Log
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
