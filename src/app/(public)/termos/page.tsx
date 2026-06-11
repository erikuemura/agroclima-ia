import type { Metadata } from 'next'
import Link from 'next/link'
import { Leaf, ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Termos de Uso — CampoClima',
  description: 'Termos e condições de uso da plataforma CampoClima.',
}

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-800 mb-8">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 bg-green-800 rounded-lg flex items-center justify-center">
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-stone-900">Termos de Uso</h1>
        </div>
        <p className="text-xs text-stone-400 mb-8">Última atualização: junho de 2026</p>

        <div className="space-y-6 text-sm text-stone-600 leading-relaxed">
          <section>
            <h2 className="text-base font-medium text-stone-900 mb-2">1. O serviço</h2>
            <p>O CampoClima é uma plataforma de apoio à decisão agrícola que reúne dados climáticos, de satélite e de solo, processados com inteligência artificial. O serviço é fornecido &quot;como está&quot;, mediante assinatura mensal ou anual.</p>
          </section>
          <section>
            <h2 className="text-base font-medium text-stone-900 mb-2">2. Natureza das recomendações</h2>
            <p><strong className="text-stone-800">As análises e sugestões geradas pela plataforma têm caráter informativo e não substituem o receituário agronômico.</strong> A prescrição de defensivos agrícolas é ato privativo de engenheiro agrônomo com registro no CREA, conforme a legislação brasileira. Decisões de manejo, aplicação de produtos e investimentos são de responsabilidade exclusiva do produtor.</p>
          </section>
          <section>
            <h2 className="text-base font-medium text-stone-900 mb-2">3. Dados de terceiros</h2>
            <p>A plataforma integra dados públicos (Open-Meteo, NASA POWER, INPE, IBGE, SoilGrids) sujeitos a indisponibilidades e imprecisões das fontes originais. Previsões climáticas são estimativas e não garantem a ocorrência dos eventos previstos.</p>
          </section>
          <section>
            <h2 className="text-base font-medium text-stone-900 mb-2">4. Conta e assinatura</h2>
            <p>Você é responsável pela confidencialidade das suas credenciais. A assinatura é cobrada de forma recorrente via Mercado Pago e pode ser cancelada a qualquer momento, permanecendo ativa até o fim do período já pago.</p>
          </section>
          <section>
            <h2 className="text-base font-medium text-stone-900 mb-2">5. Limitação de responsabilidade</h2>
            <p>O CampoClima não se responsabiliza por perdas de safra, danos materiais ou lucros cessantes decorrentes de decisões tomadas com base nas informações da plataforma, nem por indisponibilidades temporárias do serviço.</p>
          </section>
          <section>
            <h2 className="text-base font-medium text-stone-900 mb-2">6. Alterações</h2>
            <p>Estes termos podem ser atualizados; mudanças relevantes serão comunicadas por e-mail. Dúvidas: <a href="mailto:contato@campoclima.com.br" className="text-green-700 underline">contato@campoclima.com.br</a>.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
