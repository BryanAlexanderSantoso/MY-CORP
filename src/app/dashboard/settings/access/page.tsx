'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Users, Search, Loader2, MoreHorizontal, Ban, Unlock, Trash2 } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const supabase = createClient()

export default function AccessControlPage() {
    const qc = useQueryClient()
    const [search, setSearch] = useState('')

    // Fetch users (profiles + employee info if available) including ban status from server API
    const { data: users, isLoading } = useQuery({
        queryKey: ['access-control-users'],
        queryFn: async () => {
            const res = await fetch('/api/org/list-users')
            if (!res.ok) throw new Error('Failed to fetch users')
            const data = await res.json()
            if (data.error) throw new Error(data.error)
            return data
        }
    })

    const updateRoleMutation = useMutation({
        mutationFn: async ({ userId, newRole }: { userId: string, newRole: string }) => {
            const res = await fetch('/api/org/update-user-role', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId: userId, newRole }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            return data
        },
        onSuccess: () => {
            toast.success('Pembaruan peran sukses')
            qc.invalidateQueries({ queryKey: ['access-control-users'] })
        },
        onError: (err: any) => {
            toast.error(err.message || 'Gagal mengubah peran')
        }
    })

    const manageUserMutation = useMutation({
        mutationFn: async ({ userId, action }: { userId: string, action: string }) => {
            const res = await fetch('/api/org/manage-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId: userId, action }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            return data
        },
        onSuccess: (_, variables) => {
            const actionLabel = variables.action === 'ban' ? 'diblokir' : variables.action === 'unban' ? 'dipulihkan' : 'dihapus'
            toast.success(`Akun berhasil ${actionLabel}`)
            qc.invalidateQueries({ queryKey: ['access-control-users'] })
        },
        onError: (err: any) => {
            toast.error(err.message || 'Gagal melakukan tindakan')
        }
    })

    const filteredUsers = (users || []).filter((u: any) =>
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.employees?.[0]?.email?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Kontrol Akses & Peran</h1>
                    <p className="text-muted-foreground">Kelola hak akses untuk seluruh karyawan di perusahaan ini.</p>
                </div>
                <Link href="/dashboard/settings">
                    <Button variant="outline" className="rounded-xl">Kembali ke Settings</Button>
                </Link>
            </div>

            <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm">
                <CardHeader className="bg-zinc-50/50 border-b py-4">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Users className="h-5 w-5 text-green-600" /> Daftar Pengguna
                        </CardTitle>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari nama atau email..."
                                className="pl-9 h-9 rounded-xl"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-8 flex justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-zinc-100/50 dark:bg-zinc-800/50">
                                <TableRow>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Departemen</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Peran (Role)</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.map((u: any) => (
                                    <TableRow key={u.id}>
                                        <TableCell className="font-medium text-nowrap">{u.full_name}</TableCell>
                                        <TableCell className="text-muted-foreground">{u.employees?.[0]?.email || '—'}</TableCell>
                                        <TableCell>{u.employees?.[0]?.department || '—'}</TableCell>
                                        <TableCell>
                                            {u.is_banned ? (
                                                <Badge variant="destructive" className="bg-red-500/10 text-red-600 hover:bg-red-500/20 shadow-none border-red-500/20">Banned</Badge>
                                            ) : (
                                                <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20 shadow-none border-green-500/20">Aktif</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                value={u.role}
                                                onValueChange={(val) => {
                                                    updateRoleMutation.mutate({ userId: u.id, newRole: val })
                                                }}
                                                disabled={updateRoleMutation.isPending}
                                            >
                                                <SelectTrigger className="w-[140px] h-8 rounded-lg">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="EMPLOYEE">Employee (Portal)</SelectItem>
                                                    <SelectItem value="STAFF">Staff (Dashboard)</SelectItem>
                                                    <SelectItem value="ADMIN">Admin (Full)</SelectItem>
                                                    {u.role === 'OWNER' && <SelectItem value="OWNER">Owner</SelectItem>}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Buka menu aksi</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {u.is_banned ? (
                                                        <DropdownMenuItem onClick={() => manageUserMutation.mutate({ userId: u.id, action: 'unban' })}>
                                                            <Unlock className="mr-2 h-4 w-4" />
                                                            Unban Akun
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950" onClick={() => manageUserMutation.mutate({ userId: u.id, action: 'ban' })}>
                                                            <Ban className="mr-2 h-4 w-4" />
                                                            Ban Akun
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950" onClick={() => {
                                                        if (confirm('Anda yakin ingin menghapus akun ini secara permanen?')) {
                                                            manageUserMutation.mutate({ userId: u.id, action: 'delete' })
                                                        }
                                                    }}>
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Hapus Permanen
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center p-8 text-muted-foreground">Tidak ada pengguna ditemukan.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
