'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useProducts, useRealtimeSync, useWarehouses } from '@/hooks/use-erp-data'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
    Plus, Search, MoreHorizontal, AlertTriangle, Pencil, Trash2, Loader2
} from 'lucide-react'
import { toast } from 'sonner'

const supabase = createClient()

const emptyForm = { name: '', sku: '', category: '', price: '', min_stock: '5' }

export default function ProductsPage() {
    const qc = useQueryClient()
    const { data: products, isLoading } = useProducts()
    const { data: warehouses } = useWarehouses()
    useRealtimeSync('inventory_transactions', ['products'])
    useRealtimeSync('products', ['products'])

    const [search, setSearch] = useState('')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [editing, setEditing] = useState<any>(null)
    const [form, setForm] = useState(emptyForm)
    const [saving, setSaving] = useState(false)

    const openAdd = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true) }
    const openEdit = (p: any) => {
        setEditing(p)
        setForm({ name: p.name, sku: p.sku, category: p.category || '', price: String(p.price), min_stock: String(p.minStock || 5) })
        setDialogOpen(true)
    }

    const handleSave = async () => {
        if (!form.name || !form.price) return toast.error('Name and price are required.')
        setSaving(true)
        const payload: any = {
            name: form.name,
            sku: form.sku,
            category: form.category,
            price: parseFloat(form.price),
        }
        // Only include min_stock if column exists (migration 007 has been run)
        if (form.min_stock) payload.min_stock = parseInt(form.min_stock)

        const { error } = editing
            ? await supabase.from('products').update(payload).eq('id', editing.id)
            : await supabase.from('products').insert(payload)
        setSaving(false)
        if (error) return toast.error(error.message)
        toast.success(editing ? 'Product updated!' : 'Product added!')
        qc.invalidateQueries({ queryKey: ['products'] })
        setDialogOpen(false)
    }

    const handleDelete = async () => {
        if (!deleteId) return
        const { error } = await supabase.from('products').delete().eq('id', deleteId)
        setDeleteId(null)
        if (error) return toast.error(error.message)
        toast.success('Product deleted.')
        qc.invalidateQueries({ queryKey: ['products'] })
    }

    const displayed = (products || []).filter((p: any) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Product Inventory</h1>
                    <p className="text-muted-foreground">Manage your catalog and monitor real-time stock levels.</p>
                </div>
                <Button className="rounded-xl h-11 px-6 shadow-md shadow-primary/20" onClick={openAdd}>
                    <Plus className="mr-2 h-4 w-4" /> Add Product
                </Button>
            </div>

            <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search products, SKUs…"
                            className="pl-10 h-10 rounded-xl bg-white dark:bg-zinc-950" />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-zinc-100/50 dark:bg-zinc-800/50">
                            <TableRow>
                                <TableHead className="w-[300px]">Product</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Stock</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? Array.from({ length: 4 }).map((_, i) => (
                                <TableRow key={i}>
                                    {[200, 100, 80, 60, 100, 40].map((w, j) => (
                                        <TableCell key={j}><Skeleton className={`h-4 w-[${w}px]`} /></TableCell>
                                    ))}
                                </TableRow>
                            )) : displayed.map((p: any) => (
                                <TableRow key={p.id} className="group hover:bg-zinc-50/80 dark:hover:bg-zinc-900/50">
                                    <TableCell>
                                        <div className="font-semibold">{p.name}</div>
                                        <div className="text-xs text-muted-foreground font-mono">{p.sku}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="rounded-lg">{p.category || '—'}</Badge>
                                    </TableCell>
                                    <TableCell className="font-medium">${p.price?.toLocaleString()}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <span className={`text-sm font-bold ${p.stock < (p.minStock || 5) ? 'text-red-500' : ''}`}>
                                                {p.stock} units
                                            </span>
                                            {p.stock < (p.minStock || 5) && (
                                                <span className="text-[10px] text-red-500 flex items-center gap-1">
                                                    <AlertTriangle className="h-2.5 w-2.5" /> Low Stock
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={`rounded-xl border-none text-[11px] ${p.stock > (p.minStock || 5) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {p.stock > (p.minStock || 5) ? 'Healthy' : 'Low Stock'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-xl">
                                                <DropdownMenuItem onClick={() => openEdit(p)}>
                                                    <Pencil className="mr-2 h-4 w-4" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-600" onClick={() => setDeleteId(p.id)}>
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!isLoading && displayed.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-40 text-muted-foreground">
                                        No products found. Click "Add Product" to get started.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Add / Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="rounded-2xl max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        {[
                            { label: 'Product Name', key: 'name', placeholder: 'e.g. MacBook Pro M3' },
                            { label: 'SKU', key: 'sku', placeholder: 'e.g. MBP-001' },
                            { label: 'Category', key: 'category', placeholder: 'e.g. Laptops' },
                            { label: 'Price (USD)', key: 'price', placeholder: '0.00', type: 'number' },
                            { label: 'Min Stock (Reorder Point)', key: 'min_stock', placeholder: '5', type: 'number' },
                        ].map(f => (
                            <div key={f.key} className="space-y-1.5">
                                <Label>{f.label}</Label>
                                <Input
                                    type={f.type || 'text'}
                                    placeholder={f.placeholder}
                                    value={(form as any)[f.key]}
                                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                    className="rounded-xl h-10"
                                />
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="rounded-xl" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button className="rounded-xl" onClick={handleSave} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editing ? 'Save Changes' : 'Add Product'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm */}
            <AlertDialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Product?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. All inventory transactions related to this product will be orphaned.
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
