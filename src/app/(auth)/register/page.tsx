'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Building2, KeyRound, Loader2, Mail, User } from 'lucide-react'

export default function RegisterPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [orgName, setOrgName] = useState('')
    const [fullName, setFullName] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Call server-side route which uses service_role to bypass RLS
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), password: password.trim(), orgName, fullName }),
            })
            const result = await res.json()
            if (!res.ok) throw new Error(result.error || 'Registration failed')

            // Auto sign-in after successful registration
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: password.trim(),
            })
            if (signInError) {
                toast.success('Account created! Please login.')
                router.push('/login')
            } else {
                toast.success(`Welcome, ${fullName}! Organization "${orgName}" created.`)
                router.push('/onboarding')
            }
        } catch (error: any) {
            toast.error(error.message || 'Registration failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
            <div className="w-full max-w-lg space-y-8">
                <div className="flex flex-col items-center text-center space-y-2">
                    <div className="bg-primary/10 p-3 rounded-2xl">
                        <Building2 className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                        Create Organization
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Start your enterprise journey with MyCorporate
                    </p>
                </div>

                <Card className="border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-semibold">Get Started</CardTitle>
                        <CardDescription>
                            Register your business and personal details
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleRegister}>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="orgName">Organization Name</Label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                                        <Input
                                            id="orgName"
                                            placeholder="Acme Corp"
                                            className="pl-10 h-11"
                                            value={orgName}
                                            onChange={(e) => setOrgName(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Your Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                                        <Input
                                            id="fullName"
                                            placeholder="John Doe"
                                            className="pl-10 h-11"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Work Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@company.com"
                                        className="pl-10 h-11"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Create Password</Label>
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                                    <Input
                                        id="password"
                                        type="password"
                                        className="pl-10 h-11"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-4 pt-4">
                            <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Create Organization & Account
                            </Button>
                            <div className="text-center text-sm text-zinc-500 dark:text-zinc-400">
                                Already have an account?{' '}
                                <a href="/login" className="text-primary font-semibold hover:underline">
                                    Sign In
                                </a>
                            </div>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    )
}
