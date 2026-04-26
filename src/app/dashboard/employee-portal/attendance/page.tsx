'use client'

import { useState } from 'react'
import { useRealtimeSync } from '@/hooks/use-erp-data'
import { useWorkSchedule, isLateClockIn, isEarlyClockOut, formatScheduleTime } from '@/hooks/use-work-schedule'
import { useMyEmployee, useMyAttendance, getDuration } from '@/hooks/use-employee-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
    Clock, CheckCircle2, XCircle, AlertCircle, Search, CalendarDays, LogIn, LogOut
} from 'lucide-react'

export default function EmployeeAttendancePage() {
    const [search, setSearch] = useState('')
    const { data: employee, isLoading: empLoading } = useMyEmployee()
    const { data: history } = useMyAttendance(employee?.id)
    const { data: schedule } = useWorkSchedule()
    const workStart = schedule?.work_start_time || '09:00'
    const workEnd = schedule?.work_end_time || '17:00'

    useRealtimeSync('attendance', ['my-attendance'])

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

    const isLate = (clockIn: string) => isLateClockIn(clockIn, workStart)
    const isEarly = (clockOut: string) => isEarlyClockOut(clockOut, workEnd)

    const records = history || []
    const total = records.length
    const onTime = records.filter((r: any) => !isLate(r.clock_in)).length
    const late = records.filter((r: any) => isLate(r.clock_in)).length
    const earlyLeave = records.filter((r: any) => r.clock_out && isEarly(r.clock_out)).length

    const filtered = records.filter((r: any) => {
        if (!search) return true
        const date = new Date(r.clock_in).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        return date.toLowerCase().includes(search.toLowerCase())
    })

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Riwayat Absensi</h1>
                <p className="text-muted-foreground">
                    Rekap kehadiran Anda. Jam kerja: <span className="font-semibold">{formatScheduleTime(workStart)} – {formatScheduleTime(workEnd)}</span>
                </p>
            </div>

            {/* KPI Summary */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                {[
                    { label: 'Total Kehadiran', value: total, icon: CalendarDays, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
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

            {/* Attendance Table */}
            <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                <CardHeader className="bg-zinc-50/50 border-b py-3 px-4">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Cari berdasarkan tanggal…" className="pl-10 h-9 rounded-xl" />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-zinc-100/50 dark:bg-zinc-800/50">
                            <TableRow>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Jam Masuk</TableHead>
                                <TableHead>Jam Keluar</TableHead>
                                <TableHead>Durasi</TableHead>
                                <TableHead>Status Masuk</TableHead>
                                <TableHead>Status Pulang</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((rec: any) => (
                                <TableRow key={rec.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/50">
                                    <TableCell className="font-medium text-sm">
                                        {new Date(rec.clock_in).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-sm">
                                            <LogIn className="h-3.5 w-3.5 text-emerald-500" />
                                            {new Date(rec.clock_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {rec.clock_out ? (
                                            <div className="flex items-center gap-1.5 text-sm">
                                                <LogOut className="h-3.5 w-3.5 text-red-400" />
                                                {new Date(rec.clock_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        ) : (
                                            <span className="text-xs italic text-muted-foreground">Belum keluar</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm font-medium">
                                        {getDuration(rec.clock_in, rec.clock_out) || '—'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={`text-xs rounded-lg border ${isLate(rec.clock_in) ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                            {isLate(rec.clock_in) ? '⚠️ Terlambat' : '✅ Tepat Waktu'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {rec.clock_out ? (
                                            <Badge className={`text-xs rounded-lg border ${isEarly(rec.clock_out) ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                                {isEarly(rec.clock_out) ? '⚠️ Pulang Awal' : '✅ Sesuai Jadwal'}
                                            </Badge>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">—</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filtered.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-32 text-muted-foreground text-sm">
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
