import type { Metadata } from 'next'
import Link from 'next/link'
import { Leaf, ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Política de Privacidade — CampoClima',
  description: 'Como o CampoClima coleta, usa e protege seus dados.',
}

export default function PrivacidadePage() {
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
          <h1 className="text-xl font-semibold text-stone-900">Política de Privacidade</h1>
        </div>
        <p className="text-xs text-stone-400 mb-8">Última atualização: junho de 2026</p>

        <div className="space-y-6 text-sm text-stone-600 leading-relaxed">
          <section>
            <h2 className="text-base font-medium text-stone-900 mb-2">1. Dados que coletamos</h2>
            <p>Coletamos os dados que você fornece ao criar sua conta (nome, e-mail) e os dados operacionais da sua propriedade que você cadastra na plataforma (localização da fazenda, culturas, talhões, análises de solo). Dados de pagamento são processados diretamente pelo Mercado Pago — não armazenamos números de cartão.</p>
          </section>
          <section>
            <h2 className="text-base font-medium text-stone-900 mb-2">2. Como usamos seus dados</h2>
            <p>Seus dados são usados exclusivamente para operar a plataforma: gerar previsões climáticas para suas coordenadas, produzir alertas e análises com inteligência artificial e personalizar as recomendações do AgroAssistente. Não vendemos nem compartilhamos seus dados com terceiros para fins de marketing.</p>
          </section>
          <section>
            <h2 className="text-base font-medium text-stone-900 mb-2">3. Inteligência artificial</h2>
            <p>As análises com IA são processadas pela Anthropic (Claude) sob contrato que proíbe o uso dos seus dados para treinamento de modelos. Fotos de lavoura enviadas para diagnóstico são processadas e não ficam armazenadas em servidores de terceiros.</p>
          </section>
          <section>
            <h2 className="text-base font-medium text-stone-900 mb-2">4. Armazenamento e segurança</h2>
            <p>Os dados são armazenados em infraestrutura do Supabase e da Vercel com criptografia em trânsito e em repouso. O acesso é restrito à sua conta autenticada.</p>
          </section>
          <section>
            <h2 className="text-base font-medium text-stone-900 mb-2">5. Seus direitos (LGPD)</h2>
            <p>Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você pode solicitar a qualquer momento o acesso, a correção, a portabilidade ou a exclusão definitiva dos seus dados. Basta enviar um e-mail para <a href="mailto:contato@campoclima.com.br" className="text-green-700 underline">contato@campoclima.com.br</a>.</p>
          </section>
          <section>
            <h2 className="text-base font-medium text-stone-900 mb-2">6. Cookies</h2>
            <p>Usamos apenas cookies essenciais para autenticação e funcionamento da plataforma. Não utilizamos cookies de rastreamento de terceiros.</p>
          </section>
          <section>
            <h2 className="text-base font-medium text-stone-900 mb-2">7. Contato</h2>
            <p>Dúvidas sobre esta política: <a href="mailto:contato@campoclima.com.br" className="text-green-700 underline">contato@campoclima.com.br</a>.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
