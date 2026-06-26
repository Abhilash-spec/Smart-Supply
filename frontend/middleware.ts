import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Skip middleware for Next.js Server Actions — these are POST requests with
  // a special header. Running auth checks on them causes the "Unexpected token '<'"
  // JSON parsing error because a redirect returns HTML to the client JS caller.
  if (
    request.headers.get('next-action') ||
    request.headers.get('content-type')?.includes('text/x-component')
  ) {
    return NextResponse.next()
  }

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
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // 1. Anonymous Routes
  const isPublicAnonRoute = ['/login', '/register', '/forgot-password', '/reset-password'].some(r => pathname.startsWith(r))
  const isSystemAnonRoute = ['/system/login', '/system/register'].some(r => pathname.startsWith(r))
  const isAnonRoute = isPublicAnonRoute || isSystemAnonRoute

  // 2. Redirect Unauthenticated Users
  if (!user && !isAnonRoute) {
    // If they were trying to access a system route, redirect to system login, else public login
    const isSystemPath = pathname.startsWith('/system') || pathname.startsWith('/superadmin')
    const redirectUrl = new URL(isSystemPath ? '/system/login' : '/login', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // 3. Routing for Authenticated Users
  if (user) {
    const role = user.user_metadata?.role || 'admin'
    const staffType = user.user_metadata?.staff_type // 'shop' or 'vendor'
    const isSuperadmin = role === 'superadmin'

    // Prevent Superadmins from accessing public customer pages
    if (isSuperadmin && !pathname.startsWith('/system') && !pathname.startsWith('/superadmin')) {
      return NextResponse.redirect(new URL('/superadmin', request.url))
    }

    // Prevent Normal Users/Staff from accessing system pages
    if (!isSuperadmin && (pathname.startsWith('/system') || pathname.startsWith('/superadmin'))) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Handle authenticated users landing on anon routes (like /login)
    if (isAnonRoute) {
      if (isSuperadmin) {
        return NextResponse.redirect(new URL('/superadmin', request.url))
      } else if (role === 'staff') {
        return NextResponse.redirect(new URL(staffType === 'vendor' ? '/vendor/pos' : '/pos', request.url))
      } else if (role === 'vendor') {
        return NextResponse.redirect(new URL('/vendor', request.url))
      } else {
        return NextResponse.redirect(new URL('/', request.url))
      }
    }
    
    // Force Staff users away from dashboard roots and subscription pages if needed
    // (We allow them on /pos or /vendor/pos)
    if (role === 'staff') {
      const allowedPaths = staffType === 'vendor' ? ['/vendor/pos', '/customers'] : ['/pos', '/customers']
      if (!allowedPaths.some(p => pathname.startsWith(p)) && pathname !== '/logout') {
         // Optionally restrict them completely to POS
         return NextResponse.redirect(new URL(allowedPaths[0], request.url))
      }
    }
  }

  // ─── Security Headers ───────────────────────────────────
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  )
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  // Required for Next.js
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  )

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
