import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { adminToken, ADMIN_COOKIE } from '@/lib/admin-auth'
import { buildProfileFromFarm, encodeProfileCookie, FARM_PROFILE_COOKIE, type DbFarm, type DbCrop } from '@/lib/real-profile'

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

  // Usuário REAL em rota protegida: garante que o perfil é a fazenda dele,
  // não o demo. Sem cookie farm_profile → busca no banco (RLS) e reidrata;
  // sem fazenda cadastrada → onboarding.
  if (isProtected && user && !request.cookies.get(FARM_PROFILE_COOKIE)?.value) {
    try {
      const { data: farms, error } = await supabase
        .from('farms')
        .select('id,name,city,state,lat,lon,hectares')
        .limit(1)

      if (!error && farms && farms.length > 0) {
        const farm = farms[0] as DbFarm
        const { data: crops } = await supabase
          .from('crops')
          .select('id,name,variety,field,hectares,planted_at,harvest_at,expected_yield')
          .eq('farm_id', farm.id)
        const profile = buildProfileFromFarm(farm, (crops ?? []) as DbCrop[], user.email ?? '')
        supabaseResponse.cookies.set(FARM_PROFILE_COOKIE, encodeProfileCookie(profile), {
          path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax',
        })
        // demo_profile não pode mascarar a fazenda real
        supabaseResponse.cookies.set('demo_profile', '', { path: '/', maxAge: 0 })
      } else if (!error) {
        // Logado e sem fazenda → completar o cadastro
        const url = request.nextUrl.clone()
        url.pathname = '/onboarding'
        return NextResponse.redirect(url)
      }
      // error (ex.: tabela ainda não criada) → segue com demo, sem quebrar
    } catch { /* banco indisponível — não bloqueia a navegação */ }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|api).*)'],
}
