import { NextResponse } from 'next/server'
import { getDemoProfileFromCookie } from '@/lib/demo-profiles'
import { pricesFromApi, revenueEstimate, totalProductionValue, formatBRL, matchCommodity } from '@/lib/finance'

// Builds a concise AI-ready context string from all external APIs
export async function GET(req: Request) {
  const cookieHeader = req.headers.get('cookie') ?? ''
  const profile = getDemoProfileFromCookie(cookieHeader)
  const { lat, lon, state, city } = profile.farm
  const primaryCrop = profile.crops[0]?.name ?? 'soja'

  // Self-fetch usa a origem da própria requisição — funciona em qualquer deploy sem env
  const base = new URL(req.url).origin

  const [fires, climate, soil, ibge, commodities, intel] = await Promise.allSettled([
    fetch(`${base}/api/queimadas?lat=${lat}&lon=${lon}&state=${state}`).then(r => r.json()),
    fetch(`${base}/api/climate-history?lat=${lat}&lon=${lon}`).then(r => r.json()),
    fetch(`${base}/api/soil-grid?lat=${lat}&lon=${lon}`).then(r => r.json()),
    fetch(`${base}/api/ibge-pam?city=${encodeURIComponent(city)}&state=${state}&crop=${encodeURIComponent(primaryCrop)}`).then(r => r.json()),
    fetch(`${base}/api/commodities`).then(r => r.json()),
    fetch(`${base}/api/insights?profile=${profile.id}`).then(r => r.json()),
  ])

  const f = fires.status       === 'fulfilled' ? fires.value       : null
  const c = climate.status     === 'fulfilled' ? climate.value     : null
  const s = soil.status        === 'fulfilled' ? soil.value        : null
  const b = ibge.status        === 'fulfilled' ? ibge.value        : null
  const m = commodities.status === 'fulfilled' ? commodities.value : null
  const ai = intel.status      === 'fulfilled' ? intel.value       : null

  const lines: string[] = ['INTELIGÊNCIA ADICIONAL DA FAZENDA (dados em tempo real):']

  if (f) {
    lines.push(`🔥 Queimadas 7 dias: ${f.totalState7d} focos no ${state}. ${f.nearby50} a ≤50km, ${f.nearby100} a ≤100km. Risco: ${f.risk}${f.nearestKm ? ` (mais próximo: ${f.nearestKm}km)` : ''}.`)
  }
  if (c) {
    const rSign = c.rainDelta >= 0 ? '+' : ''
    const tSign = c.tempDelta >= 0 ? '+' : ''
    lines.push(`🌧 Chuva ${c.monthName}: ${c.current.rain}mm vs ${c.lastYear.rain}mm mesmo período ano passado (${rSign}${c.rainDelta}%). Status: ${c.rainStatus}.`)
    lines.push(`🌡 Temperatura média ${c.monthName}: ${c.current.tempAvg}°C vs ${c.lastYear.tempAvg}°C ano passado (${tSign}${c.tempDelta}°C). Status: ${c.tempStatus}.`)
  }
  if (s) {
    lines.push(`🌍 Solo (SoilGrids 250m): pH ${s.ph} (${s.phStatus}), MO ${s.organicMatter}%, argila ${s.clay}%, textura ${s.texture}.`)
  }
  if (b) {
    lines.push(`📊 Benchmark IBGE (${b.source}): produtividade média de ${primaryCrop} em ${city}: ${b.city?.yieldSc ?? '—'} sc/ha | Estado ${state}: ${b.stateYieldSc} sc/ha.`)
  }

  if (m?.commodities) {
    const prices = pricesFromApi(m)
    const quoted = m.commodities.map((q: { name: string; price: number; unit: string }) => `${q.name} R$${q.price.toFixed(2)} ${q.unit}`).join(' | ')
    lines.push(`💰 Cotações hoje: ${quoted}.`)
    const total = totalProductionValue(profile.crops, prices)
    if (total > 0) {
      const perCrop = profile.crops
        .filter(cr => matchCommodity(cr.name))
        .map(cr => `${cr.name}: ${formatBRL(revenueEstimate(cr, prices) ?? 0)}`)
        .join(' | ')
      lines.push(`💵 Receita projetada da fazenda na cotação atual: ${formatBRL(total)} (${perCrop}). Use esses valores para quantificar recomendações em reais.`)
    }
  }

  // Agricultural Intelligence Layer: health score + insights + doenças + balanço hídrico
  if (ai?.healthScore) {
    lines.push(`🩺 Saúde da fazenda: ${ai.healthScore.total}/100 (${ai.healthScore.level}) — ${ai.healthScore.components.map((cp: { label: string; score: number }) => `${cp.label} ${cp.score}`).join(', ')}.`)
  }
  if (ai?.diseases?.length) {
    const top = ai.diseases.slice(0, 3).map((d: { disease: string; crop: string; level: string; score: number }) =>
      `${d.disease} em ${d.crop}: risco ${d.level} (${d.score}/100)`).join(' | ')
    lines.push(`🦠 Risco fitossanitário: ${top}.`)
  }
  if (ai?.waterBalances?.length) {
    const wb = ai.waterBalances[0]
    lines.push(`💧 Balanço hídrico (${wb.crop}, Kc ${wb.kc}): saldo ${wb.balance}mm (${wb.status}). Chuva prevista 5d: ${wb.forecastRain5d}mm.${wb.irrigationMm > 0 ? ` Irrigação recomendada: ${wb.irrigationMm}mm.` : ''}`)
  }
  if (ai?.rainReport) {
    lines.push(`🌧 Chuva: ontem ${ai.rainReport.yesterday}mm | 7 dias ${ai.rainReport.week}mm | 30 dias ${ai.rainReport.month}mm.`)
  }
  if (ai?.insights?.length) {
    lines.push(`📌 Insights ativos: ${ai.insights.slice(0, 5).map((i: { title: string }) => i.title).join(' | ')}.`)
  }

  const contextString = lines.join('\n')

  // Also build suggested questions for the chat interface
  const suggestions: string[] = []
  if (f && f.nearby50 > 0) suggestions.push(`Há ${f.nearby50} focos de queimada a até 50km. Devo me preocupar com fumaça e estresse nas culturas?`)
  if (c && c.rainStatus === 'seco') suggestions.push(`A chuva de ${c.monthName} está ${Math.abs(c.rainDelta)}% abaixo do ano passado. Como proteger as culturas?`)
  if (s && s.ph < 5.5) suggestions.push(`O solo tem pH ${s.ph} (${s.phStatus}). Qual a dose de calcário para corrigir?`)
  if (c && c.tempStatus === 'quente') suggestions.push(`Temperatura ${c.tempDelta}°C acima do histórico. Quais culturas sofrem mais com esse calor?`)
  if (ai?.diseases?.some((d: { level: string }) => d.level === 'alto' || d.level === 'crítico')) {
    suggestions.unshift('Tenho risco de ferrugem? O que aplicar e quando?')
  }
  suggestions.push('Como está minha safra? Resuma a saúde da fazenda')
  suggestions.push(`Analise todos os alertas da minha fazenda e me dê as 3 ações prioritárias para esta semana`)

  return NextResponse.json({ contextString, suggestions, fires: f, climate: c, soil: s, ibge: b })
}
