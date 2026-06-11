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
