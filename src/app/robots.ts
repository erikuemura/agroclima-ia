import type { MetadataRoute } from 'next'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://campoclima.com.br'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Área logada, backoffice e APIs fora do índice
        disallow: ['/app', '/backoffice', '/api/', '/assistente', '/financeiro', '/diario', '/estoque', '/planejamento', '/comunidade', '/consultor', '/configuracoes'],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  }
}
