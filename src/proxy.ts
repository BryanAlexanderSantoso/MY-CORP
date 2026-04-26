import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that ONLY admins/owners/staff can access
const ADMIN_ONLY_ROUTES = [
    '/dashboard/inventory',
    '/dashboard/crm',
    '/dashboard/hrm',
    '/dashboard/sales',
    '/dashboard/analytics',
    '/dashboard/settings',
]

// The employee's dedicated portal
const EMPLOYEE_PORTAL = '/dashboard/employee-portal'
const EMPLOYEE_HOME = '/dashboard/employee-portal'
const ADMIN_HOME = '/dashboard'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // This will refresh the session if it's expired
    const { data: { user } } = await supabase.auth.getUser()
    const pathname = request.nextUrl.pathname

    // Not logged in → redirect to login if accessing dashboard
    if (!user && pathname.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Logged in → redirect from auth pages to dashboard
    if (user && (pathname === '/login' || pathname === '/register' || pathname === '/')) {
        // Check role to redirect to the correct dashboard
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const role = profile?.role
        if (role === 'EMPLOYEE') {
            return NextResponse.redirect(new URL(EMPLOYEE_HOME, request.url))
        }
        return NextResponse.redirect(new URL(ADMIN_HOME, request.url))
    }

    // Role-based access control for dashboard routes
    if (user && pathname.startsWith('/dashboard')) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const role = profile?.role

        if (role === 'EMPLOYEE') {
            // Employee is trying to access admin-only page → redirect to portal
            const isAdminRoute = ADMIN_ONLY_ROUTES.some(r => pathname.startsWith(r))
            // Also block main /dashboard (exact) — that's the admin executive overview
            const isMainDashboard = pathname === '/dashboard'

            if (isAdminRoute || isMainDashboard) {
                return NextResponse.redirect(new URL(EMPLOYEE_HOME, request.url))
            }
        }
    }

    return response
}

export default async function proxy(request: NextRequest) {
    return await updateSession(request)
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
