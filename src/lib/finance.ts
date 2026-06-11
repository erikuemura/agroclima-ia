import type { Crop, Alert } from '@/types'

// ─────────────────────────────────────────────────────────────
// Motor financeiro do CampoClima — converte agronomês em reais.
// Funções puras: preços sempre entram por parâmetro (vêm de /api/commodities).
// ─────────────────────────────────────────────────────────────

export interface CommodityPrices {
  soja: number   // R$/sc 60kg
  milho: number  // R$/sc 60kg
  boi?: number   // R$/@
}

export type CommodityId = keyof CommodityPrices

// Produtividade típica usada quando não há estimativa do produtor (sc/ha)
export const DEFAULT_YIELD_SC: Record<string, number> = {
  soja: 60,
  milho: 100, // milho 2ª safra
}

// Identifica a commodity pelo nome da cultura cadastrada
export function matchCommodity(cropName: string): CommodityId | null {
  const n = cropName.toLowerCase()
  if (n.includes('soja')) return 'soja'
  if (n.includes('milho')) return 'milho'
  return null
}

// Coeficiente de resposta hídrica Ky (FAO-33) por fase fenológica.
// Quanto maior o Ky, mais a falta d'água custa em produtividade.
export function kyForPhase(phase: string): number {
  const p = phase.toLowerCase()
  if (p.includes('enchimento') || p.includes('grão'))                       return 1.0
  if (p.includes('flor'))                                                   return 0.8
  if (p.includes('pré-colheita') || p.includes('matura'))                   return 0.2
  if (p.includes('germin') || p.includes('emerg') || p.includes('estabelec')) return 0.4
  return 0.5 // vegetativo / default
}

export interface DeficitLoss {
  lossPct: number   // % de perda de produtividade estimada
  lossScHa: number  // sacas perdidas por hectare
  lossBRL: number   // perda total em R$ na área da cultura
  ky: number
}

// Perda estimada por déficit hídrico: Ky × (déficit / ETc) — FAO-33.
// deficitMm e etcMm no mesmo período (usamos a janela de 7 dias do dashboard).
export function lossFromWaterDeficit(
  deficitMm: number,
  etcMm: number,
  crop: Crop,
  priceSc: number,
  yieldSc?: number
): DeficitLoss | null {
  if (deficitMm <= 0 || etcMm <= 0) return null
  const commodity = matchCommodity(crop.name)
  if (!commodity) return null

  const ky = kyForPhase(crop.phase)
  // Cap em 25%: uma semana de déficit não destrói a safra inteira
  const lossPct = Math.min(0.25, ky * (deficitMm / etcMm))
  const y = yieldSc ?? DEFAULT_YIELD_SC[commodity] ?? 60
  const lossScHa = +(y * lossPct).toFixed(1)
  const lossBRL = Math.round(lossScHa * crop.hectares * priceSc)

  return { lossPct: +(lossPct * 100).toFixed(1), lossScHa, lossBRL, ky }
}

// Receita projetada da cultura na cotação atual
export function revenueEstimate(crop: Crop, prices: CommodityPrices, yieldSc?: number): number | null {
  const commodity = matchCommodity(crop.name)
  if (!commodity) return null
  const price = prices[commodity]
  if (!price) return null
  const y = yieldSc ?? DEFAULT_YIELD_SC[commodity] ?? 60
  return Math.round(crop.hectares * y * price)
}

// Valor total da produção estimada de todas as culturas com cotação
export function totalProductionValue(crops: Crop[], prices: CommodityPrices): number {
  return crops.reduce((sum, c) => sum + (revenueEstimate(c, prices) ?? 0), 0)
}

// Economia estimada ao seguir um alerta (heurística conservadora por tipo)
export function alertSavingEstimate(alert: Alert, crops: Crop[], prices: CommodityPrices): number {
  const text = `${alert.title} ${alert.description}`.toLowerCase()
  const crop = crops.find(c => c.name === alert.crop) ?? crops[0]
  const ha = crop?.hectares ?? 100

  // Pulverização evitada antes de chuva: calda + operação ~R$120/ha (evita reaplicar ~50% da área)
  if (text.includes('pulveriza') || text.includes('aplica')) return Math.round(ha * 120 * 0.5)
  // Geada/vendaval com ação preventiva: evita ~1% da receita da cultura em risco
  if (text.includes('geada') || text.includes('vendaval') || text.includes('granizo')) {
    const rev = crop ? revenueEstimate(crop, prices) ?? 0 : 0
    return Math.round(rev * 0.01)
  }
  // Déficit hídrico / irrigação no momento certo: ~0.5% da receita
  if (text.includes('déficit') || text.includes('irriga') || text.includes('hídric')) {
    const rev = crop ? revenueEstimate(crop, prices) ?? 0 : 0
    return Math.round(rev * 0.005)
  }
  // Praga/doença detectada cedo: ~R$60/ha de dano evitado
  if (text.includes('praga') || text.includes('percevejo') || text.includes('ferrugem') || text.includes('lagarta')) {
    return Math.round(ha * 60)
  }
  return 0
}

// R$ 41 mil · R$ 1,2 mi · R$ 850
export function formatBRL(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `R$ ${(value / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`
  if (Math.abs(value) >= 10_000)    return `R$ ${Math.round(value / 1000).toLocaleString('pt-BR')} mil`
  return `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
}

export function formatBRLFull(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

// Extrai o mapa de preços da resposta de /api/commodities
export function pricesFromApi(data: { commodities: { id: string; price: number }[] }): CommodityPrices {
  const get = (id: string) => data.commodities.find(c => c.id === id)?.price ?? 0
  return { soja: get('soja'), milho: get('milho'), boi: get('boi') }
}
