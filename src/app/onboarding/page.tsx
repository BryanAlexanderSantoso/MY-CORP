'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, CheckCircle2, ChevronRight, Clock, MapPin, Check, Loader2, Sparkles, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

const supabase = createClient()

export default function OnboardingPage() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [orgId, setOrgId] = useState<string | null>(null)
    const [isEmp, setIsEmp] = useState(false)

    // Form states
    const [name, setName] = useState('')
    const [slug, setSlug] = useState('')
    const [startTime, setStartTime] = useState('09:00')
    const [endTime, setEndTime] = useState('17:00')

    useEffect(() => {
        const fetchStatus = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return router.push('/login')

            const { data: profile } = await supabase.from('profiles').select('tenant_id, role').eq('id', user.id).single()
            if (!profile?.tenant_id) return router.push('/dashboard')

            if (profile.role === 'EMPLOYEE') {
                setIsEmp(true)
                setLoading(false)
                return
            }

            const { data: org } = await supabase.from('organizations').select('*').eq('id', profile.tenant_id).single()
            if (!org) return router.push('/dashboard')

            if (org.onboarding_completed) {
                return router.push('/dashboard')
            }

            setOrgId(org.id)
            setName(org.name || '')
            setSlug(org.slug || '')
            setStartTime(org.work_start_time || '09:00')
            setEndTime(org.work_end_time || '17:00')
            setLoading(false)
        }
        fetchStatus()
    }, [router])

    const handleSave = async () => {
        setSubmitting(true)
        const { error } = await supabase.from('organizations').update({
            name,
            slug,
            work_start_time: startTime,
            work_end_time: endTime,
            onboarding_completed: true
        }).eq('id', orgId)

        setSubmitting(false)
        if (error) return toast.error(error.message)

        toast.success('Setup perusahaan berhasil! Selamat datang.')
        router.push('/dashboard')
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
    )

    // Employees should not be here, but just in case
    if (isEmp) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 text-center">
                <AlertCircle className="h-16 w-16 text-amber-500 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Akses Terbatas</h1>
                <p className="text-muted-foreground mb-6">Halaman ini hanya untuk pengaturan perusahaan oleh Admin.</p>
                <Button onClick={() => router.push('/dashboard/employee-portal')}>Ke Portal Karyawan</Button>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
            <div className="w-full max-w-2xl space-y-8">

                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-2">
                        <Sparkles className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Selamat Datang di MyCorporate</h1>
                    <p className="text-muted-foreground">Mari selesaikan profil perusahaan Anda. Cuma butuh 1 menit!</p>
                </div>

                {/* Progress Indicators */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= s ? 'bg-primary text-primary-foreground' : 'bg-zinc-200 dark:bg-zinc-800 text-muted-foreground'}`}>
                                {step > s ? <Check className="w-4 h-4" /> : s}
                            </div>
                            {s < 3 && <div className={`w-12 h-1 rounded-full ${step > s ? 'bg-primary/50' : 'bg-zinc-200 dark:bg-zinc-800'}`} />}
                        </div>
                    ))}
                </div>

                {/* Content Cards */}
                <Card className="border-none shadow-xl shadow-black/5 dark:shadow-none bg-white dark:bg-zinc-900 overflow-hidden">
                    <CardContent className="p-8 sm:p-10">
                        {step === 1 && (
                            <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                                <div>
                                    <h2 className="text-2xl font-bold flex items-center gap-2"><Building2 className="text-primary w-6 h-6" /> Profil Perusahaan</h2>
                                    <p className="text-muted-foreground mt-1 text-sm">Informasi dasar tentang perusahaan Anda</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Nama Perusahaan</Label>
                                        <Input value={name} onChange={e => setName(e.target.value)} className="h-12 rounded-xl text-lg" placeholder="PT Sukses Makmur" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Slug Perusahaan (Link Identitas)</Label>
                                        <Input value={slug} onChange={e => setSlug(e.target.value)} className="h-12 rounded-xl text-lg font-mono bg-zinc-50 dark:bg-zinc-950" />
                                        <p className="text-xs text-muted-foreground">Karyawan Anda akan menggunakan link ini untuk masuk.</p>
                                    </div>
                                </div>
                                <Button onClick={() => setStep(2)} className="w-full h-12 rounded-xl text-lg mt-8" disabled={!name || !slug}>
                                    Lanjut <ChevronRight className="ml-2 w-5 h-5" />
                                </Button>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                                <div>
                                    <h2 className="text-2xl font-bold flex items-center gap-2"><Clock className="text-primary w-6 h-6" /> Jam Kerja Standar</h2>
                                    <p className="text-muted-foreground mt-1 text-sm">Sistem akan otomatis merekam keterlambatan karyawan</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Jam Masuk Kantor</Label>
                                        <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="h-12 rounded-xl text-lg font-mono" />
                                        <p className="text-xs text-amber-600 dark:text-amber-400">Lewat = Terlambat</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Jam Pulang Kantor</Label>
                                        <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="h-12 rounded-xl text-lg font-mono" />
                                        <p className="text-xs text-orange-600 dark:text-orange-400">Kurang = Pulang Awal</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 mt-8">
                                    <Button variant="outline" onClick={() => setStep(1)} className="h-12 w-1/3 rounded-xl">Kembali</Button>
                                    <Button onClick={() => setStep(3)} className="h-12 w-2/3 rounded-xl text-lg">Lanjut Tutorial <ChevronRight className="ml-2 w-5 h-5" /></Button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6 animate-in scale-in-95 duration-500">
                                <div className="text-center space-y-2">
                                    <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center">
                                        <CheckCircle2 className="w-10 h-10" />
                                    </div>
                                    <h2 className="text-2xl font-bold">Semua Siap! 🎉</h2>
                                    <p className="text-muted-foreground text-sm">Berikut panduan singkat menggunakan sistem:</p>
                                </div>

                                <div className="space-y-3 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold text-xs mt-0.5">1</div>
                                        <p className="text-sm">Buka <strong>HRM {"->"} Employees</strong> untuk melihat data karyawan.</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold text-xs mt-0.5">2</div>
                                        <p className="text-sm">Arahkan karyawan Anda mendaftar di <strong>{'/employee-register'}</strong>.</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold text-xs mt-0.5">3</div>
                                        <p className="text-sm">Absensi dan Keterlambatan tercatat otomatis di <strong>HRM {"->"} Attendance</strong>.</p>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <Button onClick={handleSave} disabled={submitting} className="w-full h-14 rounded-xl text-lg font-bold bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20">
                                        {submitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
                                        Mulai Gunakan Platform
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
