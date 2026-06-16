import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Demonstração ao vivo — CampoClima',
  description: 'Experimente o CampoClima sem criar conta. Veja o dashboard, NDVI por satélite, AgroAssistente IA e todos os módulos com dados reais de fazendas brasileiras.',
  openGraph: {
    title: 'Demonstração ao vivo — CampoClima',
    description: 'Teste agora sem cadastro. Dashboard completo com IA, satélite e clima real.',
    url: '/demo',
  },
}

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children
}
