'use client'

import { AppSidebar } from "@/components/shared/app-sidebar"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Bell, Search, UserCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useProfile, isEmployee } from "@/hooks/use-profile"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { data: profile } = useProfile()
    const isEmp = isEmployee(profile?.role)
    const { useRouter } = require('next/navigation')
    const { useEffect } = require('react')
    const { createClient } = require('@/lib/supabase/client')
    const router = useRouter()

    useEffect(() => {
        if (!profile || isEmp || !profile.tenant_id) return

        const checkOrg = async () => {
            const supabase = createClient()
            const { data } = await supabase.from('organizations').select('onboarding_completed').eq('id', profile.tenant_id).single()
            if (data && !data.onboarding_completed) {
                router.push('/onboarding')
            }
        }
        checkOrg()
    }, [profile, isEmp, router])

    const roleLabel = isEmp ? 'Karyawan' : (profile?.role || 'Admin')

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="bg-zinc-50 dark:bg-zinc-950">
                <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-6 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 bg-white dark:bg-zinc-900 sticky top-0 z-10 shadow-sm">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem className="hidden md:block">
                                    <BreadcrumbLink href="#">MyCorporate</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>
                                        {isEmp ? 'Employee Portal' : 'Dashboard'}
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Search — only for admins */}
                        {!isEmp && (
                            <div className="relative hidden lg:block">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="search"
                                    placeholder="Universal Search..."
                                    className="pl-9 h-10 w-64 rounded-xl border border-input bg-transparent text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>
                        )}
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <Bell className="h-5 w-5" />
                        </Button>
                        <Separator orientation="vertical" className="h-6" />
                        <div className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded-lg transition-colors">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold leading-tight">
                                    {profile?.full_name || 'User'}
                                </p>
                                <p className="text-[10px] text-muted-foreground leading-tight">
                                    {roleLabel}
                                </p>
                            </div>
                            <UserCircle className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </div>
                </header>
                <main className="flex flex-1 flex-col gap-4 p-6 overflow-y-auto">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
