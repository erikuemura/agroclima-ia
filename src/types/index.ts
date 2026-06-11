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

export interface SoilData {
  ph: number
  nitrogen: number
  phosphorus: number
  potassium: number
  organicMatter: number
  texture: 'argilosa' | 'areno-argilosa' | 'arenosa' | 'média'
  crop: string
}
