'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeSync } from '@/hooks/use-erp-data'
import { useWorkSchedule, isLateClockIn, isEarlyClockOut, formatScheduleTime } from '@/hooks/use-work-schedule'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
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
import {
    Tabs, TabsContent, TabsList, TabsTrigger
} from '@/components/ui/tabs'
import {
    Clock, LogIn, LogOut, Users, CheckCircle2, XCircle,
    Plus, MoreHorizontal, Pencil, Trash2, Loader2, Search,
    CalendarDays, CalendarX, AlertCircle, ThumbsUp, ThumbsDown
} from 'lucide-react'
import { toast } from 'sonner'

const supabase = createClient()

function useEmployees() {
    return useQuery({
        queryKey: ['employees-list'],
        queryFn: async () => {
            const { data, error } = await supabase.from('employees').select('id, full_name, department').eq('status', 'ACTIVE').order('full_name')
            if (error) throw error
            return data || []
        }
    })
}

function useAttendance(dateFilter: string) {
    return useQuery({
        queryKey: ['attendance', dateFilter],
        queryFn: async () => {
            let q = supabase.from('attendance').select(`*, employees(id, full_name, department, designation)`).order('clock_in', { ascending: false })
            if (dateFilter) q = q.gte('clock_in', dateFilter + 'T00:00:00').lte('clock_in', dateFilter + 'T23:59:59')
            const { data, error } = await q
            if (error) throw error
            return data || []
        }
    })
}

function useLeaveRequests() {
    return useQuery({
        queryKey: ['leave-requests'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('leave_requests')
                .select(`*, employees(full_name, department)`)
                .order('created_at', { ascending: false })
            if (error) throw error
            return data || []
        }
    })
}

const emptyForm = { employee_id: '', clock_in: new Date().toISOString().slice(0, 16), clock_out: '', notes: '' }

