import type { Metadata } from 'next'
import Link from 'next/link'
import { Leaf, ArrowRight, Play, ShieldCheck, Clock, Smartphone, Brain, Check } from 'lucide-react'
import { LeadCapture } from '@/components/site/LeadCapture'
import { WhatsAppButton } from '@/components/site/WhatsAppButton'

export const metadata: Metadata = {
  title: 'CampoClima — Inteligência para o campo',
  description: 'Plataforma agro com IA para pequenos e médios produtores rurais. Clima em tempo real, NDVI por satélite, análise de solo e AgroAssistente.',
  openGraph: { url: '/' },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://campoclima.com.br/#org',
      name: 'CampoClima',
      url: 'https://campoclima.com.br',
      logo: 'https://campoclima.com.br/icon.png',
      description: 'Plataforma de gestão agrícola com IA para produtores rurais brasileiros.',
      contactPoint: { '@type': 'ContactPoint', email: 'contato@campoclima.com.br', contactType: 'customer support', availableLanguage: 'Portuguese' },
      sameAs: [],
    },
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://campoclima.com.br/#app',
      name: 'CampoClima',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web, Android, iOS',
      url: 'https://campoclima.com.br',
      offers: [
        { '@type': 'Offer', price: '0', priceCurrency: 'BRL', name: 'Gratuito' },
        { '@type': 'Offer', price: '49', priceCurrency: 'BRL', name: 'Produtor', billingIncrement: 'P1M' },
        { '@type': 'Offer', price: '129', priceCurrency: 'BRL', name: 'Premium', billingIncrement: 'P1M' },
      ],
      description: 'Clima em tempo real, NDVI por satélite, análise de solo e AgroAssistente com IA para pequenos e médios produtores rurais.',
    },
    {
      '@type': 'WebSite',
      '@id': 'https://campoclima.com.br/#website',
      url: 'https://campoclima.com.br',
      name: 'CampoClima',
      publisher: { '@id': 'https://campoclima.com.br/#org' },
      inLanguage: 'pt-BR',
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'Funciona sem internet no campo?', acceptedAnswer: { '@type': 'Answer', text: 'Sim. O CampoClima é um PWA: instale no celular e os últimos dados ficam disponíveis offline. Ao voltar o sinal, tudo sincroniza automaticamente.' } },
        { '@type': 'Question', name: 'Preciso de agrônomo para usar?', acceptedAnswer: { '@type': 'Answer', text: 'Não. O AgroAssistente traduz os dados em recomendações práticas em português simples. Para receituário de defensivos, a plataforma orienta procurar um agrônomo com CREA — a IA complementa, não substitui.' } },
        { '@type': 'Question', name: 'Atende minha região?', acceptedAnswer: { '@type': 'Answer', text: 'Sim. Clima, satélite e solo cobrem todo o Brasil. O benchmark de produtividade usa dados do IBGE do seu município.' } },
        { '@type': 'Question', name: 'De onde vêm os dados?', acceptedAnswer: { '@type': 'Answer', text: 'De fontes oficiais e científicas: IBGE, INPE, NASA, satélite Sentinel-2 (Copernicus/ESA) e Open-Meteo. A IA é o Claude, da Anthropic.' } },
        { '@type': 'Question', name: 'Posso cancelar quando quiser?', acceptedAnswer: { '@type': 'Answer', text: 'Sim. A assinatura é mensal via Mercado Pago, sem fidelidade. Cancelou, continua com acesso até o fim do período pago.' } },
      ],
    },
  ],
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-stone-900 font-sans">
      {/* NAV */}
      <nav className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-stone-100 sticky top-0 bg-white/95 backdrop-blur z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-green-800 rounded-lg flex items-center justify-center flex-shrink-0">
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-900 leading-none">CampoClima</p>
            <p className="text-[10px] text-stone-400 leading-none mt-0.5 hidden sm:block">Inteligência para o campo</p>
          </div>
        </div>
        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="#recursos" className="text-sm text-stone-500 hover:text-stone-800 transition-colors">Recursos</Link>
          <Link href="/ferramentas" className="text-sm text-stone-500 hover:text-stone-800 transition-colors">Ferramentas</Link>
          <Link href="/demo" className="text-sm text-stone-500 hover:text-stone-800 transition-colors">Demo</Link>
          <Link href="/precos" className="text-sm text-stone-500 hover:text-stone-800 transition-colors">Preços</Link>
          <Link href="/login" className="text-sm text-stone-600 border border-stone-200 rounded-lg px-4 py-2 hover:bg-stone-50 transition-colors">Entrar</Link>
          <Link href="/login" className="text-sm bg-green-800 text-white rounded-lg px-4 py-2 hover:bg-green-900 transition-colors flex items-center gap-1.5">
            Começar grátis <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {/* Mobile nav */}
        <div className="flex md:hidden items-center gap-2">
          <Link href="/login" className="text-sm text-stone-600 border border-stone-200 rounded-lg px-3 py-2 hover:bg-stone-50 transition-colors">Entrar</Link>
          <Link href="/login" className="text-sm bg-green-800 text-white rounded-lg px-3 py-2 hover:bg-green-900 transition-colors">Começar grátis</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="px-4 sm:px-8 pt-12 sm:pt-20 pb-0 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-green-50 text-green-800 text-xs font-medium px-3 py-1.5 rounded-full border border-green-200 mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          IA agrícola para o produtor rural brasileiro
        </div>
        <h1 className="text-3xl sm:text-5xl font-medium text-stone-900 leading-[1.12] mb-4 sm:mb-5">
          Sua fazenda mais <span className="text-green-700">inteligente,</span><br />safra após safra
        </h1>
        <p className="text-base sm:text-lg text-stone-500 max-w-xl mx-auto mb-6 sm:mb-8 leading-relaxed px-2">
          Clima, satélite, solo e culturas reunidos em uma plataforma com IA. Alertas antecipados, análises precisas e decisões melhores.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8 px-4 sm:px-0">
          <Link href="/demo" className="inline-flex items-center justify-center gap-2 bg-green-800 text-white rounded-xl px-6 py-3.5 text-sm font-medium hover:bg-green-900 transition-colors">
            <Play className="w-4 h-4" /> Ver demonstração ao vivo
          </Link>
          <Link href="/login" className="inline-flex items-center justify-center gap-2 border border-stone-200 text-stone-700 rounded-xl px-6 py-3.5 text-sm font-medium hover:bg-stone-50 transition-colors">
            <ArrowRight className="w-4 h-4" /> Criar conta grátis
          </Link>
        </div>
        <div className="flex flex-wrap gap-3 sm:gap-6 justify-center text-xs text-stone-400 mb-10 sm:mb-16 px-4">
          {[
            { icon: ShieldCheck, text: 'Sem cartão de crédito' },
            { icon: Clock, text: 'Configuração em 2 minutos' },
            { icon: Smartphone, text: 'Funciona offline (PWA)' },
            { icon: Brain, text: 'IA Claude (Anthropic)' },
          ].map(({ icon: Icon, text }) => (
            <span key={text} className="flex items-center gap-1.5">
              <Icon className="w-3.5 h-3.5 text-green-600" /> {text}
            </span>
          ))}
        </div>
      </section>

      {/* DASHBOARD SCREENSHOT — esconde sidebar no mobile */}
      <section className="px-4 sm:px-8 mb-0">
        <div className="max-w-5xl mx-auto rounded-t-2xl overflow-hidden border border-stone-200 shadow-[0_-4px_40px_rgba(59,109,17,0.08)]">
          <div className="bg-green-950 px-4 py-2.5 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-400 opacity-80" />
            <span className="w-3 h-3 rounded-full bg-yellow-400 opacity-80" />
            <span className="w-3 h-3 rounded-full bg-green-400 opacity-80" />
            <div className="flex-1 bg-white/10 rounded-md py-1 px-3 text-[11px] text-white/50 text-center truncate">
              campoclima.com.br/app — Dashboard · Fazenda São João
            </div>
          </div>
          <div className="bg-stone-50 flex min-h-[260px] sm:min-h-[320px]">
            {/* Sidebar oculta no mobile */}
            <div className="bg-green-950 hidden sm:block w-[180px] flex-shrink-0">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                <div className="w-6 h-6 bg-green-700 rounded-md flex items-center justify-center">
                  <Leaf className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs font-medium text-white">CampoClima</span>
              </div>
              {[['Clima & alertas', true], ['Minhas culturas', false], ['Talhões & mapa', false],
                ['NDVI & satélite', false], ['Pulverização', false], ['Solo IA', false],
                ['Calendário', false], ['Assistente IA', false],
              ].map(([label, active]) => (
                <div key={String(label)} className={`px-4 py-2 text-[11px] flex items-center gap-2 ${active ? 'bg-white/10 text-white font-medium' : 'text-white/50'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${active ? 'bg-green-400' : 'bg-transparent'}`} />
                  {String(label)}
                </div>
              ))}
            </div>
            <div className="p-3 sm:p-4 flex-1 min-w-0">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs sm:text-sm font-medium text-green-950">Visão geral da fazenda</span>
                <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full whitespace-nowrap">3 alertas IA</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                {[
                  { v: '28°C', l: 'Temperatura', tag: 'máx 34°C', c: 'amber' },
                  { v: '12mm', l: 'Chuva 24h', tag: 'acima média', c: 'green' },
                  { v: '0.74', l: 'NDVI médio', tag: 'ótimo', c: 'green' },
                  { v: '87%', l: 'Safra', tag: 'no prazo', c: 'green' },
                ].map(({ v, l, tag, c }) => (
                  <div key={l} className="bg-white rounded-lg border border-stone-100 p-2.5">
                    <p className="text-sm sm:text-base font-medium text-green-900">{v}</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">{l}</p>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full mt-1 inline-block font-medium ${c === 'amber' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>{tag}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                <div className="bg-white rounded-lg border border-stone-100 p-2.5">
                  <p className="text-[10px] font-medium text-green-900 mb-2">Precipitação — 7 dias (mm)</p>
                  <div className="flex items-end gap-1 h-10 sm:h-12">
                    {[25, 65, 40, 90, 55, 30, 70].map((h, i) => (
                      <div key={i} className={`flex-1 rounded-t-sm ${i === 3 ? 'bg-green-700' : 'bg-green-300'}`} style={{ height: `${h}%` }} />
                    ))}
                  </div>
                  <div className="flex justify-between mt-1">
                    {['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map((d,i) => (
                      <span key={d} className={`text-[9px] ${i===3?'text-green-800 font-medium':'text-stone-300'}`}>{d}</span>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-stone-100 p-2.5">
                  <p className="text-[10px] font-medium text-green-900 mb-2">Alertas gerados por IA</p>
                  {[
                    { c: 'bg-red-400', t: 'Risco de geada nas próximas 48h', u: 'Urgente' },
                    { c: 'bg-amber-400', t: 'Janela de pulverização amanhã 6–10h', u: 'Hoje' },
                    { c: 'bg-green-500', t: 'Déficit hídrico no Talhão 2', u: 'Atenção' },
                  ].map(({ c, t, u }) => (
                    <div key={t} className="flex items-center gap-2 py-1.5 border-b border-stone-50 last:border-0">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c}`} />
                      <span className="text-[10px] text-stone-500 flex-1 min-w-0 truncate">{t}</span>
                      <span className="text-[9px] text-stone-300 flex-shrink-0">{u}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {[
                  { d: 'Seg', i: '☀', t: '31°C', r: '0mm' },
                  { d: 'Ter', i: '⛅', t: '27°C', r: '4mm' },
                  { d: 'Qua', i: '🌧', t: '24°C', r: '18mm' },
                  { d: 'Qui', i: '🌧', t: '22°C', r: '32mm' },
                  { d: 'Sex', i: '☀', t: '29°C', r: '0mm' },
                ].map(({ d, i, t, r }) => (
                  <div key={d} className="flex-shrink-0 w-14 bg-white rounded-lg border border-stone-100 p-1.5 text-center">
                    <p className="text-[9px] text-stone-400">{d}</p>
                    <p className="text-xs my-0.5">{i}</p>
                    <p className="text-[10px] font-medium text-stone-700">{t}</p>
                    <p className="text-[9px] text-green-600">{r}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="recursos" className="px-4 sm:px-8 py-16 sm:py-24 bg-stone-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl font-medium text-stone-900 mb-3">Tudo que sua fazenda precisa</h2>
            <p className="text-stone-500 text-sm sm:text-base">11 módulos integrados, movidos por inteligência artificial</p>
          </div>

          {/* Feature 1: Mapa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 items-center mb-14 sm:mb-20">
            <div>
              <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-800 text-xs font-medium px-3 py-1 rounded-full border border-green-200 mb-4">
                Talhões & NDVI
              </span>
              <h3 className="text-xl sm:text-2xl font-medium text-stone-900 mb-3">Veja a saúde de cada talhão pelo satélite</h3>
              <p className="text-stone-500 text-sm leading-relaxed mb-5">Mapa interativo com NDVI colorido por talhão. Clique para ver área, cultura, solo e histórico comparativo safra a safra.</p>
              <ul className="space-y-2.5">
                {['NDVI por talhão com escala de cores automática','Histórico 12 meses vs safra anterior','Detecção automática de anomalias','Tiles OpenStreetMap com cache offline'].map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-stone-500">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
              <div className="bg-green-950 px-3 py-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400/80" /><span className="w-2 h-2 rounded-full bg-yellow-400/80" /><span className="w-2 h-2 rounded-full bg-green-400/80" />
                <span className="text-[10px] text-white/50 ml-1">Talhões — Mapa interativo</span>
              </div>
              <div className="relative h-52 overflow-hidden" style={{background:'#d4e8c2'}}>
                <div className="absolute rounded-md opacity-75" style={{background:'#3b6d11',width:150,height:80,top:20,left:20}} />
                <div className="absolute rounded-md opacity-75" style={{background:'#97c459',width:100,height:65,top:110,left:40}} />
                <div className="absolute rounded-md opacity-70" style={{background:'#ef9f27',width:120,height:72,top:55,left:190}} />
                <div className="absolute bg-white rounded-xl border border-stone-200 p-3 right-3 top-3 w-36 text-[10px]">
                  <p className="font-medium text-green-900 mb-2">Legenda NDVI</p>
                  <div className="h-2 rounded-full mb-1" style={{background:'linear-gradient(to right,#e24b4a,#ef9f27,#97c459,#3b6d11)'}} />
                  <div className="flex justify-between text-stone-400 mb-2"><span>0.0</span><span>0.5</span><span>1.0</span></div>
                  {[{c:'#3b6d11',n:'Talhão 1',v:'0.74'},{c:'#97c459',n:'Talhão 2',v:'0.62'},{c:'#ef9f27',n:'Talhão 3',v:'0.51'}].map(({c,n,v}) => (
                    <div key={n} className="flex items-center gap-1.5 py-1 border-t border-stone-100">
                      <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{background:c}} />
                      <span className="flex-1 text-stone-500">{n}</span>
                      <span className="font-medium text-green-800">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="absolute bg-white rounded-lg border border-stone-200 px-2 py-1 top-5 left-5 text-[10px]">
                  <p className="font-medium text-green-900">Talhão 1 — Soja</p>
                  <p className="text-stone-400">NDVI 0.74 · 120 ha</p>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: Relatório IA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 items-center mb-14 sm:mb-20">
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden sm:order-first">
              <div className="bg-green-950 px-3 py-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400/80" /><span className="w-2 h-2 rounded-full bg-yellow-400/80" /><span className="w-2 h-2 rounded-full bg-green-400/80" />
                <span className="text-[10px] text-white/50 ml-1">Relatório de Safra 2025/26</span>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-medium text-green-900">Faz. São João · Sorriso — MT</span>
                  <span className="text-[10px] bg-green-50 text-green-800 border border-green-200 px-2 py-0.5 rounded-md">Exportar PDF</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[{v:'62 sc/ha',l:'Produtividade'},{v:'R$ 487k',l:'Receita est.'},{v:'98 dias',l:'Ciclo safra'}].map(({v,l}) => (
                    <div key={l} className="bg-green-50 rounded-lg p-2 text-center">
                      <p className="text-sm font-medium text-green-900">{v}</p>
                      <p className="text-[9px] text-stone-400 mt-0.5">{l}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-green-800 text-white text-[9px] font-medium px-2 py-0.5 rounded">IA Análise</span>
                    <span className="text-[10px] text-stone-400">gerado em 3s · Claude Sonnet</span>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-relaxed">A safra 2025/26 apresentou <strong className="text-green-800">desempenho acima da média regional</strong>. Precipitação acumulada de 1.240mm dentro do ideal para soja.</p>
                  <div className="mt-2 space-y-1">
                    {['Antecipar plantio do Talhão 3 em 7–10 dias','Aplicar calcário no Talhão 2 — pH 5.4'].map(r => (
                      <div key={r} className="flex items-start gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-600 mt-1 flex-shrink-0" />
                        <p className="text-[10px] text-stone-500">{r}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-800 text-xs font-medium px-3 py-1 rounded-full border border-green-200 mb-4">
                Relatórios com IA
              </span>
              <h3 className="text-xl sm:text-2xl font-medium text-stone-900 mb-3">Laudo de safra gerado pela IA em segundos</h3>
              <p className="text-stone-500 text-sm leading-relaxed mb-5">A IA analisa clima, produtividade, aplicações e solo para gerar um relatório executivo completo — exportável em PDF.</p>
              <ul className="space-y-2.5">
                {['Resumo executivo com insights automáticos','KPIs de produtividade por talhão','Histórico de pulverizações e irrigação','Exportação em PDF profissional'].map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-stone-500">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Feature 3: Chat IA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-800 text-xs font-medium px-3 py-1 rounded-full border border-green-200 mb-4">
                AgroAssistente IA
              </span>
              <h3 className="text-xl sm:text-2xl font-medium text-stone-900 mb-3">Um agrônomo virtual que conhece sua fazenda</h3>
              <p className="text-stone-500 text-sm leading-relaxed mb-5">Converse em linguagem natural com uma IA que tem contexto completo — clima atual, solo, culturas e histórico.</p>
              <ul className="space-y-2.5">
                {['Contexto completo da sua propriedade','Recomendações baseadas em dados reais','Disponível 24h, direto do celular','Powered by Claude (Anthropic)'].map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-stone-500">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
              <div className="bg-green-950 px-3 py-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400/80" /><span className="w-2 h-2 rounded-full bg-yellow-400/80" /><span className="w-2 h-2 rounded-full bg-green-400/80" />
                <span className="text-[10px] text-white/50 ml-1">AgroAssistente IA</span>
              </div>
              <div className="p-4 space-y-3 bg-stone-50 min-h-48">
                <div className="flex justify-end"><div className="bg-green-100 text-green-900 text-xs rounded-2xl rounded-tr-sm px-3 py-2 max-w-[80%]">Posso pulverizar amanhã cedo no Talhão 1?</div></div>
                <div className="flex justify-start"><div className="bg-white border border-stone-200 text-stone-600 text-xs rounded-2xl rounded-tl-sm px-3 py-2 max-w-[88%] leading-relaxed"><strong className="text-green-800">Sim, amanhã é uma boa janela.</strong> Vento 8 km/h, umidade 72% às 6h. Recomendo aplicar entre <strong className="text-green-800">6h e 9h30</strong>.</div></div>
                <div className="flex justify-end"><div className="bg-green-100 text-green-900 text-xs rounded-2xl rounded-tr-sm px-3 py-2 max-w-[80%]">Como identifico ferrugem asiática na soja?</div></div>
                <div className="flex justify-start"><div className="bg-white border border-stone-200 text-stone-600 text-xs rounded-2xl rounded-tl-sm px-3 py-2 max-w-[88%] leading-relaxed">Procure <strong className="text-green-800">lesões cinza-castanhas</strong> na face inferior das folhas baixeiras. Envie uma foto que eu analiso — e indico o <strong className="text-green-800">manejo com fungicida</strong> junto ao seu agrônomo...</div></div>
                <div className="bg-white border border-stone-200 rounded-xl px-3 py-2.5 flex items-center gap-2">
                  <span className="text-xs text-stone-300 flex-1">Pergunte ao seu agrônomo IA...</span>
                  <div className="w-6 h-6 bg-green-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ArrowRight className="w-3 h-3 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DADOS OFICIAIS — prova de credibilidade */}
      <section className="px-4 sm:px-8 py-12 border-y border-stone-100 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs uppercase tracking-widest text-stone-400 font-medium mb-6">
            Construído sobre dados oficiais e científicos
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {[
              { name: 'IBGE', desc: 'produtividade municipal' },
              { name: 'INPE', desc: 'monitoramento de queimadas' },
              { name: 'NASA POWER', desc: 'climatologia 30 anos' },
              { name: 'Sentinel-2', desc: 'satélite Copernicus/ESA' },
              { name: 'Open-Meteo', desc: 'previsão meteorológica' },
              { name: 'Claude IA', desc: 'Anthropic' },
            ].map(({ name, desc }) => (
              <div key={name} className="text-center">
                <p className="text-sm font-semibold text-stone-600">{name}</p>
                <p className="text-[10px] text-stone-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="px-4 sm:px-8 py-14 sm:py-20 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-medium text-stone-900 mb-2">Produtores que já usam o CampoClima</h2>
            <p className="text-stone-400 text-sm">Do pequeno ao grande produtor, do MT ao Sul do país</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                quote: 'Antes eu ficava preocupado com geada sem saber ao certo quando vinha. Agora o CampoClima me avisa com 48h de antecedência e eu já me preparo.',
                name: 'Marcos Ferreira',
                role: 'Produtor de soja · Sorriso, MT',
                ndvi: '840 ha',
              },
              {
                quote: 'O AgroAssistente me ajudou a identificar ferrugem no talhão 3 antes de virar problema. Economizei duas aplicações desnecessárias de fungicida.',
                name: 'Ana Paula Souza',
                role: 'Cafeicultora · Patrocínio, MG',
                ndvi: '120 ha',
              },
              {
                quote: 'Minha cooperativa indicou o CampoClima. Em duas safras, reduzi o custo de irrigação em 18% usando as recomendações de balanço hídrico.',
                name: 'Roberto Linhares',
                role: 'Irrigação · Campo Verde, MT',
                ndvi: '380 ha',
              },
            ].map(({ quote, name, role, ndvi }) => (
              <div key={name} className="bg-stone-50 rounded-2xl p-5 border border-stone-100 flex flex-col">
                <p className="text-sm text-stone-600 leading-relaxed flex-1 mb-4">"{quote}"</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-stone-800">{name}</p>
                    <p className="text-xs text-stone-400 mt-0.5">{role}</p>
                  </div>
                  <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full font-medium">{ndvi}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PREÇOS RESUMIDOS */}
      <section className="px-4 sm:px-8 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-medium text-stone-900 mb-3">Preço de lavoura, não de multinacional</h2>
            <p className="text-stone-500 text-sm sm:text-base">Comece grátis. Evolua quando fizer sentido para a sua operação.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { name: 'Gratuito', price: 'R$ 0', period: 'para sempre', desc: '1 fazenda · clima 10 dias · 5 consultas IA/mês', featured: false },
              { name: 'Produtor', price: 'R$ 49', period: '/mês', desc: 'Todos os 11 módulos · IA ilimitada · NDVI · relatórios PDF', featured: true },
              { name: 'Premium', price: 'R$ 129', period: '/mês', desc: 'Multi-usuário · API · suporte prioritário no WhatsApp', featured: false },
            ].map(p => (
              <Link key={p.name} href="/precos"
                className={`rounded-2xl border p-6 text-center transition-all hover:shadow-md ${
                  p.featured ? 'border-green-700 bg-green-800 text-white shadow-lg shadow-green-900/10 scale-[1.02]' : 'border-stone-200 bg-white'
                }`}>
                <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${p.featured ? 'text-green-300' : 'text-stone-400'}`}>{p.name}</p>
                <p className={`text-3xl font-semibold mb-0.5 ${p.featured ? 'text-white' : 'text-stone-900'}`}>
                  {p.price}<span className={`text-sm font-normal ${p.featured ? 'text-green-300' : 'text-stone-400'}`}>{p.period}</span>
                </p>
                <p className={`text-xs leading-relaxed mt-3 ${p.featured ? 'text-green-200' : 'text-stone-500'}`}>{p.desc}</p>
                <span className={`inline-block text-xs font-medium mt-4 ${p.featured ? 'text-white underline' : 'text-green-700'}`}>
                  Ver detalhes →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 sm:px-8 py-16 bg-stone-50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-medium text-stone-900 text-center mb-8">Perguntas frequentes</h2>
          <div className="space-y-3">
            {[
              { q: 'Funciona sem internet no campo?', a: 'Sim. O CampoClima é um PWA: instale no celular e os últimos dados ficam disponíveis offline. Ao voltar o sinal, tudo sincroniza automaticamente.' },
              { q: 'Preciso de agrônomo para usar?', a: 'Não. O AgroAssistente traduz os dados em recomendações práticas em português simples. Para receituário de defensivos, a plataforma orienta procurar um agrônomo com CREA — a IA complementa, não substitui.' },
              { q: 'Atende minha região?', a: 'Sim. Clima, satélite e solo cobrem todo o Brasil. O benchmark de produtividade usa dados do IBGE do seu município.' },
              { q: 'De onde vêm os dados?', a: 'De fontes oficiais e científicas: IBGE, INPE, NASA, satélite Sentinel-2 (Copernicus/ESA) e Open-Meteo. A IA é o Claude, da Anthropic.' },
              { q: 'Posso cancelar quando quiser?', a: 'Sim. A assinatura é mensal via Mercado Pago, sem fidelidade. Cancelou, continua com acesso até o fim do período pago.' },
            ].map(({ q, a }) => (
              <details key={q} className="group bg-white border border-stone-200 rounded-xl px-5 py-4">
                <summary className="text-sm font-medium text-stone-800 cursor-pointer list-none flex items-center justify-between">
                  {q}
                  <span className="text-stone-300 group-open:rotate-45 transition-transform text-lg leading-none">+</span>
                </summary>
                <p className="text-sm text-stone-500 leading-relaxed mt-3">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CAPTURA DE LEADS */}
      <section className="px-4 sm:px-8 py-16 bg-white border-t border-stone-100">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl sm:text-2xl font-medium text-stone-900 mb-2">Ainda não está pronto para criar conta?</h2>
          <p className="text-sm text-stone-500 mb-6">
            Deixe seu contato e receba novidades e dicas de clima para a sua região. Sem spam.
          </p>
          <LeadCapture />
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-green-950 py-16 sm:py-24 px-4 sm:px-8 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-medium text-white mb-4">Comece hoje.<br />Sua próxima safra agradece.</h2>
          <p className="text-green-300 mb-8 leading-relaxed text-sm sm:text-base">Cadastre sua fazenda gratuitamente e veja a diferença de tomar decisões com dados reais e IA.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login" className="inline-flex items-center justify-center gap-2 bg-green-400 text-green-950 font-medium rounded-xl px-7 py-3.5 text-sm hover:bg-green-300 transition-colors">
              <ArrowRight className="w-4 h-4" /> Criar minha conta grátis
            </Link>
            <Link href="/precos" className="inline-flex items-center justify-center gap-2 border border-white/20 text-white rounded-xl px-7 py-3.5 text-sm hover:bg-white/10 transition-colors">
              Ver planos e preços
            </Link>
          </div>
          <p className="text-green-500 text-xs mt-4">Sem cartão de crédito · Cancele quando quiser</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-stone-100 px-4 sm:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-green-800 rounded-md flex items-center justify-center">
            <Leaf className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm font-medium text-stone-700">CampoClima</span>
        </div>
        <p className="text-xs text-stone-400 text-center">© 2026 CampoClima · Inteligência para o campo brasileiro</p>
        <div className="flex gap-5">
          <Link href="/privacidade" className="text-xs text-stone-400 hover:text-stone-600">Privacidade</Link>
          <Link href="/termos" className="text-xs text-stone-400 hover:text-stone-600">Termos</Link>
          <a href="mailto:contato@campoclima.com.br" className="text-xs text-stone-400 hover:text-stone-600">Contato</a>
        </div>
      </footer>

      <WhatsAppButton />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  )
}
