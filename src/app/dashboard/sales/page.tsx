'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeSync } from '@/hooks/use-erp-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog'
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
    Plus, ShoppingBag, MoreHorizontal, Pencil, Trash2, Loader2,
    Search, TrendingUp, Package, CheckCircle2, Clock
} from 'lucide-react'
import { toast } from 'sonner'

const supabase = createClient()

const STATUS_CONFIG: Record<string, { label: string, className: string }> = {
    PENDING: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    CONFIRMED: { label: 'Confirmed', className: 'bg-blue-50 text-blue-700 border-blue-200' },
    SHIPPED: { label: 'Shipped', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    DELIVERED: { label: 'Delivered', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    CANCELLED: { label: 'Cancelled', className: 'bg-red-50 text-red-600 border-red-200' },
}

const emptyForm = {
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    total_amount: '',
    status: 'PENDING',
    order_date: new Date().toISOString().split('T')[0],
    notes: '',
}

function useSalesOrders() {
    return useQuery({
        queryKey: ['sales_orders'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('sales_orders')
                .select('*')
                .order('created_at', { ascending: false })
            if (error) throw error
            return data
        }
    })
}

export default function SalesPage() {
    const qc = useQueryClient()
    const { data: orders, isLoading } = useSalesOrders()
    useRealtimeSync('sales_orders', ['sales_orders'])

    const [search, setSearch] = useState('')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [editing, setEditing] = useState<any>(null)
    const [form, setForm] = useState(emptyForm)
    const [saving, setSaving] = useState(false)

    const openAdd = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true) }
    const openEdit = (o: any) => {
        setEditing(o)
        setForm({
            customer_name: o.customer_name || '',
            customer_email: o.customer_email || '',
            customer_phone: o.customer_phone || '',
            total_amount: String(o.total_amount || ''),
            status: o.status || 'PENDING',
            order_date: o.order_date || new Date().toISOString().split('T')[0],
            notes: o.notes || '',
        })
        setDialogOpen(true)
    }

    const handleSave = async () => {
        if (!form.customer_name || !form.total_amount) return toast.error('Customer name and amount are required.')
        setSaving(true)
        const payload = {
            customer_name: form.customer_name,
            customer_email: form.customer_email,
            customer_phone: form.customer_phone,
            total_amount: parseFloat(form.total_amount),
            status: form.status,
            order_date: form.order_date,
            notes: form.notes,
        }
        const { error } = editing
            ? await supabase.from('sales_orders').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editing.id)
            : await supabase.from('sales_orders').insert({ ...payload, order_number: '' })
        setSaving(false)
        if (error) return toast.error(error.message)
        toast.success(editing ? 'Order updated!' : 'Order created!')
        qc.invalidateQueries({ queryKey: ['sales_orders'] })
        setDialogOpen(false)
    }

    const handleDelete = async () => {
        if (!deleteId) return
        const { error } = await supabase.from('sales_orders').delete().eq('id', deleteId)
        setDeleteId(null)
        if (error) return toast.error(error.message)
        toast.success('Order removed.')
        qc.invalidateQueries({ queryKey: ['sales_orders'] })
    }

    const handleStatusChange = async (id: string, status: string) => {
        const { error } = await supabase.from('sales_orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
        if (error) return toast.error(error.message)
        toast.success(`Order marked as ${STATUS_CONFIG[status]?.label}`)
        qc.invalidateQueries({ queryKey: ['sales_orders'] })
    }

    const f = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }))

    const filtered = (orders || []).filter((o: any) =>
        o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
        o.order_number?.toLowerCase().includes(search.toLowerCase())
    )

    // KPI summaries
    const total = orders?.length || 0
    const revenue = orders?.reduce((s: number, o: any) => s + Number(o.total_amount || 0), 0) || 0
    const pending = orders?.filter((o: any) => o.status === 'PENDING').length || 0
    const delivered = orders?.filter((o: any) => o.status === 'DELIVERED').length || 0

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Sales Orders</h1>
                    <p className="text-muted-foreground">Manage customer orders from creation to delivery.</p>
                </div>
                <Button className="rounded-xl h-11 px-6 shadow-md shadow-primary/20" onClick={openAdd}>
                    <Plus className="mr-2 h-4 w-4" /> New Order
                </Button>
            </div>

            {/* KPI Row */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                {[
                    { label: 'Total Orders', value: total, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                    { label: 'Total Revenue', value: `IDR ${revenue.toLocaleString('id-ID')}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                    { label: 'Pending', value: pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                    { label: 'Delivered', value: delivered, icon: CheckCircle2, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
                ].map(kpi => (
                    <Card key={kpi.label} className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${kpi.bg}`}>
                                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">{kpi.label}</p>
                                <p className="text-xl font-bold truncate max-w-[120px]">{kpi.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Orders Table */}
            <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                <CardHeader className="bg-zinc-50/50 border-b py-3 px-4">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search by customer or order no…"
                            className="pl-10 h-9 rounded-xl" />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-zinc-100/50 dark:bg-zinc-800/50">
                            <TableRow>
                                <TableHead>Order #</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Notes</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? Array.from({ length: 4 }).map((_, i) => (
                                <TableRow key={i}>
                                    {Array.from({ length: 7 }).map((_, j) => (
                                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                                    ))}
                                </TableRow>
                            )) : filtered.map((order: any) => {
                                const st = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING
                                return (
                                    <TableRow key={order.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/50">
                                        <TableCell>
                                            <span className="font-mono text-xs font-semibold text-primary">
                                                {order.order_number || '—'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-semibold text-sm">{order.customer_name}</div>
                                            <div className="text-[11px] text-muted-foreground">{order.customer_email}</div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(order.order_date).toLocaleDateString('id-ID')}
                                        </TableCell>
                                        <TableCell className="font-semibold text-sm">
                                            IDR {Number(order.total_amount).toLocaleString('id-ID')}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`rounded-lg text-xs border ${st.className}`}>
                                                {st.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">
                                            {order.notes || '—'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-xl w-48">
                                                    <DropdownMenuItem onClick={() => openEdit(order)}>
                                                        <Pencil className="mr-2 h-4 w-4" /> Edit Order
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                                        <DropdownMenuItem key={key}
                                                            disabled={order.status === key}
                                                            onClick={() => handleStatusChange(order.id, key)}
                                                            className="text-xs">
                                                            Mark as {cfg.label}
                                                        </DropdownMenuItem>
                                                    ))}
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-red-600"
                                                        onClick={() => setDeleteId(order.id)}>
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                            {!isLoading && filtered.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-48">
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            <Package className="h-8 w-8 opacity-20" />
                                            <p className="text-sm">No orders yet. Click "New Order" to get started.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Add / Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={v => { setDialogOpen(v); if (!v) { setEditing(null); setForm(emptyForm) } }}>
                <DialogContent className="rounded-2xl max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit Order' : 'Create New Sales Order'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-2">
                        <div className="col-span-2 space-y-1.5">
                            <Label>Customer Name <span className="text-red-500">*</span></Label>
                            <Input value={form.customer_name} onChange={e => f('customer_name', e.target.value)}
                                placeholder="e.g. PT. Maju Bersama" className="rounded-xl h-10" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Customer Email</Label>
                            <Input type="email" value={form.customer_email} onChange={e => f('customer_email', e.target.value)}
                                placeholder="contact@company.com" className="rounded-xl h-10" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Customer Phone</Label>
                            <Input value={form.customer_phone} onChange={e => f('customer_phone', e.target.value)}
                                placeholder="08xx-xxxx" className="rounded-xl h-10" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Total Amount (IDR) <span className="text-red-500">*</span></Label>
                            <Input type="number" value={form.total_amount} onChange={e => f('total_amount', e.target.value)}
                                placeholder="5000000" className="rounded-xl h-10" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Order Date</Label>
                            <Input type="date" value={form.order_date} onChange={e => f('order_date', e.target.value)}
                                className="rounded-xl h-10" />
                        </div>
                        <div className="col-span-2 space-y-1.5">
                            <Label>Status</Label>
                            <Select value={form.status} onValueChange={v => f('status', v)}>
                                <SelectTrigger className="rounded-xl h-10"><SelectValue /></SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                        <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="col-span-2 space-y-1.5">
                            <Label>Notes</Label>
                            <Textarea value={form.notes} onChange={e => f('notes', e.target.value)}
                                placeholder="Additional notes, PO number, etc." rows={2}
                                className="rounded-xl resize-none" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="rounded-xl" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button className="rounded-xl" onClick={handleSave} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editing ? 'Save Changes' : 'Create Order'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm */}
            <AlertDialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Order?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove this sales order from the system.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                        <AlertDialogAction className="rounded-xl bg-red-600 hover:bg-red-700" onClick={handleDelete}>
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
