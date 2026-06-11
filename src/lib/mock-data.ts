import type { Farm, Crop } from '@/types'

export const FARM: Farm = {
  id: '1',
  name: 'Fazenda São João',
  city: 'Sorriso',
  state: 'MT',
  lat: -12.5449,
  lon: -55.7212,
  hectares: 600,
}

export const CROPS: Crop[] = [
  {
    id: '1',
    name: 'Soja safra 25/26',
    emoji: '🌱',
    field: 'Talhão 1',
    hectares: 420,
    plantedAt: '2025-10-15',
    harvestAt: '2026-02-20',
    phase: 'Enchimento de grãos',
    phasePercent: 72,
    status: 'attention',
  },
  {
    id: '2',
    name: 'Milho 2ª safra',
    emoji: '🌽',
    field: 'Talhão 2',
    hectares: 180,
    plantedAt: '2026-02-01',
    harvestAt: '2026-06-20',
    phase: 'Germinação',
    phasePercent: 8,
    status: 'normal',
  },
]
