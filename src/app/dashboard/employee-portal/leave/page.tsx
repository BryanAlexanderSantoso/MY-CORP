'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeSync } from '@/hooks/use-erp-data'
import { useMyEmployee, useMyLeaves } from '@/hooks/use-employee-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
    CalendarX, Loader2, CheckCircle2, XCircle, AlertCircle, Send, Clock
} from 'lucide-react'
import { toast } from 'sonner'

const supabase = createClient()

const STATUS_MAP: Record<string, { label: string, icon: any, className: string }> = {
    PENDING: { label: 'Menunggu', icon: Clock, className: 'bg-amber-50 text-amber-700 border-amber-200' },
    APPROVED: { label: 'Disetujui', icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    REJECTED: { label: 'Ditolak', icon: XCircle, className: 'bg-red-50 text-red-600 border-red-200' },
}

export default function EmployeeLeavePage() {
    const qc = useQueryClient()
    const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
    const [leaveForm, setLeaveForm] = useState({
        type: 'SICK',
        reason: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
    })
    const [submitting, setSubmitting] = useState(false)

    const { data: employee, isLoading: empLoading } = useMyEmployee()
    const { data: leaves } = useMyLeaves(employee?.id)

    useRealtimeSync('leave_requests', ['my-leaves'])

    const handleSubmitLeave = async () => {
        if (!employee || !leaveForm.reason) return toast.error('Alasan wajib diisi.')
        setSubmitting(true)
        const { error } = await supabase.from('leave_requests').insert({
            employee_id: employee.id,
            type: leaveForm.type,
            reason: leaveForm.reason,
            start_date: leaveForm.start_date,
            end_date: leaveForm.end_date,
            status: 'PENDING',
        })
        setSubmitting(false)
        if (error) return toast.error(error.message)
        toast.success('Pengajuan izin berhasil dikirim!')
        setLeaveDialogOpen(false)
        setLeaveForm({ type: 'SICK', reason: '', start_date: new Date().toISOString().split('T')[0], end_date: new Date().toISOString().split('T')[0] })
        qc.invalidateQueries({ queryKey: ['my-leaves'] })
    }

    if (empLoading) return (
        <div className="space-y-6">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-64 rounded-2xl" />
        </div>
    )

    if (!employee) return (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
            <AlertCircle className="h-12 w-12 text-amber-400" />
            <h2 className="text-xl font-bold">Akun tidak terhubung ke data karyawan</h2>
            <p className="text-muted-foreground text-sm text-center max-w-sm">
                Hubungi admin untuk menghubungkan akun Anda ke profil karyawan di sistem.
            </p>
        </div>
    )

    const allLeaves = leaves || []
    const pending = allLeaves.filter((l: any) => l.status === 'PENDING').length
    const approved = allLeaves.filter((l: any) => l.status === 'APPROVED').length
    const rejected = allLeaves.filter((l: any) => l.status === 'REJECTED').length

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-3">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Izin & Cuti</h1>
                    <p className="text-muted-foreground">Ajukan dan pantau status izin/cuti Anda.</p>
                </div>
                <Button className="rounded-xl h-11 px-6 shadow-md shadow-primary/20"
                    onClick={() => setLeaveDialogOpen(true)}>
                    <Send className="mr-2 h-4 w-4" /> Ajukan Izin Baru
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 grid-cols-3">
                {[
                    { label: 'Menunggu', value: pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                    { label: 'Disetujui', value: approved, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                    { label: 'Ditolak', value: rejected, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
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

            {/* Leave Requests Table */}
            <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                <CardHeader className="bg-zinc-50/50 border-b py-4 px-5">
                    <CardTitle className="text-base flex items-center gap-2">
                        <CalendarX className="h-4 w-4 text-primary" /> Riwayat Pengajuan
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-zinc-100/50 dark:bg-zinc-800/50">
                            <TableRow>
                                <TableHead>Tipe</TableHead>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Durasi</TableHead>
                                <TableHead>Alasan</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Catatan Admin</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allLeaves.map((lv: any) => {
                                const st = STATUS_MAP[lv.status] || STATUS_MAP.PENDING
                                const days = Math.round((new Date(lv.end_date).getTime() - new Date(lv.start_date).getTime()) / 86400000) + 1
                                return (
                                    <TableRow key={lv.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/50">
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
                                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{lv.reason || '—'}</TableCell>
                                        <TableCell>
                                            <Badge className={`rounded-lg text-xs border ${st.className}`}>
                                                {st.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                                            {lv.admin_notes || <span className="italic">Belum ada</span>}
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                            {allLeaves.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-32 text-muted-foreground text-sm">
                                        Belum ada pengajuan izin/cuti.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Submit Leave Dialog */}
            <Dialog open={leaveDialogOpen} onOpenChange={v => { setLeaveDialogOpen(v) }}>
                <DialogContent className="rounded-2xl max-w-md">
                    <DialogHeader>
                        <DialogTitle>📝 Ajukan Izin / Cuti</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label>Tipe <span className="text-red-500">*</span></Label>
                            <Select value={leaveForm.type} onValueChange={v => setLeaveForm(p => ({ ...p, type: v }))}>
                                <SelectTrigger className="rounded-xl h-10"><SelectValue /></SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="SICK">🤒 Sakit</SelectItem>
                                    <SelectItem value="LEAVE">🏖️ Cuti</SelectItem>
                                    <SelectItem value="PERMIT">📝 Izin Lainnya</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Mulai <span className="text-red-500">*</span></Label>
                                <Input type="date" value={leaveForm.start_date}
                                    onChange={e => setLeaveForm(p => ({ ...p, start_date: e.target.value }))}
                                    className="rounded-xl h-10" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Sampai <span className="text-red-500">*</span></Label>
                                <Input type="date" value={leaveForm.end_date}
                                    onChange={e => setLeaveForm(p => ({ ...p, end_date: e.target.value }))}
                                    className="rounded-xl h-10" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Alasan <span className="text-red-500">*</span></Label>
                            <Textarea value={leaveForm.reason}
                                onChange={e => setLeaveForm(p => ({ ...p, reason: e.target.value }))}
                                placeholder="Jelaskan alasan izin/cuti Anda…" rows={3}
                                className="rounded-xl resize-none" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="rounded-xl" onClick={() => setLeaveDialogOpen(false)}>Batal</Button>
                        <Button className="rounded-xl" onClick={handleSubmitLeave} disabled={submitting}>
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Kirim Pengajuan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
