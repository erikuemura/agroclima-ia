import { NextResponse } from 'next/server'
import { getDemoProfileFromCookie, DEMO_PROFILES, type DemoProfileId } from '@/lib/demo-profiles'
import { fetchForecast } from '@/lib/weather'
import { pricesFromApi, type CommodityPrices } from '@/lib/finance'
import { assessDiseases } from '@/lib/intelligence/disease'
import { assessWaterBalances } from '@/lib/intelligence/water-balance'
import {
  stormInsights, diseaseInsights, waterInsights, sprayWindowInsight, marketInsights, sortInsights,
} from '@/lib/intelligence/insights'
import { computeHealthScore } from '@/lib/intelligence/health-score'

// ─────────────────────────────────────────────────────────────
// Agricultural Intelligence Layer — endpoint central.
// Consolida clima, doenças, balanço hídrico e mercado em
// insights priorizados + health score + resumo diário.
// Consumidores: Home, AgroAssistente, modo consultor, notificações.
// ─────────────────────────────────────────────────────────────

// Relatório de chuva: ontem / 7 dias / 30 dias via Open-Meteo (past_days)
async function rainReport(lat: number, lon: number) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_sum&past_days=31&forecast_days=1&timezone=auto`
    const res = await fetch(url, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000) })
    if (!res.ok) throw new Error('rain report failed')
    const data = await res.json()
    const rains: number[] = data.daily?.precipitation_sum ?? []
    // último índice = hoje; ontem = length-2
    const past = rains.slice(0, -1)
    const yesterday = +(past[past.length - 1] ?? 0).toFixed(1)
    const week  = +past.slice(-7).reduce((a: number, b: number) => a + (b ?? 0), 0).toFixed(1)
    const month = +past.slice(-30).reduce((a: number, b: number) => a + (b ?? 0), 0).toFixed(1)
    return { yesterday, week, month }
  } catch {
    return null
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  // ?profile= permite ao modo consultor consultar qualquer fazenda demo
  const profileParam = searchParams.get('profile') as DemoProfileId | null
  const profile = profileParam && DEMO_PROFILES[profileParam]
    ? DEMO_PROFILES[profileParam]
    : getDemoProfileFromCookie(req.headers.get('cookie') ?? '')

  const { lat, lon } = profile.farm
  const base = new URL(req.url).origin

  const [weatherRes, commoditiesRes, rainRes] = await Promise.allSettled([
    fetchForecast(lat, lon),
    fetch(`${base}/api/commodities`).then(r => r.json()),
    rainReport(lat, lon),
  ])

  if (weatherRes.status !== 'fulfilled') {
    return NextResponse.json({ error: 'Clima indisponível' }, { status: 503 })
  }

  const weather = weatherRes.value
  const prices: CommodityPrices | null =
    commoditiesRes.status === 'fulfilled' ? pricesFromApi(commoditiesRes.value) : null
  const rain = rainRes.status === 'fulfilled' ? rainRes.value : null

  // Engines
  const diseases = assessDiseases(weather.current, weather.days, profile.crops)
  const water = assessWaterBalances(profile.crops, weather.current, weather.days)
  const storms = stormInsights(weather.days)

  const insights = sortInsights([
    ...storms,
    ...diseaseInsights(diseases),
    ...waterInsights(water, profile.crops, prices, weather.current.eto7d),
    ...(sprayWindowInsight(weather.current, weather.days) ? [sprayWindowInsight(weather.current, weather.days)!] : []),
    ...marketInsights(prices, profile.crops),
  ])

  const healthScore = computeHealthScore({
    stormInsights: storms,
    diseaseRisks: diseases,
    waterBalances: water,
  })

  const worstDisease = diseases[0] ?? null

  const dailySummary = {
    rainYesterday: rain?.yesterday ?? null,
    rain7d: weather.current.rain7d,
    rain30d: rain?.month ?? null,
    phytosanitaryRisk: worstDisease ? { disease: worstDisease.disease, level: worstDisease.level } : null,
    cropStages: profile.crops.map(c => ({ name: c.name, phase: c.phase, percent: c.phasePercent })),
    forecast5d: weather.days.slice(0, 5).map(d => ({ label: d.label, icon: d.icon, tempMax: d.tempMax, rain: d.rain })),
  }

  return NextResponse.json({
    farm: { id: profile.id, name: profile.farm.name, city: profile.farm.city, state: profile.farm.state, hectares: profile.farm.hectares },
    healthScore,
    insights,
    diseases,
    waterBalances: water,
    rainReport: rain,
    dailySummary,
    generatedAt: new Date().toISOString(),
  })
}
