import { describe, it, expect } from 'vitest'
import { assessDiseases } from '../disease'
import { kcFor, waterBalanceFor } from '../water-balance'
import { computeHealthScore } from '../health-score'
import { stormInsights, sortInsights } from '../insights'
import { lossFromWaterDeficit, formatBRL, matchCommodity, revenueEstimate } from '@/lib/finance'
import { estimateAiCostBRL } from '@/lib/server-events'
import type { WeatherCurrent, WeatherDay, Crop } from '@/types'

const sojaFloracao: Crop = {
  id: 'c1', name: 'Soja safra 25/26', emoji: '🌱', field: 'Talhão 1',
  hectares: 100, plantedAt: '2025-10-15', harvestAt: '2026-02-20',
  phase: 'Floração', phasePercent: 50, status: 'normal',
}

const humidWeather: WeatherCurrent = { temp: 24, humidity: 92, windSpeed: 8, rain7d: 45, eto: 4, eto7d: 28 }
const dryWeather: WeatherCurrent   = { temp: 33, humidity: 40, windSpeed: 12, rain7d: 1, eto: 6.5, eto7d: 44 }

function mkDays(rain: number, tempMax = 28, windMax = 15, icon: WeatherDay['icon'] = 'rain'): WeatherDay[] {
  return Array.from({ length: 10 }, (_, i) => ({
    date: `2026-06-${String(11 + i).padStart(2, '0')}`, label: `D${i}`,
    tempMax, tempMin: tempMax - 10, rain, windMax, icon,
  }))
}

describe('engine de doenças', () => {
  it('ferrugem em soja na floração com clima úmido → risco alto/crítico', () => {
    const risks = assessDiseases(humidWeather, mkDays(8, 26), [sojaFloracao])
    const ferrugem = risks.find(r => r.diseaseId === 'ferrugem-asiatica')
    expect(ferrugem).toBeDefined()
    expect(['alto', 'crítico']).toContain(ferrugem!.level)
    expect(ferrugem!.factors.length).toBeGreaterThan(0)
  })

  it('clima seco e quente → risco baixo', () => {
    const risks = assessDiseases(dryWeather, mkDays(0, 36, 15, 'sun'), [sojaFloracao])
    const ferrugem = risks.find(r => r.diseaseId === 'ferrugem-asiatica')
    expect(ferrugem!.level).toBe('baixo')
  })

  it('cultura não hospedeira não gera risco', () => {
    const pasto: Crop = { ...sojaFloracao, id: 'c2', name: 'Pastagem' }
    const risks = assessDiseases(humidWeather, mkDays(8), [pasto])
    expect(risks).toHaveLength(0)
  })
})

describe('balanço hídrico', () => {
  it('Kc varia por fase (floração > germinação)', () => {
    expect(kcFor('Soja', 'Floração')).toBeGreaterThan(kcFor('Soja', 'Germinação'))
  })

  it('semana seca gera déficit e recomendação de irrigação', () => {
    const wb = waterBalanceFor(sojaFloracao, dryWeather, mkDays(0, 36, 15, 'sun'))
    expect(wb.balance).toBeLessThan(0)
    expect(['déficit', 'déficit crítico']).toContain(wb.status)
    expect(wb.irrigationMm).toBeGreaterThan(0)
  })

  it('semana chuvosa não recomenda irrigação', () => {
    const wb = waterBalanceFor(sojaFloracao, humidWeather, mkDays(10))
    expect(wb.irrigationMm).toBe(0)
  })
})

describe('health score', () => {
  it('sem problemas → score alto', () => {
    const hs = computeHealthScore({ stormInsights: [], diseaseRisks: [], waterBalances: [] })
    expect(hs.total).toBeGreaterThanOrEqual(85)
    expect(hs.level).toBe('ótimo')
  })

  it('doença crítica derruba o componente fitossanitário', () => {
    const risks = assessDiseases(humidWeather, mkDays(8, 26), [sojaFloracao])
    const hs = computeHealthScore({ stormInsights: [], diseaseRisks: risks, waterBalances: [] })
    const fito = hs.components.find(c => c.label === 'Fitossanitário')!
    expect(fito.score).toBeLessThan(50)
  })

  it('pesos são renormalizados quando faltam componentes', () => {
    const hs = computeHealthScore({ diseaseRisks: [] })
    expect(hs.total).toBe(100)
  })
})

describe('insights de tempestade', () => {
  it('previsão de tempestade gera insight P1', () => {
    const insights = stormInsights(mkDays(50, 30, 70, 'storm'))
    expect(insights.length).toBeGreaterThan(0)
    expect(insights[0].priority).toBe(1)
    expect(insights[0].severity).toBe('danger')
  })

  it('ordenação: P1 danger antes de P2 warning', () => {
    const sorted = sortInsights([
      { id: 'a', category: 'clima', priority: 2, severity: 'warning', title: '', recommendation: '', source: '' },
      { id: 'b', category: 'clima', priority: 1, severity: 'danger', title: '', recommendation: '', source: '' },
    ])
    expect(sorted[0].id).toBe('b')
  })
})

describe('motor financeiro', () => {
  it('identifica commodity pelo nome da cultura', () => {
    expect(matchCommodity('Soja safra 25/26')).toBe('soja')
    expect(matchCommodity('Milho 2ª safra')).toBe('milho')
    expect(matchCommodity('Pastagem')).toBeNull()
  })

  it('déficit hídrico gera perda em R$ proporcional à área', () => {
    const loss = lossFromWaterDeficit(20, 40, sojaFloracao, 120)
    expect(loss).not.toBeNull()
    expect(loss!.lossBRL).toBeGreaterThan(0)
    const lossDouble = lossFromWaterDeficit(20, 40, { ...sojaFloracao, hectares: 200 }, 120)
    expect(lossDouble!.lossBRL).toBe(loss!.lossBRL * 2)
  })

  it('perda é limitada a 25% mesmo com déficit extremo', () => {
    const loss = lossFromWaterDeficit(100, 40, sojaFloracao, 120)
    expect(loss!.lossPct).toBeLessThanOrEqual(25)
  })

  it('receita estimada usa preço e produtividade default', () => {
    const rev = revenueEstimate(sojaFloracao, { soja: 120, milho: 55 })
    expect(rev).toBe(100 * 60 * 120)
  })

  it('custo de IA: sonnet > haiku, imagem encarece, custo > 0', () => {
    const haiku = estimateAiCostBRL('claude-haiku-4-5', 4000, 2000, false)
    const sonnet = estimateAiCostBRL('claude-sonnet-4-6', 4000, 2000, false)
    const sonnetImg = estimateAiCostBRL('claude-sonnet-4-6', 4000, 2000, true)
    expect(haiku).toBeGreaterThan(0)
    expect(sonnet).toBeGreaterThan(haiku)
    expect(sonnetImg).toBeGreaterThan(sonnet)
    // sanity: 1.000 tokens in + 500 out no haiku ≈ R$0,02 — nunca reais inteiros
    expect(haiku).toBeLessThan(0.1)
  })

  it('formatBRL compacta valores grandes', () => {
    expect(formatBRL(41_000)).toBe('R$ 41 mil')
    expect(formatBRL(4_100_000)).toContain('mi')
    expect(formatBRL(850)).toBe('R$ 850')
  })
})
