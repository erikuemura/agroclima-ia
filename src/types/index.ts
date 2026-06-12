export interface Farm {
  id: string
  name: string
  city: string
  state: string
  lat: number
  lon: number
  hectares: number
}

export interface Crop {
  id: string
  name: string
  emoji: string
  field: string
  hectares: number
  plantedAt: string
  harvestAt: string
  phase: string
  phasePercent: number
  status: 'normal' | 'attention' | 'critical'
}

export interface WeatherDay {
  date: string
  label: string
  tempMax: number
  tempMin: number
  rain: number
  windMax: number
  icon: 'sun' | 'cloud' | 'rain' | 'storm' | 'partly-cloudy'
}

export interface WeatherCurrent {
  temp: number
  humidity: number
  windSpeed: number
  rain7d: number
  eto: number
  eto7d: number
}

export interface Alert {
  id: string
  severity: 'danger' | 'warning' | 'success' | 'info'
  title: string
  description: string
  crop?: string
}

// ── Sistema central de insights/alertas (Agricultural Intelligence Layer) ──

export type InsightCategory =
  | 'clima' | 'doenças' | 'hídrico' | 'operações'
  | 'estoque' | 'financeiro' | 'mercado' | 'satélite'

export type InsightPriority = 1 | 2 | 3 // 1 = máxima

export interface Insight {
  id: string
  category: InsightCategory
  priority: InsightPriority
  severity: 'danger' | 'warning' | 'info' | 'success'
  title: string
  recommendation: string
  impactBRL?: number
  action?: { label: string; href: string }
  source: string // de onde veio (engine de doença, balanço hídrico, estoque…)
}

export interface HealthScore {
  total: number // 0–100
  components: { label: string; score: number; weight: number }[]
  level: 'ótimo' | 'bom' | 'atenção' | 'crítico'
}

export interface SoilData {
  ph: number
  nitrogen: number
  phosphorus: number
  potassium: number
  organicMatter: number
  texture: 'argilosa' | 'areno-argilosa' | 'arenosa' | 'média'
  crop: string
}
