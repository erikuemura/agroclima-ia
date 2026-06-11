export type EventType = 'plantio' | 'aplicacao' | 'colheita' | 'irrigacao' | 'monitoramento' | 'outro'

export interface AgriEvent {
  id: string
  date: string // YYYY-MM-DD
  title: string
  type: EventType
  crop: string | null
  field: string | null
  done: boolean
  aiGenerated: boolean
}

export const EVENT_COLOR: Record<EventType, string> = {
  plantio:      'bg-green-100 text-green-800 border-green-200',
  aplicacao:    'bg-blue-100 text-blue-800 border-blue-200',
  colheita:     'bg-amber-100 text-amber-800 border-amber-200',
  irrigacao:    'bg-cyan-100 text-cyan-800 border-cyan-200',
  monitoramento:'bg-purple-100 text-purple-800 border-purple-200',
  outro:        'bg-stone-100 text-stone-700 border-stone-200',
}

export const EVENT_ICON: Record<EventType, string> = {
  plantio:      '🌱',
  aplicacao:    '💧',
  colheita:     '🌾',
  irrigacao:    '🚿',
  monitoramento:'🔍',
  outro:        '📌',
}

export const INITIAL_EVENTS: AgriEvent[] = [
  { id: '1', date: '2026-06-10', title: 'Monitoramento de pragas — T1', type: 'monitoramento', crop: 'Soja', field: 'Talhão 1', done: false, aiGenerated: false },
  { id: '2', date: '2026-06-12', title: 'Pulverização fungicida', type: 'aplicacao', crop: 'Soja', field: 'Talhão 1', done: false, aiGenerated: true },
  { id: '3', date: '2026-06-15', title: 'Irrigação suplementar', type: 'irrigacao', crop: 'Milho', field: 'Talhão 2', done: false, aiGenerated: true },
  { id: '4', date: '2026-06-20', title: 'Avaliação de estande — T2', type: 'monitoramento', crop: 'Milho', field: 'Talhão 2', done: false, aiGenerated: false },
  { id: '5', date: '2026-07-05', title: 'Adubação de cobertura', type: 'aplicacao', crop: 'Milho', field: 'Talhão 2', done: false, aiGenerated: true },
  { id: '6', date: '2026-07-20', title: 'Monitoramento NDVI', type: 'monitoramento', crop: null, field: null, done: false, aiGenerated: true },
  { id: '7', date: '2026-08-10', title: 'Dessecação pré-colheita', type: 'aplicacao', crop: 'Soja', field: 'Talhão 1', done: false, aiGenerated: true },
  { id: '8', date: '2026-09-01', title: 'Plantio Talhão 3', type: 'plantio', crop: null, field: 'Talhão 3', done: false, aiGenerated: false },
]
