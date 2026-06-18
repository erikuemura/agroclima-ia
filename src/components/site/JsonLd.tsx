// Dados estruturados (Schema.org / JSON-LD) para rich results no Google.
// Renderizado no servidor — entra no HTML inicial, ideal para SEO.

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://campoclima.com.br'

function JsonLdScript({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // JSON-LD não é executável; conteúdo controlado por nós (sem input do usuário)
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

// Organização + produto SaaS — usado na home
export function OrganizationJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${BASE}/#organization`,
        name: 'CampoClima',
        url: BASE,
        logo: `${BASE}/icons/icon-512.png`,
        description: 'Plataforma de gestão agrícola com IA para pequenos e médios produtores rurais brasileiros.',
        areaServed: { '@type': 'Country', name: 'Brasil' },
        contactPoint: {
          '@type': 'ContactPoint',
          email: 'contato@campoclima.com.br',
          contactType: 'customer support',
          availableLanguage: 'Portuguese',
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${BASE}/#website`,
        url: BASE,
        name: 'CampoClima',
        publisher: { '@id': `${BASE}/#organization` },
        inLanguage: 'pt-BR',
      },
      {
        '@type': 'SoftwareApplication',
        name: 'CampoClima',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web, Android, iOS (PWA)',
        offers: [
          { '@type': 'Offer', price: '0', priceCurrency: 'BRL', name: 'Gratuito' },
          { '@type': 'Offer', price: '49', priceCurrency: 'BRL', name: 'Produtor' },
          { '@type': 'Offer', price: '129', priceCurrency: 'BRL', name: 'Premium' },
        ],
        description: 'Clima em tempo real, NDVI por satélite, análise de solo, controle de pragas e AgroAssistente com IA para o produtor rural.',
        url: BASE,
      },
    ],
  }
  return <JsonLdScript data={data} />
}

// FAQ — espelha o FAQ visível na landing (rich result de perguntas)
export function FaqJsonLd({ items }: { items: { q: string; a: string }[] }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }
  return <JsonLdScript data={data} />
}

// Ferramenta/calculadora — usado nas páginas de /ferramentas
export function ToolJsonLd({ name, description, path }: { name: string; description: string; path: string }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name,
    description,
    url: `${BASE}${path}`,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    isAccessibleForFree: true,
    inLanguage: 'pt-BR',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' },
    publisher: { '@type': 'Organization', name: 'CampoClima', url: BASE },
  }
  return <JsonLdScript data={data} />
}
