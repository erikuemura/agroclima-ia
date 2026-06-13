export interface Field {
  id: string
  name: string
  hectares: number
  cropId: string | null
  cropName: string | null
  cropEmoji: string | null
  ndvi: number
  ndviStatus: 'critico' | 'baixo' | 'normal' | 'bom' | 'otimo'
  soilType: string
  coordinates: [number, number][]
}

export const FIELDS: Field[] = [
  {
    id: 't1',
    name: 'Talhão 1',
    hectares: 420,
    cropId: '1',
    cropName: 'Soja safra 25/26',
    cropEmoji: '🌱',
    ndvi: 0.74,
    ndviStatus: 'bom',
    soilType: 'Latossolo Vermelho',
    coordinates: [
      [-12.530, -55.710],
      [-12.530, -55.695],
      [-12.545, -55.695],
      [-12.545, -55.710],
    ],
  },
  {
    id: 't2',
    name: 'Talhão 2',
    hectares: 180,
    cropId: '2',
    cropName: 'Milho 2ª safra',
    cropEmoji: '🌽',
    ndvi: 0.32,
    ndviStatus: 'baixo',
    soilType: 'Latossolo Amarelo',
    coordinates: [
      [-12.548, -55.710],
      [-12.548, -55.700],
      [-12.558, -55.700],
      [-12.558, -55.710],
    ],
  },
  {
    id: 't3',
    name: 'Talhão 3',
    hectares: 95,
    cropId: null,
    cropName: null,
    cropEmoji: null,
    ndvi: 0.12,
    ndviStatus: 'critico',
    soilType: 'Argissolo',
    coordinates: [
      [-12.548, -55.698],
      [-12.548, -55.690],
      [-12.555, -55.690],
      [-12.555, -55.698],
    ],
  },
]

// ─────────────────────────────────────────────────────────────
// Talhões derivados do PERFIL ATIVO (fazenda real ou demo).
// Cada cultura vira um talhão; o NDVI é estimado pela fase
// fenológica (proxy visual) e os polígonos são gerados em volta
// do lat/lon real da fazenda — quando o módulo de talhões com
// desenho manual existir, isto vira o fallback.
// ─────────────────────────────────────────────────────────────
import type { DemoProfile } from '@/lib/demo-profiles'

// NDVI típico por fase: solo nu → pico vegetativo → senescência
function ndviForPhase(phase: string, percent: number): number {
  const p = phase.toLowerCase()
  if (p.includes('germin') || p.includes('emerg') || p.includes('semead')) return 0.25
  if (p.includes('colheita') || p.includes('matura'))                       return 0.35
  if (p.includes('flor'))                                                   return 0.78
  if (p.includes('enchimento') || p.includes('grão'))                       return 0.72
  if (p.includes('vegetativo') || p.includes('desenvolv') || p.includes('cresc')) return 0.62
  // fallback proporcional ao avanço do ciclo (curva de sino simplificada)
  return +(0.3 + 0.5 * Math.sin((percent / 100) * Math.PI)).toFixed(2)
}

function statusForNdvi(ndvi: number): Field['ndviStatus'] {
  if (ndvi < 0.2) return 'critico'
  if (ndvi < 0.4) return 'baixo'
  if (ndvi < 0.55) return 'normal'
  if (ndvi < 0.75) return 'bom'
  return 'otimo'
}

// Gera um quadrado de coordenadas em volta do centro, deslocado em grade
function squareAround(lat: number, lon: number, idx: number): [number, number][] {
  const size = 0.012 // ~1.3km de lado
  const gap = 0.004
  const col = idx % 2
  const row = Math.floor(idx / 2)
  const offLat = lat + (row * (size + gap)) - 0.01
  const offLon = lon + (col * (size + gap)) - 0.01
  return [
    [offLat, offLon],
    [offLat, offLon + size],
    [offLat - size, offLon + size],
    [offLat - size, offLon],
  ]
}

export function fieldsFromProfile(profile: DemoProfile): Field[] {
  if (!profile.crops.length) return []
  return profile.crops.map((c, i) => {
    const ndvi = ndviForPhase(c.phase, c.phasePercent)
    return {
      id: c.id || `t${i + 1}`,
      name: c.field || `Talhão ${i + 1}`,
      hectares: c.hectares,
      cropId: c.id,
      cropName: c.name,
      cropEmoji: c.emoji,
      ndvi,
      ndviStatus: statusForNdvi(ndvi),
      soilType: 'Latossolo Vermelho',
      coordinates: squareAround(profile.farm.lat, profile.farm.lon, i),
    }
  })
}

export const NDVI_COLOR: Record<Field['ndviStatus'], string> = {
  critico: '#ef4444',
  baixo:   '#f97316',
  normal:  '#eab308',
  bom:     '#22c55e',
  otimo:   '#15803d',
}

export const NDVI_LABEL: Record<Field['ndviStatus'], string> = {
  critico: 'Crítico',
  baixo:   'Baixo',
  normal:  'Normal',
  bom:     'Bom',
  otimo:   'Ótimo',
}
