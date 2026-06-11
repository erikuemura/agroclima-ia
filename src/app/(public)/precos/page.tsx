'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Leaf, Check, ArrowRight, Zap, Building2, X } from 'lucide-react'

const PLANS = [
  {
    id: 'gratuito',
    name: 'Gratuito',
    price: 0,
    priceAnnual: 0,
    mpPriceId: null,
    description: 'Para conhecer a plataforma',
    color: 'stone',
    features: [
      '1 fazenda · até 3 talhões',
      'Clima e previsão 10 dias',
      '5 consultas IA por mês',
      'Dashboard e alertas básicos',
      'NDVI básico',
    ],
    missing: [
      'Relatórios com IA',
      'Exportação PDF',
      'AgroAssistente ilimitado',
      'Análise de solo IA',
    ],
    cta: 'Criar conta grátis',
    href: '/login',
  },
  {
    id: 'produtor',
    name: 'Produtor',
    price: 49,
    priceAnnual: 39,
    mpPriceId: process.env.NEXT_PUBLIC_MP_PRICE_PRODUTOR ?? 'price_produtor',
    description: 'Para o produtor que quer o máximo',
    color: 'green',
    featured: true,
    features: [
      'Fazendas e talhões ilimitados',
      'Todos os 11 módulos completos',
      'IA ilimitada — alertas, chat e laudos',
      'NDVI histórico 12 meses',
      'Análise de solo com laudo IA',
      'Exportação PDF de relatórios',
      'Calendário agrícola com IA',
      'Pulverização e irrigação inteligente',
      'Suporte por e-mail',
    ],
    missing: [],
    cta: 'Assinar agora',
    href: null,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 129,
    priceAnnual: 99,
    mpPriceId: process.env.NEXT_PUBLIC_MP_PRICE_PREMIUM ?? 'price_premium',
    description: 'Para operações maiores e cooperativas',
    color: 'stone',
    features: [
      'Tudo do plano Produtor',
      'Multi-usuário (até 5 logins)',
      'API de integração',
      'Relatórios customizados',
      'Suporte prioritário via WhatsApp',
      'Onboarding assistido',
      'SLA 99.9% uptime',
    ],
    missing: [],
    cta: 'Assinar Premium',
    href: null,
  },
]

const FAQ = [
  { q: 'Posso cancelar a qualquer momento?', a: 'Sim. Sem fidelidade, sem multa. Cancele pela plataforma e o acesso premium permanece até o fim do período pago.' },
  { q: 'Como funciona a cobrança?', a: 'A cobrança é mensal ou anual (com desconto) via cartão de crédito, boleto ou Pix — processado pelo Mercado Pago.' },
  { q: 'O plano gratuito tem limite de tempo?', a: 'Não. O plano gratuito é para sempre, com os recursos listados. Não precisa de cartão de crédito para se cadastrar.' },
  { q: 'Quantos produtores rurais já usam?', a: 'CampoClima está em beta. Seja um dos primeiros — e ajude a moldar a plataforma ideal para o campo brasileiro.' },
  { q: 'A IA realmente conhece minha fazenda?', a: 'Sim. O AgroAssistente recebe contexto completo: localização, culturas, solo, histórico de clima e alertas ativos. As respostas são personalizadas para sua propriedade.' },
]

