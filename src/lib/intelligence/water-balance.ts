import type { WeatherCurrent, WeatherDay, Crop } from '@/types'

// ─────────────────────────────────────────────────────────────
// Balanço hídrico por cultura: Saldo = Chuva − ETc, onde
// ETc = ETo × Kc (coeficiente de cultura por fase fenológica, FAO-56).
// ─────────────────────────────────────────────────────────────

// Kc por cultura e fase (FAO-56, valores médios para o Cerrado)
const KC_TABLE: { host: string; phases: { match: string[]; kc: number }[]; default: number }[] = [
  {
    host: 'soja',
    phases: [
      { match: ['germin', 'emerg', 'semead'], kc: 0.4 },
      { match: ['vegetativo', 'desenvolv'],   kc: 0.8 },
      { match: ['flor'],                       kc: 1.15 },
      { match: ['enchimento', 'grão'],         kc: 1.15 },
      { match: ['matura', 'pré-colheita'],     kc: 0.5 },
    ],
    default: 0.8,
  },
  {
    host: 'milho',
    phases: [
      { match: ['germin', 'emerg', 'semead'], kc: 0.35 },
      { match: ['vegetativo', 'v6', 'cresc'], kc: 0.75 },
      { match: ['flor', 'pendoamento'],       kc: 1.2 },
      { match: ['enchimento', 'grão'],        kc: 1.1 },
      { match: ['matura', 'pré-colheita'],    kc: 0.45 },
    ],
    default: 0.75,
  },
  {
    host: 'algod',
    phases: [
      { match: ['germin', 'emerg'],       kc: 0.35 },
      { match: ['vegetativo', 'cresc'],   kc: 0.75 },
      { match: ['flor', 'capulho'],       kc: 1.18 },
      { match: ['matura', 'abertura'],    kc: 0.6 },
    ],
    default: 0.8,
  },
]

export function kcFor(cropName: string, phase: string): number {
  const name = cropName.toLowerCase()
  const p = phase.toLowerCase()
  const entry = KC_TABLE.find(e => name.includes(e.host))
  if (!entry) return 0.8
  return entry.phases.find(ph => ph.match.some(m => p.includes(m)))?.kc ?? entry.default
}

export type WaterStatus = 'déficit crítico' | 'déficit' | 'equilíbrio' | 'excedente'

export interface WaterBalance {
  crop: string
  kc: number
  etc7d: number        // mm — demanda da cultura nos últimos 7 dias
  rain7d: number       // mm
  balance: number      // mm (chuva − ETc)
  forecastRain5d: number
  projectedBalance: number // saldo projetado incluindo chuva prevista 5d
  status: WaterStatus
  irrigationMm: number // lâmina recomendada (0 se não precisa)
}

export function waterBalanceFor(crop: Crop, current: WeatherCurrent, days: WeatherDay[]): WaterBalance {
  const kc = kcFor(crop.name, crop.phase)
  const etc7d = +(current.eto7d * kc).toFixed(1)
  const balance = +(current.rain7d - etc7d).toFixed(1)
  const forecastRain5d = +days.slice(0, 5).reduce((a, d) => a + d.rain, 0).toFixed(1)
  // Projeção: saldo atual + chuva prevista − demanda prevista (ETo diária ≈ eto7d/7)
  const etcNext5d = (current.eto7d / 7) * 5 * kc
  const projectedBalance = +(balance + forecastRain5d - etcNext5d).toFixed(1)

  let status: WaterStatus
  if (balance <= -25)     status = 'déficit crítico'
  else if (balance < -8)  status = 'déficit'
  else if (balance <= 10) status = 'equilíbrio'
  else                    status = 'excedente'

  // Recomendação de irrigação: repõe o déficit não coberto pela chuva prevista
  const irrigationMm = status.startsWith('déficit')
    ? Math.max(0, Math.ceil((-balance - forecastRain5d) * 0.85))
    : 0

  return { crop: crop.name, kc, etc7d, rain7d: current.rain7d, balance, forecastRain5d, projectedBalance, status, irrigationMm }
}

export function assessWaterBalances(crops: Crop[], current: WeatherCurrent, days: WeatherDay[]): WaterBalance[] {
  return crops.map(c => waterBalanceFor(c, current, days)).sort((a, b) => a.balance - b.balance)
}