const STATUS_MAP: Record<string, { label: string, className: string }> = {
    PENDING: { label: 'Menunggu', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    APPROVED: { label: 'Disetujui', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    REJECTED: { label: 'Ditolak', className: 'bg-red-50 text-red-600 border-red-200' },
}

export default function AttendancePage() {
    const qc = useQueryClient()
    const today = new Date().toISOString().split('T')[0]
    const [dateFilter, setDateFilter] = useState(today)
    const [search, setSearch] = useState('')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [clockOutId, setClockOutId] = useState<string | null>(null)
    const [editing, setEditing] = useState<any>(null)
    const [form, setForm] = useState(emptyForm)
    const [saving, setSaving] = useState(false)
    // Leave management
    const [reviewId, setReviewId] = useState<string | null>(null)
    const [adminNotes, setAdminNotes] = useState('')
    const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REJECTED' | null>(null)
    const [reviewing, setReviewing] = useState(false)

    const { data: employees } = useEmployees()
    const { data: records, isLoading } = useAttendance(dateFilter)
    const { data: leaveRequests, isLoading: leavesLoading } = useLeaveRequests()
    const { data: schedule } = useWorkSchedule()
    const workStart = schedule?.work_start_time || '09:00'
    const workEnd = schedule?.work_end_time || '17:00'
    useRealtimeSync('attendance', ['attendance', dateFilter])
    useRealtimeSync('leave_requests', ['leave-requests'])

    const openAdd = () => { setEditing(null); setForm({ ...emptyForm, clock_in: new Date().toISOString().slice(0, 16) }); setDialogOpen(true) }
    const openEdit = (r: any) => {
        setEditing(r)
        setForm({ employee_id: r.employee_id, clock_in: r.clock_in ? new Date(r.clock_in).toISOString().slice(0, 16) : '', clock_out: r.clock_out ? new Date(r.clock_out).toISOString().slice(0, 16) : '', notes: r.notes || '' })
        setDialogOpen(true)
    }

    const handleSave = async () => {
        if (!form.employee_id || !form.clock_in) return toast.error('Karyawan dan jam masuk wajib diisi.')
        setSaving(true)
        const payload = { employee_id: form.employee_id, clock_in: new Date(form.clock_in).toISOString(), clock_out: form.clock_out ? new Date(form.clock_out).toISOString() : null, notes: form.notes }
        const { error } = editing ? await supabase.from('attendance').update(payload).eq('id', editing.id) : await supabase.from('attendance').insert(payload)
        setSaving(false)
        if (error) return toast.error(error.message)
        toast.success(editing ? 'Absensi diperbarui!' : 'Absensi dicatat!')
        qc.invalidateQueries({ queryKey: ['attendance'] })
        setDialogOpen(false)
    }

    const handleClockOut = async (id: string) => {
        const { error } = await supabase.from('attendance').update({ clock_out: new Date().toISOString() }).eq('id', id)
        if (error) return toast.error(error.message)
        toast.success('Clock Out berhasil!')
        qc.invalidateQueries({ queryKey: ['attendance'] })
        setClockOutId(null)
    }

    const handleDelete = async () => {
        if (!deleteId) return
        const { error } = await supabase.from('attendance').delete().eq('id', deleteId)
        setDeleteId(null)
        if (error) return toast.error(error.message)
        toast.success('Absensi dihapus.')
        qc.invalidateQueries({ queryKey: ['attendance'] })
    }

    const handleReviewLeave = async () => {
        if (!reviewId || !reviewAction) return
        setReviewing(true)
        const { data: { user } } = await supabase.auth.getUser()
        const { error } = await supabase.from('leave_requests').update({
            status: reviewAction,
            admin_notes: adminNotes,
            reviewed_at: new Date().toISOString(),
        }).eq('id', reviewId)
        setReviewing(false)
        if (error) return toast.error(error.message)
        toast.success(reviewAction === 'APPROVED' ? 'Izin disetujui ✅' : 'Izin ditolak ❌')
        qc.invalidateQueries({ queryKey: ['leave-requests'] })
        setReviewId(null)
        setAdminNotes('')
        setReviewAction(null)
    }

    const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))
    const getDuration = (ci: string, co?: string | null) => {
        if (!co) return null
        const m = Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 60000)
        return `${Math.floor(m / 60)}j ${m % 60}m`
    }
    const getStatus = (r: any) => {
        if (!r.clock_out) {
            // Still working — check if they came late
            if (isLateClockIn(r.clock_in, workStart)) {
                return { label: 'Hadir (Terlambat)', className: 'bg-amber-50 text-amber-700 border-amber-200' }
            }
            return { label: 'Masih Hadir', className: 'bg-blue-50 text-blue-700 border-blue-200' }
        }
        const late = isLateClockIn(r.clock_in, workStart)
        const early = isEarlyClockOut(r.clock_out, workEnd)
        if (late && early) return { label: 'Terlambat & Pulang Awal', className: 'bg-red-50 text-red-600 border-red-200' }
        if (late) return { label: 'Terlambat', className: 'bg-amber-50 text-amber-700 border-amber-200' }
        if (early) return { label: 'Pulang Awal', className: 'bg-orange-50 text-orange-700 border-orange-200' }
        return { label: 'Tepat Waktu', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
    }

    const filtered = (records || []).filter((r: any) =>
        r.employees?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.employees?.department?.toLowerCase().includes(search.toLowerCase())
    )
    const present = records?.filter((r: any) => !r.clock_out).length || 0
    const onTime = records?.filter((r: any) => r.clock_out && !isLateClockIn(r.clock_in, workStart) && !isEarlyClockOut(r.clock_out, workEnd)).length || 0
    const late = records?.filter((r: any) => isLateClockIn(r.clock_in, workStart)).length || 0
    const earlyLeave = records?.filter((r: any) => r.clock_out && isEarlyClockOut(r.clock_out, workEnd)).length || 0
    const pendingLeaves = leaveRequests?.filter((l: any) => l.status === 'PENDING').length || 0

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-3">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Attendance & Leave</h1>
                    <p className="text-muted-foreground">Kelola kehadiran dan persetujuan izin karyawan. Jam kerja: <span className="font-semibold text-primary">{formatScheduleTime(workStart)} – {formatScheduleTime(workEnd)}</span></p>
                </div>
                <Button className="rounded-xl h-11 px-6 shadow-md shadow-primary/20" onClick={openAdd}>
                    <Plus className="mr-2 h-4 w-4" /> Catat Absensi
                </Button>
            </div>

            {/* KPI */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                {[
                    { label: 'Masih Hadir', value: present, icon: LogIn, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                    { label: 'Tepat Waktu', value: onTime, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                    { label: 'Terlambat Masuk', value: late, icon: XCircle, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                    { label: 'Pulang Awal', value: earlyLeave, icon: LogOut, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
                ].map(kpi => (
                    <Card key={kpi.label} className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${kpi.bg}`}><kpi.icon className={`h-5 w-5 ${kpi.color}`} /></div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">{kpi.label}</p>
                                <p className="text-2xl font-bold">{kpi.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Tabs defaultValue="attendance">
                <TabsList className="rounded-xl">
                    <TabsTrigger value="attendance" className="rounded-lg">Absensi Harian</TabsTrigger>
                    <TabsTrigger value="leaves" className="rounded-lg gap-2">
                        Pengajuan Izin
                        {pendingLeaves > 0 && <Badge className="bg-red-500 text-white text-[10px] h-4 px-1.5 rounded-full">{pendingLeaves}</Badge>}
                    </TabsTrigger>
                </TabsList>

                {/* Attendance Tab */}
                <TabsContent value="attendance">
                    <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                        <CardHeader className="bg-zinc-50/50 border-b py-3 px-4">
                            <div className="flex gap-3 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                    <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="h-9 w-40 rounded-xl text-sm" />
                                </div>
                                <div className="relative flex-1 min-w-[200px] max-w-sm">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari karyawan…" className="pl-10 h-9 rounded-xl" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-zinc-100/50 dark:bg-zinc-800/50">
                                    <TableRow>
                                        <TableHead>Karyawan</TableHead>
                                        <TableHead>Jam Masuk</TableHead>
                                        <TableHead>Jam Keluar</TableHead>
                                        <TableHead>Durasi</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Catatan</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? Array.from({ length: 4 }).map((_, i) => (
                                        <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
                                    )) : filtered.map((rec: any) => {
                                        const st = getStatus(rec)
                                        return (
                                            <TableRow key={rec.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/50">
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8 rounded-xl border">
                                                            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold rounded-xl">
                                                                {rec.employees?.full_name?.substring(0, 2).toUpperCase() || 'EE'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="font-semibold text-sm">{rec.employees?.full_name || '—'}</div>
                                                            <div className="text-[10px] text-muted-foreground">{rec.employees?.department}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1.5 text-sm">
                                                        <Clock className="h-3.5 w-3.5 text-green-500" />
                                                        {new Date(rec.clock_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {rec.clock_out
                                                        ? <span className="text-sm">{new Date(rec.clock_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                                        : <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg border-amber-200 text-amber-600 hover:bg-amber-50" onClick={() => setClockOutId(rec.id)}>
                                                            <LogOut className="h-3 w-3 mr-1" /> Clock Out
                                                        </Button>
                                                    }
                                                </TableCell>
                                                <TableCell className="text-sm font-medium">{getDuration(rec.clock_in, rec.clock_out) || <span className="text-muted-foreground text-xs italic">In progress</span>}</TableCell>
                                                <TableCell><Badge className={`rounded-lg text-xs border ${st.className}`}>{st.label}</Badge></TableCell>
                                                <TableCell className="text-xs text-muted-foreground max-w-[100px] truncate">{rec.notes || '—'}</TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="rounded-xl">
                                                            <DropdownMenuItem onClick={() => openEdit(rec)}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                                            <DropdownMenuItem className="text-red-600" onClick={() => setDeleteId(rec.id)}><Trash2 className="mr-2 h-4 w-4" /> Hapus</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                    {!isLoading && filtered.length === 0 && (
                                        <TableRow><TableCell colSpan={7} className="text-center h-32 text-muted-foreground text-sm">Tidak ada data absensi untuk tanggal ini.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Leave Requests Tab */}
                <TabsContent value="leaves">
                    <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-zinc-100/50 dark:bg-zinc-800/50">
                                    <TableRow>
                                        <TableHead>Karyawan</TableHead>
                                        <TableHead>Tipe</TableHead>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>Durasi</TableHead>
                                        <TableHead>Alasan</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Aksi Admin</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {leavesLoading ? Array.from({ length: 4 }).map((_, i) => (
                                        <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
                                    )) : (leaveRequests || []).map((lv: any) => {
                                        const st = STATUS_MAP[lv.status] || STATUS_MAP.PENDING
                                        const days = Math.round((new Date(lv.end_date).getTime() - new Date(lv.start_date).getTime()) / 86400000) + 1
                                        return (
                                            <TableRow key={lv.id} className="hover:bg-zinc-50/80">
                                                <TableCell>
                                                    <div className="font-semibold text-sm">{lv.employees?.full_name || '—'}</div>
                                                    <div className="text-[10px] text-muted-foreground">{lv.employees?.department}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="rounded-lg text-xs">
                                                        {lv.type === 'SICK' ? '🤒 Sakit' : lv.type === 'LEAVE' ? '🏖️ Cuti' : '📝 Izin'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {new Date(lv.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                    {lv.start_date !== lv.end_date && ` – ${new Date(lv.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`}
                                                </TableCell>
                                                <TableCell className="text-sm">{days} hari</TableCell>
                                                <TableCell className="text-xs text-muted-foreground max-w-[140px] truncate">{lv.reason || '—'}</TableCell>
                                                <TableCell><Badge className={`rounded-lg text-xs border ${st.className}`}>{st.label}</Badge></TableCell>
                                                <TableCell className="text-right">
                                                    {lv.status === 'PENDING' ? (
                                                        <div className="flex justify-end gap-1.5">
                                                            <Button size="sm" className="h-7 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3"
                                                                onClick={() => { setReviewId(lv.id); setReviewAction('APPROVED') }}>
                                                                <ThumbsUp className="h-3 w-3 mr-1" /> Setuju
                                                            </Button>
                                                            <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg border-red-200 text-red-600 hover:bg-red-50 px-3"
                                                                onClick={() => { setReviewId(lv.id); setReviewAction('REJECTED') }}>
                                                                <ThumbsDown className="h-3 w-3 mr-1" /> Tolak
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground italic">{lv.admin_notes || 'Tidak ada catatan'}</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                    {!leavesLoading && (!leaveRequests || leaveRequests.length === 0) && (
                                        <TableRow><TableCell colSpan={7} className="text-center h-32 text-muted-foreground text-sm">Belum ada pengajuan izin.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Add/Edit Attendance Dialog */}
            <Dialog open={dialogOpen} onOpenChange={v => { setDialogOpen(v); if (!v) { setEditing(null); setForm(emptyForm) } }}>
                <DialogContent className="rounded-2xl max-w-md">
                    <DialogHeader><DialogTitle>{editing ? 'Edit Absensi' : 'Catat Absensi Manual'}</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label>Karyawan <span className="text-red-500">*</span></Label>
                            <Select value={form.employee_id} onValueChange={v => f('employee_id', v)}>
                                <SelectTrigger className="rounded-xl h-10"><SelectValue placeholder="Pilih karyawan…" /></SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {(employees || []).map((e: any) => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Jam Masuk <span className="text-red-500">*</span></Label>
                                <Input type="datetime-local" value={form.clock_in} onChange={e => f('clock_in', e.target.value)} className="rounded-xl h-10 text-sm" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Jam Keluar</Label>
                                <Input type="datetime-local" value={form.clock_out} onChange={e => f('clock_out', e.target.value)} className="rounded-xl h-10 text-sm" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Catatan</Label>
                            <Input value={form.notes} onChange={e => f('notes', e.target.value)} placeholder="WFH, lembur, dll." className="rounded-xl h-10" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="rounded-xl" onClick={() => setDialogOpen(false)}>Batal</Button>
                        <Button className="rounded-xl" onClick={handleSave} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editing ? 'Simpan' : 'Catat'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Review Leave Dialog */}
            <Dialog open={!!reviewId && !!reviewAction} onOpenChange={v => { if (!v) { setReviewId(null); setAdminNotes(''); setReviewAction(null) } }}>
                <DialogContent className="rounded-2xl max-w-sm">
                    <DialogHeader>
                        <DialogTitle className={reviewAction === 'APPROVED' ? 'text-emerald-700' : 'text-red-600'}>
                            {reviewAction === 'APPROVED' ? '✅ Setujui Izin' : '❌ Tolak Izin'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <Label>Catatan Admin (opsional)</Label>
                        <Textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)}
                            placeholder="Misal: Izin disetujui untuk 3 hari, atau alasan penolakan..." rows={3}
                            className="rounded-xl resize-none" />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="rounded-xl" onClick={() => { setReviewId(null); setAdminNotes(''); setReviewAction(null) }}>Batal</Button>
                        <Button className={`rounded-xl ${reviewAction === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}
                            onClick={handleReviewLeave} disabled={reviewing}>
                            {reviewing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {reviewAction === 'APPROVED' ? 'Setujui' : 'Tolak'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Clock Out Confirm */}
            <AlertDialog open={!!clockOutId} onOpenChange={v => !v && setClockOutId(null)}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Clock Out?</AlertDialogTitle>
                        <AlertDialogDescription>Waktu sekarang ({new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}) akan dicatat sebagai jam keluar.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
                        <AlertDialogAction className="rounded-xl" onClick={() => clockOutId && handleClockOut(clockOutId)}>Clock Out</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Confirm */}
            <AlertDialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Absensi?</AlertDialogTitle>
                        <AlertDialogDescription>Data absensi ini akan dihapus permanen.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
                        <AlertDialogAction className="rounded-xl bg-red-600 hover:bg-red-700" onClick={handleDelete}>Hapus</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
