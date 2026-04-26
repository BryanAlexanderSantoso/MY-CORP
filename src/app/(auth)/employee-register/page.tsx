'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from '@/components/ui/card'
import { toast } from 'sonner'
import { Building2, KeyRound, Loader2, Mail, User, Hash } from 'lucide-react'

export default function EmployeeRegisterPage() {
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [companySlug, setCompanySlug] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await fetch('/api/auth/employee-register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, fullName, companySlug }),
            })
            const result = await res.json()
            if (!res.ok) throw new Error(result.error)

            // Auto sign-in
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: password.trim(),
            })
            if (signInError) {
                toast.success(`Akun berhasil dibuat! Silakan login.`)
                router.push('/login')
            } else {
                toast.success(`Selamat datang di ${result.orgName}, ${fullName}! 🎉`)
                router.push('/dashboard/employee-portal')
            }
        } catch (error: any) {
            toast.error(error.message || 'Registrasi gagal')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="flex flex-col items-center text-center space-y-2">
                    <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-2xl">
                        <Building2 className="w-10 h-10 text-indigo-600" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                        Daftar Sebagai Karyawan
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                        Masukkan kode perusahaan dari admin Anda untuk bergabung
                    </p>
                </div>

                <Card className="border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none rounded-2xl">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-xl font-semibold">Buat Akun Karyawan</CardTitle>
                        <CardDescription className="text-sm">
                            Minta kode perusahaan (company slug) kepada admin atau HRD Anda.
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleRegister}>
                        <CardContent className="space-y-4">
                            {/* Company Slug */}
                            <div className="space-y-2">
                                <Label htmlFor="slug">Kode Perusahaan</Label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                                    <Input
                                        id="slug"
                                        placeholder="contoh: my-org-abc123"
                                        className="pl-10 h-11 rounded-xl"
                                        value={companySlug}
                                        onChange={e => setCompanySlug(e.target.value)}
                                        required
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">Dapat dilihat di Settings → Organization oleh admin.</p>
                            </div>

                            {/* Full Name */}
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Nama Lengkap</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                                    <Input
                                        id="fullName"
                                        placeholder="Nama lengkap Anda"
                                        className="pl-10 h-11 rounded-xl"
                                        value={fullName}
                                        onChange={e => setFullName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="email@company.com"
                                        className="pl-10 h-11 rounded-xl"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Min. 6 karakter"
                                        className="pl-10 h-11 rounded-xl"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        minLength={6}
                                        required
                                    />
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="flex flex-col space-y-4 pt-2">
                            <Button
                                type="submit"
                                className="w-full h-11 text-base font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Daftar & Bergabung
                            </Button>
                            <div className="text-center text-sm text-zinc-500 dark:text-zinc-400">
                                Sudah punya akun?{' '}
                                <a href="/login" className="text-primary font-semibold hover:underline">
                                    Login di sini
                                </a>
                            </div>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    )
}
