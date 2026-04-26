'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import {
    Building, Copy, Check, Pencil, Save, X, Loader2,
    Users, Shield, Hash, Globe, Clock
} from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
    const qc = useQueryClient()
    const [editingOrg, setEditingOrg] = useState(false)
    const [orgName, setOrgName] = useState('')
    const [orgSlug, setOrgSlug] = useState('')
    const [saving, setSaving] = useState(false)
    const [copied, setCopied] = useState(false)

    // Work schedule state
    const [editingSchedule, setEditingSchedule] = useState(false)
    const [startTime, setStartTime] = useState('09:00')
    const [endTime, setEndTime] = useState('17:00')
    const [savingSchedule, setSavingSchedule] = useState(false)

    const [editingSecurity, setEditingSecurity] = useState(false)
    const [require2fa, setRequire2fa] = useState('false')
    const [passPolicy, setPassPolicy] = useState('standard')
    const [savingSecurity, setSavingSecurity] = useState(false)

    const [editingWebhook, setEditingWebhook] = useState(false)
    const [webhookUrl, setWebhookUrl] = useState('')
    const [webhookSecret, setWebhookSecret] = useState('')
    const [savingWebhook, setSavingWebhook] = useState(false)

    const [editingBrand, setEditingBrand] = useState(false)
    const [themeColor, setThemeColor] = useState('slate')
    const [savingBrand, setSavingBrand] = useState(false)

    const updateSettings = async (payload: any, setSaving: any, setEditing: any) => {
        setSaving(true)
        try {
            const res = await fetch('/api/org/update-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            if (!res.ok) throw new Error((await res.json()).error)
            toast.success('Pengaturan berhasil disimpan')
            qc.invalidateQueries({ queryKey: ['org-settings'] })
            setEditing(false)
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setSaving(false)
        }
    }

    const { data: org, isLoading } = useQuery({
        queryKey: ['org-settings'],
        queryFn: async () => {
            const res = await fetch('/api/org/get')
            if (!res.ok) return null
            return res.json()
        }
    })

    const startEdit = () => {
        setOrgName(org?.name || '')
        setOrgSlug(org?.slug || '')
        setEditingOrg(true)
    }

    const cancelEdit = () => {
        setEditingOrg(false)
        setOrgName('')
        setOrgSlug('')
    }

    const handleSave = async () => {
        if (!orgName.trim() || !orgSlug.trim()) return toast.error('Nama dan slug tidak boleh kosong.')

        setSaving(true)
        try {
            const res = await fetch('/api/org/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: orgName.trim(), slug: orgSlug.trim().toLowerCase() }),
            })
            const result = await res.json()
            if (!res.ok) throw new Error(result.error)

            toast.success('Pengaturan organisasi disimpan!')
            qc.invalidateQueries({ queryKey: ['org-settings'] })
            setEditingOrg(false)
        } catch (err: any) {
            toast.error(err.message || 'Gagal menyimpan perubahan.')
        } finally {
            setSaving(false)
        }
    }

    // Auto-slugify as user types
    const handleSlugInput = (val: string) => {
        setOrgSlug(val.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'))
    }

    const copySlug = () => {
        if (!org?.slug) return
        navigator.clipboard.writeText(org.slug)
        setCopied(true)
        toast.success('Kode perusahaan disalin!')
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight">Pengaturan Sistem</h1>
                <p className="text-muted-foreground">Kelola konfigurasi organisasi dan sistem.</p>
            </div>

            {/* Organization Info Card */}
            <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm">
                <CardHeader className="flex flex-row items-start justify-between pb-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                            <Building size={24} />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Informasi Organisasi</CardTitle>
                            <CardDescription>Nama perusahaan dan kode unik untuk karyawan bergabung.</CardDescription>
                        </div>
                    </div>
                    {!editingOrg && (
                        <Button variant="outline" className="rounded-xl h-9" onClick={startEdit}>
                            <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="space-y-5">
                    {isLoading ? (
                        <div className="space-y-3">
                            <Skeleton className="h-10 w-full rounded-xl" />
                            <Skeleton className="h-10 w-full rounded-xl" />
                        </div>
                    ) : editingOrg ? (
                        <>
                            <div className="space-y-1.5">
                                <Label>Nama Organisasi</Label>
                                <Input value={orgName} onChange={e => setOrgName(e.target.value)}
                                    placeholder="Nama perusahaan" className="rounded-xl h-10" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Kode Perusahaan (Slug)</Label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input value={orgSlug} onChange={e => handleSlugInput(e.target.value)}
                                        placeholder="contoh: my-company-2024"
                                        className="pl-10 rounded-xl h-10 font-mono" />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Hanya huruf kecil, angka, dan tanda hubung (-). Ini kode yang digunakan karyawan saat daftar.
                                </p>
                            </div>
                            <div className="flex gap-2 pt-1">
                                <Button className="rounded-xl h-9 flex-1" onClick={handleSave} disabled={saving}>
                                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Simpan Perubahan
                                </Button>
                                <Button variant="outline" className="rounded-xl h-9" onClick={cancelEdit} disabled={saving}>
                                    <X className="mr-2 h-4 w-4" /> Batal
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium mb-0.5">Nama Organisasi</p>
                                    <p className="text-lg font-bold">{org?.name || '—'}</p>
                                </div>
                                <Badge variant="outline" className="rounded-lg">Aktif</Badge>
                            </div>

                            {/* Slug Display — prominent for sharing */}
                            <div className="p-4 rounded-xl border-2 border-dashed border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/10">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                                            <Hash className="h-3 w-3" /> Kode Perusahaan (untuk karyawan daftar)
                                        </p>
                                        <p className="text-2xl font-mono font-bold text-indigo-800 dark:text-indigo-300 mt-1 tracking-wide">
                                            {org?.slug || '—'}
                                        </p>
                                        <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70 mt-1">
                                            Bagikan kode ini ke karyawan agar bisa mendaftar akun.
                                        </p>
                                    </div>
                                    <Button variant="outline"
                                        className={`rounded-xl h-10 px-4 border-indigo-200 transition-all ${copied ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'text-indigo-700 hover:bg-indigo-50'}`}
                                        onClick={copySlug}>
                                        {copied
                                            ? <><Check className="mr-2 h-4 w-4" /> Disalin!</>
                                            : <><Copy className="mr-2 h-4 w-4" /> Salin</>}
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Work Schedule Card */}
            <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm">
                <CardHeader className="flex flex-row items-start justify-between pb-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-100 dark:bg-amber-900/20 text-amber-600 rounded-xl">
                            <Clock size={24} />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Jam Kerja</CardTitle>
                            <CardDescription>Atur jam masuk dan jam pulang kantor. Digunakan untuk mendeteksi keterlambatan dan kepulangan awal karyawan.</CardDescription>
                        </div>
                    </div>
                    {!editingSchedule && (
                        <Button variant="outline" className="rounded-xl h-9" onClick={() => {
                            setStartTime(org?.work_start_time || '09:00')
                            setEndTime(org?.work_end_time || '17:00')
                            setEditingSchedule(true)
                        }}>
                            <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="space-y-5">
                    {isLoading ? (
                        <div className="space-y-3">
                            <Skeleton className="h-10 w-full rounded-xl" />
                            <Skeleton className="h-10 w-full rounded-xl" />
                        </div>
                    ) : editingSchedule ? (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label>Jam Masuk</Label>
                                    <Input
                                        type="time"
                                        value={startTime}
                                        onChange={e => setStartTime(e.target.value)}
                                        className="rounded-xl h-10 font-mono"
                                    />
                                    <p className="text-xs text-muted-foreground">Karyawan clock-in setelah jam ini = Terlambat</p>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Jam Pulang</Label>
                                    <Input
                                        type="time"
                                        value={endTime}
                                        onChange={e => setEndTime(e.target.value)}
                                        className="rounded-xl h-10 font-mono"
                                    />
                                    <p className="text-xs text-muted-foreground">Karyawan clock-out sebelum jam ini = Pulang Awal</p>
                                </div>
                            </div>
                            <div className="flex gap-2 pt-1">
                                <Button className="rounded-xl h-9 flex-1" onClick={async () => {
                                    setSavingSchedule(true)
                                    try {
                                        const res = await fetch('/api/org/work-schedule', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ work_start_time: startTime, work_end_time: endTime }),
                                        })
                                        const result = await res.json()
                                        if (!res.ok) throw new Error(result.error)
                                        toast.success('Jam kerja berhasil diperbarui!')
                                        qc.invalidateQueries({ queryKey: ['org-settings'] })
                                        qc.invalidateQueries({ queryKey: ['work-schedule'] })
                                        setEditingSchedule(false)
                                    } catch (err: any) {
                                        toast.error(err.message || 'Gagal menyimpan.')
                                    } finally {
                                        setSavingSchedule(false)
                                    }
                                }} disabled={savingSchedule}>
                                    {savingSchedule ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Simpan
                                </Button>
                                <Button variant="outline" className="rounded-xl h-9" onClick={() => setEditingSchedule(false)}>
                                    <X className="mr-2 h-4 w-4" /> Batal
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800">
                                <p className="text-xs text-emerald-600 font-medium mb-0.5">⏰ Jam Masuk</p>
                                <p className="text-3xl font-mono font-bold text-emerald-800 dark:text-emerald-300">
                                    {org?.work_start_time?.slice(0, 5) || '09:00'}
                                </p>
                                <p className="text-xs text-emerald-600/70 mt-1">Clock-in setelah jam ini = Terlambat</p>
                            </div>
                            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800">
                                <p className="text-xs text-rose-600 font-medium mb-0.5">🏠 Jam Pulang</p>
                                <p className="text-3xl font-mono font-bold text-rose-800 dark:text-rose-300">
                                    {org?.work_end_time?.slice(0, 5) || '17:00'}
                                </p>
                                <p className="text-xs text-rose-600/70 mt-1">Clock-out sebelum jam ini = Pulang Awal</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Other Settings Cards */}
            <div className="grid gap-4 md:grid-cols-2">
                <Link href="/dashboard/settings/access">
                    <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <div className="p-3 bg-green-100 dark:bg-green-900/20 text-green-600 rounded-xl">
                                <Users size={22} />
                            </div>
                            <div>
                                <CardTitle className="text-base text-zinc-900 dark:text-zinc-50">Kontrol Akses & Peran</CardTitle>
                                <p className="text-xs text-muted-foreground">Kelola hak akses untuk seluruh karyawan</p>
                            </div>
                        </CardHeader>
                    </Card>
                </Link>

                {/* Keamanan */}
                <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <CardHeader className="flex flex-row items-start justify-between pb-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 text-purple-600 rounded-xl">
                                <Shield size={22} />
                            </div>
                            <div>
                                <CardTitle className="text-base">Keamanan</CardTitle>
                                <p className="text-xs text-muted-foreground">Enkripsi dan kebijakan data.</p>
                            </div>
                        </div>
                        {!editingSecurity && (
                            <Button variant="ghost" size="sm" onClick={() => {
                                setRequire2fa(org?.require_2fa ? 'true' : 'false')
                                setPassPolicy(org?.password_policy || 'standard')
                                setEditingSecurity(true)
                            }}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                        )}
                    </CardHeader>
                    {editingSecurity && (
                        <CardContent className="space-y-4 pt-0">
                            <div className="space-y-2">
                                <Label>Wajib Autentikasi 2 Faktor (2FA)</Label>
                                <Select value={require2fa} onValueChange={setRequire2fa}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="false">Opsional</SelectItem>
                                        <SelectItem value="true">Wajib untuk Semua Karyawan</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Kebijakan Password</Label>
                                <Select value={passPolicy} onValueChange={setPassPolicy}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="standard">Standar (Minimum 6 Karakter)</SelectItem>
                                        <SelectItem value="strict">Ketat (Harus ada huruf besar & angka)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" onClick={() => updateSettings({ require_2fa: require2fa === 'true', password_policy: passPolicy }, setSavingSecurity, setEditingSecurity)} disabled={savingSecurity}>
                                    {savingSecurity ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Simpan
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingSecurity(false)}>Batal</Button>
                            </div>
                        </CardContent>
                    )}
                </Card>

                {/* Integrasi & Webhook */}
                <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <CardHeader className="flex flex-row items-start justify-between pb-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-100 dark:bg-amber-900/20 text-amber-600 rounded-xl">
                                <Globe size={22} />
                            </div>
                            <div>
                                <CardTitle className="text-base">Integrasi & Webhook</CardTitle>
                                <p className="text-xs text-muted-foreground">Hubungkan dengan sistem eksternal.</p>
                            </div>
                        </div>
                        {!editingWebhook && (
                            <Button variant="ghost" size="sm" onClick={() => {
                                setWebhookUrl(org?.webhook_url || '')
                                setWebhookSecret(org?.webhook_secret || '')
                                setEditingWebhook(true)
                            }}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                        )}
                    </CardHeader>
                    {editingWebhook && (
                        <CardContent className="space-y-4 pt-0">
                            <div className="space-y-2">
                                <Label>Webhook URL</Label>
                                <Input placeholder="https://api.domain.com/webhook" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Secret Key</Label>
                                <Input type="password" placeholder="whsec_..." value={webhookSecret} onChange={e => setWebhookSecret(e.target.value)} />
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" onClick={() => updateSettings({ webhook_url: webhookUrl, webhook_secret: webhookSecret }, setSavingWebhook, setEditingWebhook)} disabled={savingWebhook}>
                                    {savingWebhook ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Simpan
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingWebhook(false)}>Batal</Button>
                            </div>
                        </CardContent>
                    )}
                </Card>

                {/* Branding */}
                <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <CardHeader className="flex flex-row items-start justify-between pb-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-rose-100 dark:bg-rose-900/20 text-rose-600 rounded-xl">
                                <Building size={22} />
                            </div>
                            <div>
                                <CardTitle className="text-base">Branding</CardTitle>
                                <p className="text-xs text-muted-foreground">Warna dan tampilan kustom.</p>
                            </div>
                        </div>
                        {!editingBrand && (
                            <Button variant="ghost" size="sm" onClick={() => {
                                setThemeColor(org?.theme_color || 'slate')
                                setEditingBrand(true)
                            }}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                        )}
                    </CardHeader>
                    {editingBrand && (
                        <CardContent className="space-y-4 pt-0">
                            <div className="space-y-2">
                                <Label>Tema Warna Utama</Label>
                                <Select value={themeColor} onValueChange={setThemeColor}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="slate">Slate (Default)</SelectItem>
                                        <SelectItem value="blue">Blue Corporate</SelectItem>
                                        <SelectItem value="rose">Rose / Pink</SelectItem>
                                        <SelectItem value="emerald">Emerald / Green</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" onClick={() => updateSettings({ theme_color: themeColor }, setSavingBrand, setEditingBrand)} disabled={savingBrand}>
                                    {savingBrand ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Simpan
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingBrand(false)}>Batal</Button>
                            </div>
                        </CardContent>
                    )}
                </Card>
            </div>
        </div>
    )
}
