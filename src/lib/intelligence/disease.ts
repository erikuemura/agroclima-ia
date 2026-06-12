import type { WeatherCurrent, WeatherDay, Crop } from '@/types'

// ─────────────────────────────────────────────────────────────
// Engine de risco fitossanitário — arquitetura extensível.
// Modelos baseados nas regras públicas da Embrapa: favorabilidade
// climática por temperatura, umidade relativa (proxy de molhamento
// foliar) e chuva, cruzada com a suscetibilidade da fase da cultura.
// ─────────────────────────────────────────────────────────────

export type DiseaseRiskLevel = 'baixo' | 'médio' | 'alto' | 'crítico'

export interface DiseaseRisk {
  diseaseId: string
  disease: string
  crop: string
  level: DiseaseRiskLevel
  score: number          // 0–100
  factors: string[]      // fatores que puxaram o risco
  recommendation: string
}

interface DiseaseModel {
  id: string
  name: string
  // culturas suscetíveis (substring no nome da cultura)
  hosts: string[]
  // fases de maior suscetibilidade (substring na fase)
  criticalPhases: string[]
  assess(current: WeatherCurrent, days: WeatherDay[]): { score: number; factors: string[] }
  recommendation(level: DiseaseRiskLevel): string
}

// Dias da previsão com condição favorável (chuva + temperatura na faixa)
function favorableDays(days: WeatherDay[], tMin: number, tMax: number, rainMin: number): number {
  return days.slice(0, 5).filter(d => {
    const tAvg = (d.tempMax + d.tempMin) / 2
    return tAvg >= tMin && tAvg <= tMax && d.rain >= rainMin
  }).length
}

const FERRUGEM: DiseaseModel = {
  id: 'ferrugem-asiatica',
  name: 'Ferrugem asiática',
  hosts: ['soja'],
  criticalPhases: ['flor', 'enchimento', 'vegetativo'],
  assess(current, days) {
    const factors: string[] = []
    let score = 0
    // Temperatura ótima do fungo: 18–28°C
    if (current.temp >= 18 && current.temp <= 28) { score += 25; factors.push(`temperatura ${current.temp}°C na faixa ótima (18–28°C)`) }
    // UR > 80% por períodos longos ≈ molhamento foliar ≥ 6h
    if (current.humidity >= 90)      { score += 35; factors.push(`umidade ${current.humidity}% — molhamento foliar prolongado`) }
    else if (current.humidity >= 80) { score += 25; factors.push(`umidade ${current.humidity}% favorece molhamento foliar`) }
    // Chuvas frequentes nos próximos dias
    const fav = favorableDays(days, 18, 28, 2)
    if (fav >= 3)      { score += 30; factors.push(`${fav} dias com chuva e temperatura favoráveis na previsão`) }
    else if (fav >= 1) { score += 15; factors.push(`${fav} dia(s) favorável(is) na previsão`) }
    // Chuva acumulada recente mantém inóculo ativo
    if (current.rain7d >= 30) { score += 10; factors.push(`${current.rain7d}mm nos últimos 7 dias`) }
    return { score: Math.min(100, score), factors }
  },
  recommendation(level) {
    if (level === 'crítico') return 'Aplicação de fungicida urgente — janela de infecção aberta. Priorize a próxima janela de pulverização.'
    if (level === 'alto')    return 'Programe fungicida preventivo nos próximos 3 dias e monitore folhas baixeiras diariamente.'
    if (level === 'médio')   return 'Monitore folhas baixeiras (lesões cinza-castanhas na face inferior) a cada 2 dias.'
    return 'Condições pouco favoráveis. Mantenha o monitoramento semanal de rotina.'
  },
}

const MOFO_BRANCO: DiseaseModel = {
  id: 'mofo-branco',
  name: 'Mofo branco',
  hosts: ['soja', 'algod', 'feijão', 'feijao'],
  criticalPhases: ['flor'],
  assess(current, days) {
    const factors: string[] = []
    let score = 0
    // Fungo de clima ameno: 15–25°C
    if (current.temp >= 15 && current.temp <= 25) { score += 30; factors.push(`temperatura amena ${current.temp}°C (ótimo 15–25°C)`) }
    if (current.humidity >= 85)      { score += 35; factors.push(`umidade ${current.humidity}% — solo úmido favorece apotécios`) }
    else if (current.humidity >= 75) { score += 20; factors.push(`umidade ${current.humidity}% moderadamente favorável`) }
    const fav = favorableDays(days, 15, 25, 5)
    if (fav >= 3)      { score += 25; factors.push(`${fav} dias úmidos e amenos na previsão`) }
    else if (fav >= 1) { score += 10; factors.push(`${fav} dia(s) favorável(is) na previsão`) }
    if (current.rain7d >= 40) { score += 10; factors.push(`solo encharcado (${current.rain7d}mm em 7 dias)`) }
    return { score: Math.min(100, score), factors }
  },
  recommendation(level) {
    if (level === 'crítico') return 'Risco máximo durante a floração — aplicar fungicida específico imediatamente e evitar irrigação por aspersão.'
    if (level === 'alto')    return 'Aplicar fungicida preventivo no início da floração e reduzir irrigação por aspersão.'
    if (level === 'médio')   return 'Inspecionar hastes próximas ao solo em busca de micélio branco. Atenção redobrada na floração.'
    return 'Baixa favorabilidade. Monitoramento de rotina é suficiente.'
  },
}

// Registry — para adicionar uma doença, basta incluir o modelo aqui
export const DISEASE_MODELS: DiseaseModel[] = [FERRUGEM, MOFO_BRANCO]

function levelFromScore(score: number): DiseaseRiskLevel {
  if (score >= 80) return 'crítico'
  if (score >= 60) return 'alto'
  if (score >= 35) return 'médio'
  return 'baixo'
}

export function assessDiseases(
  current: WeatherCurrent,
  days: WeatherDay[],
  crops: Crop[]
): DiseaseRisk[] {
  const risks: DiseaseRisk[] = []
  for (const model of DISEASE_MODELS) {
    for (const crop of crops) {
      const name = crop.name.toLowerCase()
      if (!model.hosts.some(h => name.includes(h))) continue
      const { score, factors } = model.assess(current, days)
      // Fase suscetível amplifica; fora dela, atenua
      const phase = crop.phase.toLowerCase()
      const inCriticalPhase = model.criticalPhases.some(p => phase.includes(p))
      const adjusted = Math.round(inCriticalPhase ? Math.min(100, score * 1.15) : score * 0.6)
      const level = levelFromScore(adjusted)
      risks.push({
        diseaseId: model.id,
        disease: model.name,
        crop: crop.name,
        level,
        score: adjusted,
        factors: inCriticalPhase
          ? [...factors, `cultura em fase suscetível (${crop.phase})`]
          : factors,
        recommendation: model.recommendation(level),
      })
    }
  }
  // Maior risco primeiro
  return risks.sort((a, b) => b.score - a.score)
}