export default function PrecosPage() {
  const [annual, setAnnual] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  function handleCheckout(planId: string) {
    window.location.href = `/assinar?plano=${planId}&anual=${annual ? '1' : '0'}`
  }

  return (
    <div className="min-h-screen bg-white text-stone-900">
      {/* NAV */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-stone-100">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-green-800 rounded-lg flex items-center justify-center">
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-stone-900">CampoClima</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm text-stone-500 hover:text-stone-800">Voltar ao site</Link>
          <Link href="/login" className="text-sm bg-green-800 text-white rounded-lg px-4 py-2 hover:bg-green-900 transition-colors">
            Criar conta grátis
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="py-16 px-8 text-center">
        <h1 className="text-4xl font-medium text-stone-900 mb-3">Planos simples e transparentes</h1>
        <p className="text-stone-500 mb-8 max-w-md mx-auto">Comece grátis e escale conforme sua fazenda cresce. Sem surpresas na fatura.</p>

        {/* Toggle anual/mensal */}
        <div className="inline-flex items-center gap-3 bg-stone-100 p-1 rounded-xl mb-12">
          <button
            onClick={() => setAnnual(false)}
            className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${!annual ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'}`}
          >
            Mensal
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${annual ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'}`}
          >
            Anual
            <span className="text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full font-medium">-20%</span>
          </button>
        </div>

        {/* CARDS */}
        <div className="grid grid-cols-3 gap-5 max-w-4xl mx-auto">
          {PLANS.map((plan) => {
            const price = annual ? plan.priceAnnual : plan.price
            const isFeatured = plan.featured
            return (
              <div
                key={plan.id}
                className={`rounded-2xl p-6 text-left flex flex-col ${
                  isFeatured
                    ? 'border-2 border-green-600 bg-green-50'
                    : 'border border-stone-200 bg-white'
                }`}
              >
                {isFeatured && (
                  <div className="bg-green-700 text-white text-xs font-medium px-3 py-1 rounded-full self-start mb-3">
                    Mais popular
                  </div>
                )}
                <div className="flex items-center gap-2 mb-1">
                  {isFeatured ? <Zap className="w-4 h-4 text-green-700" /> : <Leaf className="w-4 h-4 text-stone-400" />}
                  <h3 className={`text-base font-medium ${isFeatured ? 'text-green-900' : 'text-stone-800'}`}>{plan.name}</h3>
                </div>
                <p className="text-xs text-stone-400 mb-4">{plan.description}</p>

                <div className="mb-1">
                  {price === 0 ? (
                    <span className="text-3xl font-medium text-stone-900">Grátis</span>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm text-stone-400">R$</span>
                      <span className="text-3xl font-medium text-stone-900">{price}</span>
                      <span className="text-sm text-stone-400">/mês</span>
                    </div>
                  )}
                </div>
                {annual && price > 0 && (
                  <p className="text-xs text-green-700 mb-4">Cobrado R$ {price * 12}/ano · economize R$ {(plan.price - price) * 12}/ano</p>
                )}
                {(!annual || price === 0) && <div className="mb-4" />}

                <div className="border-t border-stone-200 my-4" />

                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-stone-600">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                  {plan.missing.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-stone-300">
                      <X className="w-4 h-4 flex-shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>

                {plan.href ? (
                  <Link
                    href={plan.href}
                    className="w-full text-center py-3 rounded-xl text-sm font-medium border border-stone-200 text-stone-700 hover:bg-stone-50 transition-colors"
                  >
                    {plan.cta}
                  </Link>
                ) : (
                  <button
                    onClick={() => handleCheckout(plan.id)}
                    disabled={loading === plan.id}
                    className={`w-full py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      isFeatured
                        ? 'bg-green-700 text-white hover:bg-green-800 disabled:opacity-60'
                        : 'bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-60'
                    }`}
                  >
                    {loading === plan.id ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                    {loading === plan.id ? 'Redirecionando...' : plan.cta}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* ENTERPRISE */}
        <div className="max-w-4xl mx-auto mt-5 border border-stone-200 rounded-2xl p-5 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-stone-200 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-stone-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-stone-800">Cooperativa ou grupo de fazendas?</p>
              <p className="text-xs text-stone-400">Planos customizados com multi-usuário, API, SLA e suporte dedicado.</p>
            </div>
          </div>
          <Link href="mailto:contato@campoclima.com.br" className="text-sm border border-stone-300 rounded-lg px-4 py-2 text-stone-700 hover:bg-white transition-colors flex items-center gap-1.5">
            Falar com vendas <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* COMPARATIVO */}
      <section className="py-16 px-8 bg-stone-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-medium text-stone-900 text-center mb-8">Comparativo completo</h2>
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className="text-left px-5 py-3.5 text-stone-500 font-medium w-1/2">Recurso</th>
                  <th className="text-center px-5 py-3.5 text-stone-500 font-medium">Gratuito</th>
                  <th className="text-center px-5 py-3.5 text-green-800 font-medium bg-green-50">Produtor</th>
                  <th className="text-center px-5 py-3.5 text-stone-500 font-medium">Premium</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Dashboard com clima em tempo real', true, true, true],
                  ['Previsão 10 dias (Open-Meteo)', true, true, true],
                  ['Alertas automáticos por IA', '5/mês', 'Ilimitado', 'Ilimitado'],
                  ['Talhões & mapa interativo', '3', 'Ilimitado', 'Ilimitado'],
                  ['NDVI & satélite', 'Básico', 'Histórico 12 meses', 'Histórico completo'],
                  ['Análise de solo com laudo IA', false, true, true],
                  ['AgroAssistente (chat IA)', '5/mês', 'Ilimitado', 'Ilimitado'],
                  ['Calendário agrícola com IA', false, true, true],
                  ['Pulverização inteligente', false, true, true],
                  ['Irrigação — balanço hídrico', false, true, true],
                  ['Relatório de safra com IA', false, true, true],
                  ['Exportação PDF', false, true, true],
                  ['Multi-usuário', false, false, 'Até 5'],
                  ['API de integração', false, false, true],
                  ['Suporte', 'Comunidade', 'E-mail', 'WhatsApp prioritário'],
                ].map(([feature, free, prod, prem], i) => (
                  <tr key={i} className={`border-b border-stone-50 ${i % 2 === 0 ? '' : 'bg-stone-50/50'}`}>
                    <td className="px-5 py-3 text-stone-700">{String(feature)}</td>
                    <td className="px-5 py-3 text-center">
                      {free === true ? <Check className="w-4 h-4 text-green-600 mx-auto" /> : free === false ? <X className="w-4 h-4 text-stone-200 mx-auto" /> : <span className="text-xs text-stone-500">{String(free)}</span>}
                    </td>
                    <td className="px-5 py-3 text-center bg-green-50/50">
                      {prod === true ? <Check className="w-4 h-4 text-green-600 mx-auto" /> : prod === false ? <X className="w-4 h-4 text-stone-200 mx-auto" /> : <span className="text-xs text-green-800 font-medium">{String(prod)}</span>}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {prem === true ? <Check className="w-4 h-4 text-green-600 mx-auto" /> : prem === false ? <X className="w-4 h-4 text-stone-200 mx-auto" /> : <span className="text-xs text-stone-500">{String(prem)}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-8">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-medium text-stone-900 text-center mb-8">Perguntas frequentes</h2>
          <div className="space-y-3">
            {FAQ.map(({ q, a }, i) => (
              <div key={i} className="border border-stone-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between text-sm font-medium text-stone-800 hover:bg-stone-50 transition-colors"
                >
                  {q}
                  <span className={`text-stone-400 transition-transform ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-stone-500 leading-relaxed border-t border-stone-100 pt-3">
                    {a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-green-950 py-16 px-8 text-center">
        <h2 className="text-3xl font-medium text-white mb-3">Comece grátis hoje mesmo</h2>
        <p className="text-green-300 mb-6 text-sm">Sem cartão de crédito. Configure sua fazenda em 2 minutos.</p>
        <Link href="/login" className="inline-flex items-center gap-2 bg-green-400 text-green-950 font-medium rounded-xl px-6 py-3 text-sm hover:bg-green-300 transition-colors">
          <ArrowRight className="w-4 h-4" /> Criar minha conta grátis
        </Link>
      </section>

      <footer className="border-t border-stone-100 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-green-800 rounded-md flex items-center justify-center"><Leaf className="w-3 h-3 text-white" /></div>
          <span className="text-sm font-medium text-stone-700">CampoClima</span>
        </div>
        <p className="text-xs text-stone-400">© 2026 CampoClima</p>
        <div className="flex gap-5">
          {['Privacidade', 'Termos', 'Contato'].map(l => (
            <Link key={l} href="#" className="text-xs text-stone-400 hover:text-stone-600">{l}</Link>
          ))}
        </div>
      </footer>
    </div>
  )
}
