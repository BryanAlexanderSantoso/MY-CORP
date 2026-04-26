'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription
} from '@/components/ui/card'
import { toast } from 'sonner'
import { Building2, KeyRound, Loader2, Mail, ShieldCheck, User } from 'lucide-react'

export default function LoginPage() {
    const [tab, setTab] = useState<'admin' | 'employee'>('admin')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) throw error

            // Check actual role from database to determine correct redirect
            let targetPath = '/dashboard'
            if (signInData.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', signInData.user.id)
                    .single()
                if (profile?.role === 'EMPLOYEE') {
                    targetPath = '/dashboard/employee-portal'
                }
            }

            toast.success('Login berhasil!')
            router.push(targetPath)
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || 'Login gagal')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900 p-4">
            <div className="w-full max-w-md space-y-8">
                {/* Logo */}
                <div className="flex flex-col items-center text-center space-y-2">
                    <div className="bg-primary/10 p-3 rounded-2xl">
                        <Building2 className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">MyCorporate</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">Enterprise Management System</p>
                </div>

                {/* Tab Toggle */}
                <div className="flex rounded-2xl bg-zinc-100 dark:bg-zinc-800 p-1 gap-1">
                    <button
                        type="button"
                        onClick={() => setTab('admin')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === 'admin'
                            ? 'bg-white dark:bg-zinc-900 shadow-sm text-zinc-900 dark:text-zinc-100'
                            : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                            }`}
                    >
                        <ShieldCheck className="h-4 w-4" />
                        Admin / Owner
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('employee')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === 'employee'
                            ? 'bg-white dark:bg-zinc-900 shadow-sm text-zinc-900 dark:text-zinc-100'
                            : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                            }`}
                    >
                        <User className="h-4 w-4" />
                        Karyawan
                    </button>
                </div>

                <Card className="border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none rounded-2xl">
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-xl font-semibold">
                            {tab === 'admin' ? '🔐 Admin Login' : '👤 Login Karyawan'}
                        </CardTitle>
                        <CardDescription className="text-sm">
                            {tab === 'admin'
                                ? 'Masuk sebagai pemilik atau admin organisasi.'
                                : 'Masuk untuk absensi dan cek status izin Anda.'}
                        </CardDescription>
                    </CardHeader>

                    <form onSubmit={handleLogin}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="nama@perusahaan.com"
                                        className="pl-10 h-11 rounded-xl"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-10 h-11 rounded-xl"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="flex flex-col space-y-4 pt-2">
                            <Button
                                type="submit"
                                className="w-full h-11 text-base font-semibold rounded-xl"
                                disabled={loading}
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Masuk
                            </Button>

                            {/* Bottom link — only employee tab shows register */}
                            {tab === 'employee' ? (
                                <div className="text-center text-sm text-zinc-500 dark:text-zinc-400">
                                    Belum punya akun karyawan?{' '}
                                    <a href="/employee-register" className="text-indigo-600 font-semibold hover:underline">
                                        Daftar di sini
                                    </a>
                                </div>
                            ) : (
                                <div className="text-center text-xs text-zinc-400 dark:text-zinc-600">
                                    Admin: hubungi developer untuk setup akun organisasi baru.
                                </div>
                            )}
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    )
}
