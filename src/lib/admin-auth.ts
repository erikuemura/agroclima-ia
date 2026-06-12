// ─────────────────────────────────────────────────────────────
// Autenticação do backoffice.
// Sessão = cookie httpOnly com HMAC(ADMIN_PASSWORD, payload fixo).
// Usa Web Crypto (funciona em Node e no Edge runtime do proxy).
// ─────────────────────────────────────────────────────────────

const COOKIE_NAME = 'admin_session'
const PAYLOAD = 'campoclima-admin-v1'

export { COOKIE_NAME as ADMIN_COOKIE }

export async function adminToken(): Promise<string | null> {
  const secret = process.env.ADMIN_PASSWORD
  if (!secret) return null
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(PAYLOAD))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function isAdminRequest(req: Request): Promise<boolean> {
  const expected = await adminToken()
  if (!expected) return false
  const cookie = req.headers.get('cookie') ?? ''
  const match = cookie.match(/admin_session=([^;]+)/)
  return match?.[1] === expected
}

export function unauthorized(): Response {
  return Response.json({ error: 'Não autorizado' }, { status: 401 })
}
