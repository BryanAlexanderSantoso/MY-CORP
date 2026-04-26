'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useWarehouses, useRealtimeSync } from '@/hooks/use-erp-data'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { MapPin, Warehouse, Box, ArrowRight, ShieldCheck, Plus, MoreHorizontal, Pencil, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const supabase = createClient()
const emptyForm = { name: '', location: '' }

export default function WarehousesPage() {
    const qc = useQueryClient()
    const { data: warehouses, isLoading } = useWarehouses()
    useRealtimeSync('warehouses', ['warehouses'])

    const [dialogOpen, setDialogOpen] = useState(false)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [editing, setEditing] = useState<any>(null)
    const [form, setForm] = useState(emptyForm)
    const [saving, setSaving] = useState(false)

    const openAdd = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true) }
    const openEdit = (w: any) => { setEditing(w); setForm({ name: w.name, location: w.location || '' }); setDialogOpen(true) }

    const handleSave = async () => {
        if (!form.name) return toast.error('Warehouse name is required.')
        setSaving(true)
        const { error } = editing
            ? await supabase.from('warehouses').update({ name: form.name, location: form.location }).eq('id', editing.id)
            : await supabase.from('warehouses').insert({ name: form.name, location: form.location })
        setSaving(false)
        if (error) return toast.error(error.message)
        toast.success(editing ? 'Warehouse updated!' : 'Warehouse added!')
        qc.invalidateQueries({ queryKey: ['warehouses'] })
        setDialogOpen(false)
    }

    const handleDelete = async () => {
        if (!deleteId) return
        const { error } = await supabase.from('warehouses').delete().eq('id', deleteId)
        setDeleteId(null)
        if (error) return toast.error(error.message)
        toast.success('Warehouse removed.')
        qc.invalidateQueries({ queryKey: ['warehouses'] })
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Warehouse Network</h1>
                    <p className="text-muted-foreground">Manage storage nodes and logistics infrastructure.</p>
                </div>
                <Button className="rounded-xl h-11 px-6 shadow-md shadow-primary/20" onClick={openAdd}>
                    <Plus className="mr-2 h-4 w-4" /> Add Node
                </Button>
            </div>

            {isLoading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {warehouses?.map((w: any) => (
                        <Card key={w.id} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-md hover:shadow-lg transition-all bg-white dark:bg-zinc-950">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl">
                                        <Warehouse size={24} />
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-xl">
                                            <DropdownMenuItem onClick={() => openEdit(w)}>
                                                <Pencil className="mr-2 h-4 w-4" /> Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-600" onClick={() => setDeleteId(w.id)}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <CardTitle className="pt-3 text-xl">{w.name}</CardTitle>
                                <CardDescription className="flex items-center gap-1">
                                    <MapPin size={12} /> {w.location || 'No location set'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between items-center pt-2">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Box size={14} /> Operational
                                    </div>
                                    <Badge className="bg-emerald-50 text-emerald-700 border-none rounded-lg">Active</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {(!warehouses || warehouses.length === 0) && (
                        <div className="md:col-span-3 h-64 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl flex flex-col items-center justify-center text-muted-foreground gap-3">
                            <ShieldCheck size={32} className="opacity-20" />
                            <p className="text-sm">No storage nodes yet. Add your first warehouse.</p>
                        </div>
                    )}
                </div>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="rounded-2xl max-w-md">
                    <DialogHeader><DialogTitle>{editing ? 'Edit Warehouse' : 'Add New Warehouse'}</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label>Warehouse Name</Label>
                            <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                placeholder="e.g. Jakarta Central Hub" className="rounded-xl h-10" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Location / Address</Label>
                            <Input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                                placeholder="e.g. Jl. Sudirman No. 1" className="rounded-xl h-10" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="rounded-xl" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button className="rounded-xl" onClick={handleSave} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editing ? 'Save Changes' : 'Add Warehouse'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Warehouse?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently remove this warehouse node. Stock data may be affected.</AlertDialogDescription>
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
