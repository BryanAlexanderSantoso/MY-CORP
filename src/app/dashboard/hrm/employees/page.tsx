'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeSync } from '@/hooks/use-erp-data'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
import { UserPlus, Users, MoreHorizontal, Pencil, Trash2, Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'

const supabase = createClient()

const emptyForm = {
    full_name: '',
    email: '',
    phone: '',
    designation: '',
    department: '',
    base_salary: '',
    joined_at: new Date().toISOString().split('T')[0],
    status: 'ACTIVE',
}

function useEmployees() {
    return useQuery({
        queryKey: ['employees'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .order('created_at', { ascending: false })
            if (error) throw error
            return data
        }
    })
}

export default function EmployeesPage() {
    const qc = useQueryClient()
    const { data: employees, isLoading } = useEmployees()
    useRealtimeSync('employees', ['employees'])

    const [search, setSearch] = useState('')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [editing, setEditing] = useState<any>(null)
    const [form, setForm] = useState(emptyForm)
    const [saving, setSaving] = useState(false)

    const openAdd = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true) }
    const openEdit = (e: any) => {
        setEditing(e)
        setForm({
            full_name: e.full_name || '',
            email: e.email || '',
            phone: e.phone || '',
            designation: e.designation || '',
            department: e.department || '',
            base_salary: String(e.base_salary || ''),
            joined_at: e.joined_at || new Date().toISOString().split('T')[0],
            status: e.status || 'ACTIVE',
        })
        setDialogOpen(true)
    }

    const handleSave = async () => {
        if (!form.full_name) return toast.error('Full name is required.')
        setSaving(true)
        const payload = {
            full_name: form.full_name,
            email: form.email,
            phone: form.phone,
            designation: form.designation,
            department: form.department,
            base_salary: parseFloat(form.base_salary) || 0,
            joined_at: form.joined_at,
            status: form.status,
        }
        const { error } = editing
            ? await supabase.from('employees').update(payload).eq('id', editing.id)
            : await supabase.from('employees').insert(payload)
        setSaving(false)
        if (error) return toast.error(error.message)
        toast.success(editing ? 'Employee updated!' : 'Employee added!')
        qc.invalidateQueries({ queryKey: ['employees'] })
        setDialogOpen(false)
    }

    const handleDelete = async () => {
        if (!deleteId) return
        const { error } = await supabase.from('employees').delete().eq('id', deleteId)
        setDeleteId(null)
        if (error) return toast.error(error.message)
        toast.success('Employee removed.')
        qc.invalidateQueries({ queryKey: ['employees'] })
    }

    const f = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }))

    const displayed = (employees || []).filter((e: any) =>
        e.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        e.department?.toLowerCase().includes(search.toLowerCase()) ||
        e.designation?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Staff Directory</h1>
                    <p className="text-muted-foreground">Manage employee records and organizational details.</p>
                </div>
                <Button className="rounded-xl h-11 px-6 shadow-md shadow-primary/20" onClick={openAdd}>
                    <UserPlus className="mr-2 h-4 w-4" /> Add Employee
                </Button>
            </div>

            <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                <CardHeader className="bg-zinc-50/50 border-b py-3 px-4">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search by name, department…"
                            className="pl-10 h-9 rounded-xl" />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-zinc-100/50 dark:bg-zinc-800/50">
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Designation</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Base Salary</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead>Status</TableHead>
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
                            )) : displayed.map((emp: any) => (
                                <TableRow key={emp.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/50">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9 border border-zinc-200 rounded-xl">
                                                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs rounded-xl">
                                                    {emp.full_name?.substring(0, 2).toUpperCase() || 'EM'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-semibold text-sm">{emp.full_name || '—'}</div>
                                                <div className="text-[11px] text-muted-foreground">{emp.email || ''}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm">{emp.designation || '—'}</TableCell>
                                    <TableCell>
                                        {emp.department
                                            ? <Badge variant="outline" className="rounded-lg text-xs">{emp.department}</Badge>
                                            : <span className="text-muted-foreground text-sm">—</span>}
                                    </TableCell>
                                    <TableCell className="font-medium text-sm">
                                        {emp.base_salary ? `IDR ${Number(emp.base_salary).toLocaleString('id-ID')}` : '—'}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {emp.joined_at ? new Date(emp.joined_at).toLocaleDateString('id-ID') : '—'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={`rounded-lg text-xs border-none ${emp.status === 'ACTIVE'
                                                ? 'bg-emerald-50 text-emerald-700'
                                                : 'bg-zinc-100 text-zinc-500'
                                            }`}>
                                            {emp.status || 'ACTIVE'}
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
                                                <DropdownMenuItem onClick={() => openEdit(emp)}>
                                                    <Pencil className="mr-2 h-4 w-4" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-600" onClick={() => setDeleteId(emp.id)}>
                                                    <Trash2 className="mr-2 h-4 w-4" /> Remove
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!isLoading && displayed.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-40">
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            <Users className="h-8 w-8 opacity-20" />
                                            <p className="text-sm">No employees found. Click "Add Employee" to get started.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Add / Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="rounded-2xl max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-2">
                        <div className="col-span-2 space-y-1.5">
                            <Label>Full Name <span className="text-red-500">*</span></Label>
                            <Input value={form.full_name} onChange={e => f('full_name', e.target.value)}
                                placeholder="e.g. Budi Santoso" className="rounded-xl h-10" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Email</Label>
                            <Input type="email" value={form.email} onChange={e => f('email', e.target.value)}
                                placeholder="budi@company.com" className="rounded-xl h-10" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Phone</Label>
                            <Input value={form.phone} onChange={e => f('phone', e.target.value)}
                                placeholder="08xx-xxxx-xxxx" className="rounded-xl h-10" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Designation</Label>
                            <Input value={form.designation} onChange={e => f('designation', e.target.value)}
                                placeholder="e.g. Software Engineer" className="rounded-xl h-10" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Department</Label>
                            <Input value={form.department} onChange={e => f('department', e.target.value)}
                                placeholder="e.g. Engineering" className="rounded-xl h-10" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Base Salary (IDR)</Label>
                            <Input type="number" value={form.base_salary} onChange={e => f('base_salary', e.target.value)}
                                placeholder="5000000" className="rounded-xl h-10" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Join Date</Label>
                            <Input type="date" value={form.joined_at} onChange={e => f('joined_at', e.target.value)}
                                className="rounded-xl h-10" />
                        </div>
                        <div className="col-span-2 space-y-1.5">
                            <Label>Status</Label>
                            <Select value={form.status} onValueChange={v => f('status', v)}>
                                <SelectTrigger className="rounded-xl h-10"><SelectValue /></SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="ACTIVE">Active</SelectItem>
                                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                                    <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                                    <SelectItem value="TERMINATED">Terminated</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="rounded-xl" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button className="rounded-xl" onClick={handleSave} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editing ? 'Save Changes' : 'Add Employee'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm */}
            <AlertDialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Employee?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the employee record from the system.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                        <AlertDialogAction className="rounded-xl bg-red-600 hover:bg-red-700" onClick={handleDelete}>
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
