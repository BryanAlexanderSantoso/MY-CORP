'use client'

import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeSync } from '@/hooks/use-erp-data'
import { useWorkSchedule, isLateClockIn, isEarlyClockOut, formatScheduleTime } from '@/hooks/use-work-schedule'
import { useMyEmployee, useTodayAttendance, useMyAttendance, getDuration } from '@/hooks/use-employee-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
    Clock, LogIn, LogOut, Loader2, CheckCircle2, AlertCircle, History, Sparkles, Navigation
} from 'lucide-react'
import { toast } from 'sonner'

const supabase = createClient()

export default function EmployeePortalPage() {
    const qc = useQueryClient()
    const [clockingIn, setClockingIn] = useState(false)
    const [clockingOut, setClockingOut] = useState(false)
    const [now, setNow] = useState(new Date())
    const [showTutorial, setShowTutorial] = useState(true)

    const { data: employee, isLoading: empLoading } = useMyEmployee()
    const { data: todayRecord } = useTodayAttendance(employee?.id)
    const { data: history } = useMyAttendance(employee?.id)
    const { data: schedule } = useWorkSchedule()
    const workStart = schedule?.work_start_time || '09:00'
    const workEnd = schedule?.work_end_time || '17:00'

    useRealtimeSync('attendance', ['my-attendance', 'today-attendance'])

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000)
        return () => clearInterval(t)
    }, [])

    const handleClockIn = async () => {
        if (!employee) return
        setClockingIn(true)
        const { error } = await supabase.from('attendance').insert({
            employee_id: employee.id,
            clock_in: new Date().toISOString(),
        })
        setClockingIn(false)
        if (error) return toast.error(error.message)
        toast.success('Berhasil Clock In! Selamat bekerja 👋')
        qc.invalidateQueries({ queryKey: ['today-attendance'] })
        qc.invalidateQueries({ queryKey: ['my-attendance'] })
    }

    const handleClockOut = async () => {
        if (!todayRecord) return
        setClockingOut(true)
        const { error } = await supabase.from('attendance')
            .update({ clock_out: new Date().toISOString() })
            .eq('id', todayRecord.id)
        setClockingOut(false)
        if (error) return toast.error(error.message)
        toast.success('Clock Out berhasil! Sampai jumpa besok 👋')
        qc.invalidateQueries({ queryKey: ['today-attendance'] })
        qc.invalidateQueries({ queryKey: ['my-attendance'] })
    }

    const finishTutorial = async () => {
        try {
            await fetch('/api/employee/finish-tutorial', { method: 'POST' })
            setShowTutorial(false)
            qc.invalidateQueries({ queryKey: ['my-employee'] })
        } catch (e) {
            setShowTutorial(false) // dismiss anyway
        }
    }

    if (empLoading) return (
        <div className="space-y-6">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-48 rounded-2xl" />
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

    const initials = employee.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    const hasCheckedIn = !!todayRecord
    const hasCheckedOut = !!todayRecord?.clock_out
    const todayLate = hasCheckedIn ? isLateClockIn(todayRecord.clock_in, workStart) : false
    const todayEarly = hasCheckedOut ? isEarlyClockOut(todayRecord.clock_out!, workEnd) : false
    const isLate = (clockIn: string) => isLateClockIn(clockIn, workStart)
    const isEarly = (clockOut: string) => isEarlyClockOut(clockOut, workEnd)

    const needsTutorial = employee.tutorial_completed === false && showTutorial

    return (
        <div className="space-y-6">

            {/* Tutorial Modal for new employees */}
            <Dialog open={needsTutorial} onOpenChange={setShowTutorial}>
                <DialogContent className="rounded-2xl max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-2xl">
                            <Sparkles className="h-6 w-6 text-primary" />
                            Selamat Datang, {employee.full_name.split(' ')[0]}!
                        </DialogTitle>
                        <DialogDescription className="text-base pt-2">
                            Ini adalah <strong>Employee Portal</strong> Anda. Mulai sekarang, Anda bisa mengelola kehadiran & izin dari sini.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex gap-3 items-start bg-zinc-50 dark:bg-zinc-900 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg">
                                <Clock className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm">Clock In & Clock Out</h4>
                                <p className="text-sm text-muted-foreground mt-0.5">Catat kehadiran harian Anda hanya dengan satu klik di halaman Beranda ini.</p>
                            </div>
                        </div>
                        <div className="flex gap-3 items-start bg-zinc-50 dark:bg-zinc-900 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                                <Navigation className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm">Navigasi Sidebar</h4>
                                <p className="text-sm text-muted-foreground mt-0.5">Gunakan menu di sebelah kiri untuk melihat "Riwayat Absensi" secara lengkap, atau membuat pengajuan di menu "Izin & Cuti".</p>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button className="w-full h-12 rounded-xl text-md shadow-xl shadow-primary/20" onClick={finishTutorial}>
                            Mengerti, Mulai Bekerja <CheckCircle2 className="ml-2 h-5 w-5" />
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div>
                <h1 className="text-3xl font-bold tracking-tight">Beranda</h1>
                <p className="text-muted-foreground">
                    Selamat datang di <span className="font-semibold text-primary">{employee.organizations?.name || 'Perusahaan Anda'}</span>!
                    Jam kerja: <span className="font-semibold">{formatScheduleTime(workStart)} – {formatScheduleTime(workEnd)}</span>
                </p>
            </div>

            {/* Profile + Clock Panel */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Identity Card */}
                <Card className="rounded-2xl border-none shadow-md bg-gradient-to-br from-primary to-primary/70 text-white">
                    <CardContent className="p-6 flex items-center gap-5">
                        <Avatar className="h-16 w-16 border-4 border-white/30 rounded-2xl">
                            <AvatarFallback className="bg-white/20 text-white text-xl font-bold rounded-2xl">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-white/70 text-xs font-medium uppercase tracking-widest">Selamat Datang</p>
                            <h2 className="text-2xl font-bold leading-tight">{employee.full_name}</h2>
                            <p className="text-white/80 text-sm">{employee.designation || ''} {employee.department ? `— ${employee.department}` : ''}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Clock Card */}
                <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <CardContent className="p-6 flex flex-col items-center justify-center gap-4 h-full">
                        <div className="text-center">
                            <p className="text-4xl font-mono font-bold tracking-tight">
                                {now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </p>
                            <p className="text-muted-foreground text-sm mt-1">
                                {now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>

                        {!hasCheckedIn ? (
                            <Button onClick={handleClockIn} disabled={clockingIn}
                                className="w-full rounded-xl h-12 text-base bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200">
                                {clockingIn ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
                                Clock In Sekarang
                            </Button>
                        ) : !hasCheckedOut ? (
                            <div className="w-full space-y-3">
                                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                        <span className="text-sm font-medium text-emerald-700">Masuk</span>
                                        <span className="text-sm font-bold text-emerald-700">
                                            {new Date(todayRecord.clock_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <Badge className={`text-xs border rounded-lg ${!todayLate ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                        {!todayLate ? 'Tepat Waktu' : 'Terlambat'}
                                    </Badge>
                                </div>
                                <Button onClick={handleClockOut} disabled={clockingOut} variant="outline"
                                    className="w-full rounded-xl h-11 border-red-200 text-red-600 hover:bg-red-50">
                                    {clockingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                                    Clock Out Sekarang
                                </Button>
                            </div>
                        ) : (
                            <div className="w-full space-y-2">
                                <div className="flex justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-sm">
                                    <span className="flex items-center gap-1 text-emerald-600">
                                        <LogIn className="h-3.5 w-3.5" />
                                        {new Date(todayRecord.clock_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <span className="text-muted-foreground">→</span>
                                    <span className="flex items-center gap-1 text-red-500">
                                        <LogOut className="h-3.5 w-3.5" />
                                        {new Date(todayRecord.clock_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <Badge className="text-xs bg-zinc-100 text-zinc-600 rounded-lg border-none">
                                        {getDuration(todayRecord.clock_in, todayRecord.clock_out)}
                                    </Badge>
                                </div>
                                <p className="text-center text-xs text-muted-foreground">
                                    {todayLate && todayEarly ? 'Terlambat masuk & pulang awal ⚠️' :
                                        todayLate ? 'Anda terlambat masuk hari ini ⚠️' :
                                            todayEarly ? 'Anda pulang lebih awal hari ini ⚠️' :
                                                'Anda sudah selesai bekerja hari ini ✅'}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent 5 Attendance */}
            <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                <CardHeader className="bg-zinc-50/50 border-b py-4 px-5 flex flex-row items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <History className="h-4 w-4 text-primary" /> Kehadiran Terakhir
                    </CardTitle>
                    <a href="/dashboard/employee-portal/attendance">
                        <Button variant="ghost" size="sm" className="text-xs rounded-lg text-primary">
                            Lihat Semua →
                        </Button>
                    </a>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-zinc-100/50 dark:bg-zinc-800/50">
                            <TableRow>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Masuk</TableHead>
                                <TableHead>Keluar</TableHead>
                                <TableHead>Durasi</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(history || []).slice(0, 5).map((rec: any) => (
                                <TableRow key={rec.id} className="hover:bg-zinc-50/80">
                                    <TableCell className="text-sm font-medium">
                                        {new Date(rec.clock_in).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {new Date(rec.clock_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {rec.clock_out
                                            ? new Date(rec.clock_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                                            : <span className="italic text-xs">Belum keluar</span>}
                                    </TableCell>
                                    <TableCell className="text-sm font-medium">
                                        {getDuration(rec.clock_in, rec.clock_out) || '—'}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1 flex-wrap">
                                            <Badge className={`text-xs rounded-lg border ${isLate(rec.clock_in) ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                                {isLate(rec.clock_in) ? 'Terlambat' : 'Tepat Waktu'}
                                            </Badge>
                                            {rec.clock_out && isEarly(rec.clock_out) && (
                                                <Badge className="text-xs rounded-lg border bg-orange-50 text-orange-700 border-orange-200">
                                                    Pulang Awal
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!history || history.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground text-sm">
                                        Belum ada riwayat kehadiran.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
