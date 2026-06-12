import type { HealthScore, Insight } from '@/types'
import type { DiseaseRisk } from './disease'
import type { WaterBalance } from './water-balance'

// ─────────────────────────────────────────────────────────────
// Score de saúde da fazenda (0–100) — consolida clima, fitossanitário,
// hídrico, operacional e financeiro. Componentes ausentes são
// excluídos e os pesos renormalizados.
// ─────────────────────────────────────────────────────────────

export interface HealthInputs {
  stormInsights?: Insight[]        // insights de clima severo
  diseaseRisks?: DiseaseRisk[]
  waterBalances?: WaterBalance[]
  // componentes client-side (opcionais)
  pendingOps?: number              // operações pendentes / talhões sem atualização
  lowStockItems?: number
  budgetOverrunPct?: number        // % acima do orçamento (0 = dentro)
}

function climateScore(storms: Insight[]): number {
  const danger = storms.filter(s => s.severity === 'danger').length
  const warning = storms.filter(s => s.severity === 'warning').length
  return Math.max(0, 100 - danger * 40 - warning * 15)
}

function diseaseScore(risks: DiseaseRisk[]): number {
  if (risks.length === 0) return 100
  const worst = Math.max(...risks.map(r => r.score))
  return Math.max(0, 100 - worst)
}

function waterScore(balances: WaterBalance[]): number {
  if (balances.length === 0) return 100
  const worst = balances[0] // já ordenado pelo pior saldo
  if (worst.status === 'déficit crítico') return 25
  if (worst.status === 'déficit')         return 55
  if (worst.status === 'excedente')       return 80
  return 95
}

export function computeHealthScore(inputs: HealthInputs): HealthScore {
  const parts: { label: string; score: number; weight: number }[] = []

  if (inputs.stormInsights)  parts.push({ label: 'Clima',         score: climateScore(inputs.stormInsights), weight: 20 })
  if (inputs.diseaseRisks)   parts.push({ label: 'Fitossanitário', score: diseaseScore(inputs.diseaseRisks),  weight: 25 })
  if (inputs.waterBalances)  parts.push({ label: 'Hídrico',       score: waterScore(inputs.waterBalances),   weight: 25 })
  if (inputs.pendingOps != null)
    parts.push({ label: 'Operacional', score: Math.max(0, 100 - inputs.pendingOps * 20), weight: 15 })
  if (inputs.lowStockItems != null || inputs.budgetOverrunPct != null) {
    const stockPenalty  = (inputs.lowStockItems ?? 0) * 15
    const budgetPenalty = Math.min(50, (inputs.budgetOverrunPct ?? 0) * 2)
    parts.push({ label: 'Financeiro', score: Math.max(0, 100 - stockPenalty - budgetPenalty), weight: 15 })
  }

  const totalWeight = parts.reduce((s, p) => s + p.weight, 0) || 1
  const total = Math.round(parts.reduce((s, p) => s + p.score * p.weight, 0) / totalWeight)

  const level = total >= 85 ? 'ótimo' : total >= 70 ? 'bom' : total >= 50 ? 'atenção' : 'crítico'
  return { total, components: parts, level }
}
