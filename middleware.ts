import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ✅ Never block the auth callback
  if (pathname.startsWith('/auth/callback')) {
    return NextResponse.next()
  }

  const response = NextResponse.next()

  // Add cache control headers for OG metadata routes
  if (pathname.startsWith('/r/')) {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 🔒 Protect dashboard, onboarding, and analytics
  if ((pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding') || pathname.startsWith('/analytics')) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 🚫 Logged-in users shouldn't see login - but check if they need onboarding with skipChat
  if (pathname.startsWith('/login') && user) {
    const skipChat = request.nextUrl.searchParams.get('skipChat')
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .maybeSingle()
    
    // If they need onboarding and have skipChat param, send them to onboarding
    if ((!profile || !profile.onboarding_completed) && skipChat === 'true') {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      url.searchParams.set('skipChat', 'true')
      return NextResponse.redirect(url)
    }
    
    // Otherwise redirect to dashboard
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Check onboarding status for dashboard access
  if (pathname.startsWith('/dashboard') && user) {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .maybeSingle()

    if (error || !profile || !profile.onboarding_completed) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding/:path*', '/login', '/auth/callback', '/analytics/:path*', '/r/:path*'],
}
