import type { Metadata } from 'next'
import Link from 'next/link'
import { CloudRain, Wallet, FlaskConical, Sprout, ArrowRight } from 'lucide-react'
import { ToolHeader } from '@/components/site/ToolCTA'

export const metadata: Metadata = {
  title: 'Ferramentas grátis para o produtor rural',
  description: 'Calculadoras e ferramentas gratuitas para o campo: previsão do tempo agrícola, valor da safra, calagem do solo e população de plantas. Sem cadastro.',
  alternates: { canonical: '/ferramentas' },
  openGraph: { title: 'Ferramentas grátis para o produtor rural', description: 'Previsão do tempo, valor da safra, calagem e população de plantas. Grátis.', url: '/ferramentas' },
}

const TOOLS = [
  { href: '/ferramentas/previsao-do-tempo', icon: CloudRain, title: 'Previsão do tempo agrícola', desc: 'Previsão de 7 dias por município, com janela de pulverização e chuva acumulada.', color: 'text-blue-600 bg-blue-50' },
  { href: '/ferramentas/valor-da-safra', icon: Wallet, title: 'Quanto vale minha safra', desc: 'Valor bruto da produção com a cotação do dia, produtividade e área.', color: 'text-green-700 bg-green-50' },
  { href: '/ferramentas/calagem', icon: FlaskConical, title: 'Calculadora de calagem', desc: 'Quanto de calcário aplicar para corrigir o pH, pela saturação por bases.', color: 'text-amber-600 bg-amber-50' },
  { href: '/ferramentas/populacao-de-plantas', icon: Sprout, title: 'População de plantas', desc: 'Sementes por metro, por hectare e kg/ha, descontando germinação.', color: 'text-emerald-700 bg-emerald-50' },
]

export default function FerramentasPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <ToolHeader />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <h1 className="text-2xl sm:text-4xl font-medium text-stone-900 mb-3">Ferramentas grátis para o campo</h1>
        <p className="text-base text-stone-500 mb-10 leading-relaxed">
          Calculadoras feitas para o produtor rural brasileiro. Use à vontade, sem cadastro — todas com dados oficiais e científicos.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TOOLS.map(t => (
            <Link key={t.href} href={t.href}
              className="group bg-white border border-stone-200 rounded-2xl p-5 hover:shadow-md hover:border-stone-300 transition-all">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${t.color}`}>
                <t.icon className="w-5 h-5" />
              </div>
              <h2 className="text-base font-medium text-stone-900 mb-1 flex items-center gap-1.5">
                {t.title}
                <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-green-600 group-hover:translate-x-0.5 transition-all" />
              </h2>
              <p className="text-sm text-stone-500 leading-relaxed">{t.desc}</p>
            </Link>
          ))}
        </div>

        <div className="mt-10 rounded-2xl bg-green-800 text-white p-6 text-center">
          <p className="text-lg font-medium mb-1.5">Tudo isso junto, automático, para a sua fazenda</p>
          <p className="text-sm text-green-200 mb-4">Clima, satélite, solo, custos e IA acompanhando sua propriedade o ano todo.</p>
          <Link href="/demo" className="inline-flex items-center gap-2 bg-white text-green-900 rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-green-50 transition-colors">
            Ver demonstração ao vivo <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  )
}
