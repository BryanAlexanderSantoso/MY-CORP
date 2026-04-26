'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useTransactions, useProducts, useWarehouses, useRealtimeSync } from '@/hooks/use-erp-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Plus, ArrowDownRight, ArrowUpRight, History, Trash2, Loader2, MoreHorizontal, Pencil } from 'lucide-react'
import { toast } from 'sonner'

const supabase = createClient()
const TYPES = ['PURCHASE', 'SALE', 'ADJUSTMENT', 'RETURN', 'TRANSFER']
const emptyForm = { product_id: '', warehouse_id: '', transaction_type: 'PURCHASE', quantity: '', notes: '' }

export default function LedgerPage() {
    const qc = useQueryClient()
    const { data: transactions, isLoading } = useTransactions()
    const { data: products } = useProducts()
    const { data: warehouses } = useWarehouses()
    useRealtimeSync('inventory_transactions', ['transactions', 'products'])

    const [dialogOpen, setDialogOpen] = useState(false)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [editing, setEditing] = useState<any>(null)
    const [form, setForm] = useState(emptyForm)
    const [saving, setSaving] = useState(false)

    const openAdd = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true) }
    const openEdit = (t: any) => {
        setEditing(t)
        setForm({
            product_id: t.product_id,
            warehouse_id: t.warehouse_id || '',
            transaction_type: t.transaction_type,
            quantity: String(Math.abs(t.quantity)),
            notes: t.notes || '',
        })
        setDialogOpen(true)
    }

    const handleSave = async () => {
        if (!form.product_id || !form.quantity) return toast.error('Product and quantity are required.')
        setSaving(true)
        const qty = parseInt(form.quantity)
        const finalQty = ['SALE', 'TRANSFER'].includes(form.transaction_type) ? -Math.abs(qty) : Math.abs(qty)
        const payload = {
            product_id: form.product_id,
            warehouse_id: form.warehouse_id || null,
            transaction_type: form.transaction_type,
            quantity: finalQty,
            notes: form.notes,
        }
        const { error } = editing
            ? await supabase.from('inventory_transactions').update(payload).eq('id', editing.id)
            : await supabase.from('inventory_transactions').insert(payload)
        setSaving(false)
        if (error) return toast.error(error.message)
        toast.success(editing ? 'Transaction updated!' : 'Transaction recorded!')
        qc.invalidateQueries({ queryKey: ['transactions'] })
        qc.invalidateQueries({ queryKey: ['products'] })
        setDialogOpen(false)
        setForm(emptyForm)
        setEditing(null)
    }

    const handleDelete = async () => {
        if (!deleteId) return
        const { error } = await supabase.from('inventory_transactions').delete().eq('id', deleteId)
        setDeleteId(null)
        if (error) return toast.error(error.message)
        toast.success('Transaction reversed/removed.')
        qc.invalidateQueries({ queryKey: ['transactions'] })
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Stock Ledger</h1>
                    <p className="text-muted-foreground">Full audit trail of inventory double-entry movements.</p>
                </div>
                <Button className="rounded-xl h-11 px-6 shadow-md shadow-primary/20" onClick={openAdd}>
                    <Plus className="mr-2 h-4 w-4" /> Record Transaction
                </Button>
            </div>

            <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                <CardHeader className="bg-zinc-50/50 border-b">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <History className="h-5 w-5 text-primary" /> Transaction History
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-zinc-100/50 dark:bg-zinc-800/50">
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead>Warehouse</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Qty</TableHead>
                                <TableHead>Notes</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
                            )) : transactions?.map((t: any) => (
                                <TableRow key={t.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/50">
                                    <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                                        {new Date(t.created_at).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-semibold">{t.products?.name}</div>
                                        <div className="text-[10px] text-muted-foreground">{t.products?.sku}</div>
                                    </TableCell>
                                    <TableCell className="text-sm">{t.warehouses?.name || '—'}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="rounded-lg text-[10px] uppercase">{t.transaction_type}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 font-bold">
                                            {t.quantity > 0
                                                ? <ArrowUpRight className="h-3 w-3 text-green-500" />
                                                : <ArrowDownRight className="h-3 w-3 text-red-500" />}
                                            <span className={t.quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                                                {t.quantity > 0 ? '+' : ''}{t.quantity}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">{t.notes || '—'}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-xl">
                                                <DropdownMenuItem onClick={() => openEdit(t)}>
                                                    <Pencil className="mr-2 h-4 w-4" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-600" onClick={() => setDeleteId(t.id)}>
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!isLoading && (!transactions || transactions.length === 0) && (
                                <TableRow><TableCell colSpan={7} className="text-center h-32 text-muted-foreground">No transactions yet.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Add Transaction Dialog */}
            <Dialog open={dialogOpen} onOpenChange={v => { setDialogOpen(v); if (!v) { setEditing(null); setForm(emptyForm) } }}>
                <DialogContent className="rounded-2xl max-w-md">
                    <DialogHeader><DialogTitle>{editing ? 'Edit Transaction' : 'Record New Transaction'}</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label>Product</Label>
                            <Select value={form.product_id} onValueChange={v => setForm(p => ({ ...p, product_id: v }))}>
                                <SelectTrigger className="rounded-xl h-10"><SelectValue placeholder="Select product…" /></SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {products?.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Warehouse</Label>
                            <Select value={form.warehouse_id} onValueChange={v => setForm(p => ({ ...p, warehouse_id: v }))}>
                                <SelectTrigger className="rounded-xl h-10"><SelectValue placeholder="Select warehouse (optional)…" /></SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {warehouses?.map((w: any) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Transaction Type</Label>
                            <Select value={form.transaction_type} onValueChange={v => setForm(p => ({ ...p, transaction_type: v }))}>
                                <SelectTrigger className="rounded-xl h-10"><SelectValue /></SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Quantity</Label>
                            <Input type="number" placeholder="e.g. 10" value={form.quantity}
                                onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))}
                                className="rounded-xl h-10" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Notes (optional)</Label>
                            <Input placeholder="Batch no, PO reference, etc." value={form.notes}
                                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                                className="rounded-xl h-10" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="rounded-xl" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button className="rounded-xl" onClick={handleSave} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editing ? 'Save Changes' : 'Record'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Reverse Transaction?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete this ledger entry and affect stock counts.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                        <AlertDialogAction className="rounded-xl bg-red-600 hover:bg-red-700" onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
