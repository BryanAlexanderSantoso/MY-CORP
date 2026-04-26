'use client'

import * as React from "react"
import {
    BarChart3,
    Box,
    Building2,
    Calendar,
    ChevronRight,
    Clock,
    CalendarX,
    LayoutDashboard,
    LogOut,
    Settings,
    Users,
    UserCircle,
    Briefcase,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useProfile, isEmployee } from "@/hooks/use-profile"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarRail,
} from "@/components/ui/sidebar"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// ── Types ──────────────────────────────────────────────────────
interface NavItem {
    title: string
    url: string
    icon: any
    items?: { title: string; url: string }[]
}

// ── Admin / Owner / Staff navigation ───────────────────────────
const adminItems: NavItem[] = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Inventory",
        url: "/dashboard/inventory",
        icon: Box,
        items: [
            { title: "Products", url: "/dashboard/inventory/products" },
            { title: "Stock Ledger", url: "/dashboard/inventory/ledger" },
            { title: "Warehouses", url: "/dashboard/inventory/warehouses" },
        ],
    },
    {
        title: "Sales & CRM",
        url: "/dashboard/crm",
        icon: Users,
        items: [
            { title: "Leads", url: "/dashboard/crm/leads" },
            { title: "Pipeline", url: "/dashboard/crm/pipeline" },
            { title: "Sales Orders", url: "/dashboard/sales" },
        ],
    },
    {
        title: "HRM",
        url: "/dashboard/hrm",
        icon: Calendar,
        items: [
            { title: "Employees", url: "/dashboard/hrm/employees" },
            { title: "Attendance & Leave", url: "/dashboard/hrm/attendance" },
        ],
    },
    {
        title: "Analytics",
        url: "/dashboard/analytics",
        icon: BarChart3,
    },
    {
        title: "Settings",
        url: "/dashboard/settings",
        icon: Settings,
    },
]

// ── Employee-only navigation ───────────────────────────────────
const employeeItems: NavItem[] = [
    {
        title: "Beranda",
        url: "/dashboard/employee-portal",
        icon: LayoutDashboard,
    },
    {
        title: "Absensi",
        url: "/dashboard/employee-portal/attendance",
        icon: Clock,
    },
    {
        title: "Izin & Cuti",
        url: "/dashboard/employee-portal/leave",
        icon: CalendarX,
    },
]

export function AppSidebar() {
    const router = useRouter()
    const supabase = createClient()
    const { data: profile } = useProfile()

    const isEmp = isEmployee(profile?.role)
    const items = isEmp ? employeeItems : adminItems

    const handleLogout = async () => {
        await supabase.auth.signOut()
        toast.success('Berhasil logout.')
        router.push('/login')
        router.refresh()
    }

    const initials = profile?.full_name
        ?.split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || '?'

    const roleBadge = isEmp
        ? { label: 'Karyawan', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
        : { label: profile?.role || 'Admin', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' }

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <div className="flex items-center gap-3 px-3 py-4">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        {isEmp ? <Briefcase className="size-5" /> : <Building2 className="size-5" />}
                    </div>
                    <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                        <span className="font-semibold text-lg">MyCorporate</span>
                        <span className="text-xs text-muted-foreground">
                            {isEmp ? 'Employee Portal' : 'Enterprise ERP'}
                        </span>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent>
                <SidebarMenu className="px-2">
                    {items.map((item) => (
                        <React.Fragment key={item.title}>
                            {'items' in item && item.items ? (
                                <Collapsible asChild defaultOpen className="group/collapsible">
                                    <SidebarMenuItem>
                                        <CollapsibleTrigger asChild>
                                            <SidebarMenuButton tooltip={item.title}>
                                                {item.icon && <item.icon className="size-4" />}
                                                <span>{item.title}</span>
                                                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                            </SidebarMenuButton>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                {item.items.map((subItem) => (
                                                    <SidebarMenuSubItem key={subItem.title}>
                                                        <SidebarMenuSubButton asChild>
                                                            <a href={subItem.url}>
                                                                <span>{subItem.title}</span>
                                                            </a>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                ))}
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    </SidebarMenuItem>
                                </Collapsible>
                            ) : (
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild tooltip={item.title}>
                                        <a href={item.url}>
                                            {item.icon && <item.icon className="size-4" />}
                                            <span>{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}
                        </React.Fragment>
                    ))}
                </SidebarMenu>
            </SidebarContent>

            <SidebarFooter className="p-3 border-t border-zinc-200 dark:border-zinc-800">
                {/* Collapsed: just avatar */}
                <div className="group-data-[collapsible=icon]:flex hidden justify-center">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="rounded-full">
                                <Avatar className="h-8 w-8 border-2 border-zinc-200 dark:border-zinc-700">
                                    <AvatarFallback className="text-xs font-bold bg-primary text-primary-foreground">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="end" className="rounded-xl w-48">
                            <DropdownMenuItem className="text-xs text-muted-foreground" disabled>
                                {profile?.email}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={handleLogout}>
                                <LogOut className="mr-2 h-4 w-4" /> Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Expanded: full user card */}
                <div className="group-data-[collapsible=icon]:hidden flex items-center gap-3 rounded-xl p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                    <Avatar className="h-9 w-9 border-2 border-zinc-200 dark:border-zinc-700 shrink-0">
                        <AvatarFallback className="text-xs font-bold bg-primary text-primary-foreground">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-sm font-semibold leading-tight truncate">
                            {profile?.full_name || 'User'}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 rounded-md border ${roleBadge.className}`}>
                                {roleBadge.label}
                            </Badge>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        onClick={handleLogout}
                        title="Logout"
                    >
                        <LogOut className="h-4 w-4" />
                    </Button>
                </div>
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    )
}
