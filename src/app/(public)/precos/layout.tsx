import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Planos e Preços — CampoClima',
  description: 'Comece grátis e evolua quando fizer sentido. Plano Produtor por R$ 49/mês com todos os 11 módulos, IA ilimitada, NDVI por satélite e relatórios em PDF.',
  openGraph: {
    title: 'Planos e Preços — CampoClima',
    description: 'Gestão agrícola com IA a partir de R$ 0. Plano gratuito para sempre, sem cartão de crédito.',
    url: '/precos',
  },
}

export default function PrecosLayout({ children }: { children: React.ReactNode }) {
  return children
}
