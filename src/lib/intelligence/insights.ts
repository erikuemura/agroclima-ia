import type { Insight, WeatherCurrent, WeatherDay, Crop } from '@/types'
import type { DiseaseRisk } from './disease'
import type { WaterBalance } from './water-balance'
import { lossFromWaterDeficit, matchCommodity, formatBRL, type CommodityPrices } from '@/lib/finance'

// ─────────────────────────────────────────────────────────────
// Motor de insights server-side: transforma clima + doenças +
// balanço hídrico + mercado em recomendações priorizadas.
// Consumidores: Home, AgroAssistente, notificações.
// ─────────────────────────────────────────────────────────────

export function stormInsights(days: WeatherDay[]): Insight[] {
  const out: Insight[] = []
  days.slice(0, 5).forEach((d, i) => {
    const when = i === 0 ? 'hoje' : i === 1 ? 'amanhã' : d.label
    if (d.icon === 'storm') {
      out.push({
        id: `storm-${d.date}`, category: 'clima', priority: 1, severity: 'danger',
        title: `Tempestade prevista ${when} — risco de raios e granizo`,
        recommendation: `Recolha equipe e máquinas do campo antes do evento. Chuva prevista de ${d.rain}mm com vento de até ${d.windMax}km/h.`,
        source: 'Alerta de tempestade (Open-Meteo)',
      })
    } else if (d.windMax >= 50) {
      out.push({
        id: `wind-${d.date}`, category: 'clima', priority: 1, severity: 'danger',
        title: `Vento forte ${when}: rajadas de ${d.windMax}km/h`,
        recommendation: 'Risco de acamamento em culturas altas e deriva total — não pulverize neste dia.',
        source: 'Alerta de vento (Open-Meteo)',
      })
    } else if (d.rain >= 40) {
      out.push({
        id: `heavyrain-${d.date}`, category: 'clima', priority: 2, severity: 'warning',
        title: `Chuva intensa ${when}: ${d.rain}mm previstos`,
        recommendation: 'Risco de erosão e encharcamento. Adie operações de solo e verifique terraços e drenagem.',
        source: 'Alerta de chuva intensa (Open-Meteo)',
      })
    }
  })
  return out
}

export function diseaseInsights(risks: DiseaseRisk[]): Insight[] {
  return risks
    .filter(r => r.level === 'alto' || r.level === 'crítico')
    .map(r => ({
      id: `disease-${r.diseaseId}-${r.crop}`,
      category: 'doenças' as const,
      priority: (r.level === 'crítico' ? 1 : 2) as 1 | 2,
      severity: (r.level === 'crítico' ? 'danger' : 'warning') as 'danger' | 'warning',
      title: `Risco ${r.level} de ${r.disease} — ${r.crop}`,
      recommendation: r.recommendation,
      action: { label: 'Ver janela de aplicação', href: '/pulverizacao' },
      source: `Modelo de risco (${r.factors[0] ?? 'clima favorável'})`,
    }))
}

export function waterInsights(balances: WaterBalance[], crops: Crop[], prices: CommodityPrices | null, eto7d: number): Insight[] {
  const out: Insight[] = []
  for (const wb of balances) {
    const crop = crops.find(c => c.name === wb.crop)
    if (!crop) continue
    if (wb.status === 'déficit crítico' || wb.status === 'déficit') {
      const commodity = matchCommodity(crop.name)
      const loss = prices && commodity
        ? lossFromWaterDeficit(-wb.balance, wb.etc7d || eto7d, crop, prices[commodity] ?? 0)
        : null
      out.push({
        id: `water-${crop.id}`,
        category: 'hídrico',
        priority: wb.status === 'déficit crítico' ? 1 : 2,
        severity: wb.status === 'déficit crítico' ? 'danger' : 'warning',
        title: `Déficit hídrico de ${Math.abs(wb.balance)}mm — ${crop.name}`,
        recommendation: wb.irrigationMm > 0
          ? `Irrigar ${wb.irrigationMm}mm. Chuva prevista (${wb.forecastRain5d}mm em 5 dias) não cobre a demanda da fase (Kc ${wb.kc}).`
          : `Chuva prevista de ${wb.forecastRain5d}mm deve aliviar — reavalie em 48h.`,
        impactBRL: loss?.lossBRL,
        action: { label: 'Plano de irrigação', href: '/irrigacao' },
        source: 'Balanço hídrico FAO-56',
      })
    } else if (wb.status === 'excedente' && wb.balance > 40) {
      out.push({
        id: `water-excess-${crop.id}`,
        category: 'hídrico', priority: 3, severity: 'info',
        title: `Excedente hídrico de ${wb.balance}mm — ${crop.name}`,
        recommendation: 'Solo saturado favorece doenças de raiz. Suspenda irrigação e monitore drenagem.',
        source: 'Balanço hídrico FAO-56',
      })
    }
  }
  return out
}

export function sprayWindowInsight(current: WeatherCurrent, days: WeatherDay[]): Insight | null {
  const ok = current.windSpeed >= 3 && current.windSpeed <= 15 && current.humidity >= 55 && (days[0]?.rain ?? 0) < 2
  if (!ok) return null
  return {
    id: 'spray-window',
    category: 'operações', priority: 2, severity: 'success',
    title: 'Janela ideal de pulverização aberta',
    recommendation: `Vento ${current.windSpeed}km/h, umidade ${current.humidity}% e sem chuva nas próximas horas. Priorize aplicações pendentes.`,
    action: { label: 'Planejar aplicação', href: '/pulverizacao' },
    source: 'Condições atuais (Open-Meteo)',
  }
}

export function marketInsights(prices: CommodityPrices | null, crops: Crop[]): Insight[] {
  if (!prices) return []
  const out: Insight[] = []
  // Sem alvo definido: destaque informativo apenas se há cultura correspondente
  const hasSoja = crops.some(c => matchCommodity(c.name) === 'soja')
  if (hasSoja && prices.soja >= 125) {
    out.push({
      id: 'market-soja-high',
      category: 'mercado', priority: 2, severity: 'info',
      title: `Soja em patamar alto: R$ ${prices.soja.toFixed(2)}/sc`,
      recommendation: 'Cotação acima da média recente — avalie travar parte da produção no simulador.',
      action: { label: 'Simular venda', href: '/financeiro' },
      source: 'Monitor de mercado',
    })
  }
  return out
}

export function sortInsights(insights: Insight[]): Insight[] {
  const sevRank = { danger: 0, warning: 1, info: 2, success: 3 }
  return [...insights].sort((a, b) =>
    a.priority - b.priority || sevRank[a.severity] - sevRank[b.severity] || (b.impactBRL ?? 0) - (a.impactBRL ?? 0)
  )
}

export { formatBRL }
