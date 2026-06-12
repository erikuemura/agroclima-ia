import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { adminToken, ADMIN_COOKIE } from '@/lib/admin-auth'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // Backoffice: /backoffice/* exige sessão de admin (exceto a tela de login)
  const { pathname } = request.nextUrl
  if (pathname.startsWith('/backoffice')) {
    // Nunca indexar o backoffice (nem a tela de login)
    supabaseResponse.headers.set('X-Robots-Tag', 'noindex, nofollow')
    if (pathname !== '/backoffice/login') {
      const expected = await adminToken()
      const session = request.cookies.get(ADMIN_COOKIE)?.value
      if (!expected || session !== expected) {
        const url = request.nextUrl.clone()
        url.pathname = '/backoffice/login'
        return NextResponse.redirect(url)
      }
    }
    return supabaseResponse
  }

  // Se Supabase não estiver configurado, deixa passar
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return supabaseResponse

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Rotas protegidas — redireciona para /login se não autenticado
  const protectedPaths = ['/app', '/culturas', '/talhoes', '/ndvi', '/solo', '/irrigacao', '/pulverizacao', '/calendario', '/relatorios', '/assistente', '/financeiro', '/diario', '/estoque', '/planejamento', '/comunidade', '/consultor']
  const isProtected = protectedPaths.some(p => request.nextUrl.pathname === p || request.nextUrl.pathname.startsWith(p + '/'))

  // Demo mode: cookie demo_profile bypasses auth
  const isDemo = request.cookies.get('demo_profile')?.value
  if (isProtected && !user && process.env.NEXT_PUBLIC_SUPABASE_URL && !isDemo) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|api).*)'],
}
