'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useLeads, useRealtimeSync } from '@/hooks/use-erp-data'
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
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Loader2, Mail, Phone } from 'lucide-react'
import { toast } from 'sonner'

const supabase = createClient()
const STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'CLOSED']
const emptyForm = { name: '', company: '', email: '', phone: '', status: 'NEW', lead_score: '50' }

export default function LeadsPage() {
    const qc = useQueryClient()
    const { data: leads, isLoading } = useLeads()
    useRealtimeSync('leads', ['leads'])

    const [search, setSearch] = useState('')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [editing, setEditing] = useState<any>(null)
    const [form, setForm] = useState(emptyForm)
    const [saving, setSaving] = useState(false)

    const openAdd = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true) }
    const openEdit = (l: any) => {
        setEditing(l)
        setForm({ name: l.name, company: l.company || '', email: l.email || '', phone: l.phone || '', status: l.status, lead_score: String(l.lead_score || 50) })
        setDialogOpen(true)
    }

    const handleSave = async () => {
        if (!form.name) return toast.error('Name is required.')
        setSaving(true)
        const payload = {
            name: form.name, company: form.company, email: form.email,
            phone: form.phone, status: form.status,
            lead_score: parseInt(form.lead_score),
        }
        const { error } = editing
            ? await supabase.from('leads').update(payload).eq('id', editing.id)
            : await supabase.from('leads').insert(payload)
        setSaving(false)
        if (error) return toast.error(error.message)
        toast.success(editing ? 'Lead updated!' : 'Lead created!')
        qc.invalidateQueries({ queryKey: ['leads'] })
        setDialogOpen(false)
    }

    const handleDelete = async () => {
        if (!deleteId) return
        const { error } = await supabase.from('leads').delete().eq('id', deleteId)
        setDeleteId(null)
        if (error) return toast.error(error.message)
        toast.success('Lead removed.')
        qc.invalidateQueries({ queryKey: ['leads'] })
    }

    const displayed = (leads || []).filter((l: any) =>
        l.name?.toLowerCase().includes(search.toLowerCase()) ||
        l.company?.toLowerCase().includes(search.toLowerCase())
    )

    const statusColor: Record<string, string> = {
        NEW: 'bg-blue-100 text-blue-700',
        CONTACTED: 'bg-indigo-100 text-indigo-700',
        QUALIFIED: 'bg-purple-100 text-purple-700',
        PROPOSAL: 'bg-amber-100 text-amber-700',
        CLOSED: 'bg-green-100 text-green-700',
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Lead Management</h1>
                    <p className="text-muted-foreground">Track and manage your full sales pipeline.</p>
                </div>
                <Button className="rounded-xl h-11 px-6 shadow-md shadow-primary/20" onClick={openAdd}>
                    <Plus className="mr-2 h-4 w-4" /> Add Lead
                </Button>
            </div>

            <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or company…" className="pl-10 h-10 rounded-xl" />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-zinc-100/50 dark:bg-zinc-800/50">
                            <TableRow>
                                <TableHead>Lead</TableHead>
                                <TableHead>Score</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? Array.from({ length: 4 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>) :
                                displayed.map((l: any) => (
                                    <TableRow key={l.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/50">
                                        <TableCell>
                                            <div className="font-semibold">{l.name}</div>
                                            <div className="text-xs text-muted-foreground">{l.company || 'Private'}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-16 bg-zinc-100 rounded-full overflow-hidden">
                                                    <div className={`h-full ${l.lead_score > 70 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${l.lead_score}%` }} />
                                                </div>
                                                <span className="text-xs font-bold">{l.lead_score}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-3 text-muted-foreground">
                                                {l.email && <a href={`mailto:${l.email}`}><Mail className="h-4 w-4 hover:text-primary transition-colors" /></a>}
                                                {l.phone && <a href={`tel:${l.phone}`}><Phone className="h-4 w-4 hover:text-primary transition-colors" /></a>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`rounded-lg text-[10px] border-none ${statusColor[l.status] || 'bg-zinc-100 text-zinc-700'}`}>
                                                {l.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {new Date(l.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-xl">
                                                    <DropdownMenuItem onClick={() => openEdit(l)}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-600" onClick={() => setDeleteId(l.id)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            {!isLoading && displayed.length === 0 && (
                                <TableRow><TableCell colSpan={6} className="text-center h-40 text-muted-foreground">No leads yet. Add your first prospect.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="rounded-2xl max-w-md">
                    <DialogHeader><DialogTitle>{editing ? 'Edit Lead' : 'New Lead'}</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-2">
                        {[
                            { label: 'Full Name', key: 'name', placeholder: 'e.g. Alice Johnson' },
                            { label: 'Company', key: 'company', placeholder: 'e.g. Global Tech Inc' },
                            { label: 'Email', key: 'email', type: 'email', placeholder: 'alice@example.com' },
                            { label: 'Phone', key: 'phone', placeholder: '+62 812...' },
                            { label: 'Lead Score (0–100)', key: 'lead_score', type: 'number', placeholder: '50' },
                        ].map(f => (
                            <div key={f.key} className="space-y-1.5">
                                <Label>{f.label}</Label>
                                <Input type={f.type || 'text'} placeholder={f.placeholder}
                                    value={(form as any)[f.key]}
                                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                                    className="rounded-xl h-10" />
                            </div>
                        ))}
                        <div className="space-y-1.5">
                            <Label>Status</Label>
                            <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                                <SelectTrigger className="rounded-xl h-10"><SelectValue /></SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="rounded-xl" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button className="rounded-xl" onClick={handleSave} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editing ? 'Save Changes' : 'Create Lead'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove this lead?</AlertDialogTitle>
                        <AlertDialogDescription>This is permanent and cannot be undone.</AlertDialogDescription>
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
