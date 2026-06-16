// Pings search engines on every production deploy so new pages are indexed quickly.
// Runs once when the Next.js server starts (instrumentation hook).
export async function register() {
  if (process.env.NODE_ENV !== 'production') return
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://campoclima.com.br'
  const INDEXNOW_KEY = '978dd6db4ba3ceb6097ec13d12c1eb9c'

  const urls = [
    `${BASE}/`,
    `${BASE}/precos`,
    `${BASE}/demo`,
    `${BASE}/ferramentas`,
    `${BASE}/ferramentas/previsao-do-tempo`,
    `${BASE}/ferramentas/valor-da-safra`,
    `${BASE}/ferramentas/calagem`,
    `${BASE}/ferramentas/populacao-de-plantas`,
  ]

  try {
    // IndexNow — notifica Bing, Yandex, Seznam (Bing repassa ao Google)
    await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: new URL(BASE).hostname,
        key: INDEXNOW_KEY,
        keyLocation: `${BASE}/${INDEXNOW_KEY}.txt`,
        urlList: urls,
      }),
      signal: AbortSignal.timeout(8000),
    })

    // Ping direto do sitemap ao Google (método legado mas ainda funciona)
    await fetch(
      `https://www.google.com/ping?sitemap=${encodeURIComponent(`${BASE}/sitemap.xml`)}`,
      { signal: AbortSignal.timeout(8000) }
    )

    console.log('[instrumentation] Search engines pinged successfully')
  } catch (err) {
    // Não crítico — não quebra o deploy se falhar
    console.warn('[instrumentation] Search engine ping failed:', err)
  }
}
