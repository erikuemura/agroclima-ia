'use client'

import { getDemoProfileClient } from '@/lib/demo-profiles'

// ─────────────────────────────────────────────────────────────
// Persistência client-side dos módulos operacionais (diário,
// estoque, planejamento, mercado, comunidade). Chaves separadas
// por perfil demo; ao ligar o Supabase, estas funções viram a
// camada de acesso ao banco (mesma assinatura).
// ─────────────────────────────────────────────────────────────

function key(name: string): string {
  const profile = getDemoProfileClient()
  return `campoclima_${name}_${profile.id}`
}

export function readStore<T>(name: string, seed: () => T[]): T[] {
  if (typeof window === 'undefined') return []
  const k = key(name)
  try {
    const raw = localStorage.getItem(k)
    if (raw) return JSON.parse(raw)
  } catch { /* corrompido — re-seed */ }
  const seeded = seed()
  localStorage.setItem(k, JSON.stringify(seeded))
  return seeded
}

export function writeStore<T>(name: string, data: T[]): void {
  localStorage.setItem(key(name), JSON.stringify(data))
}

// ── Diário de campo ──────────────────────────────────────────

export type DiaryEventType = 'plantio' | 'pulverização' | 'adubação' | 'irrigação' | 'colheita' | 'monitoramento' | 'outro'

export interface DiaryEvent {
  id: string
  type: DiaryEventType
  date: string       // YYYY-MM-DD
  field: string      // talhão
  operator: string
  machine: string
  notes: string
  stockItemId?: string // integração com estoque (saída automática)
  stockQty?: number
}

export const DIARY_TYPE_META: Record<DiaryEventType, { emoji: string; color: string }> = {
  'plantio':        { emoji: '🌱', color: 'bg-green-100 text-green-800' },
  'pulverização':   { emoji: '💧', color: 'bg-blue-100 text-blue-800' },
  'adubação':       { emoji: '🧪', color: 'bg-amber-100 text-amber-800' },
  'irrigação':      { emoji: '🚿', color: 'bg-cyan-100 text-cyan-800' },
  'colheita':       { emoji: '🌾', color: 'bg-orange-100 text-orange-800' },
  'monitoramento':  { emoji: '🔍', color: 'bg-purple-100 text-purple-800' },
  'outro':          { emoji: '📋', color: 'bg-stone-100 text-stone-700' },
}

function daysAgo(n: number): string {
  const d = new Date(); d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

export function readDiary(): DiaryEvent[] {
  const profile = getDemoProfileClient()
  const field1 = profile.crops[0]?.field ?? 'Talhão 1'
  const field2 = profile.crops[1]?.field ?? 'Talhão 2'
  return readStore<DiaryEvent>('diary', () => [
    { id: 'd1', type: 'pulverização', date: daysAgo(3), field: field1, operator: 'João', machine: 'Uniport 3030', notes: 'Fungicida preventivo, 150 L/ha' },
    { id: 'd2', type: 'monitoramento', date: daysAgo(5), field: field2, operator: 'Carlos', machine: '—', notes: 'Sem pragas acima do nível de controle' },
    { id: 'd3', type: 'adubação', date: daysAgo(9), field: field1, operator: 'João', machine: 'Distribuidor Lancer', notes: 'KCl 120 kg/ha em cobertura' },
  ])
}

export function writeDiary(events: DiaryEvent[]): void { writeStore('diary', events) }

// ── Estoque de insumos ───────────────────────────────────────

export type StockCategory = 'semente' | 'fertilizante' | 'defensivo' | 'combustível' | 'outro'

export interface StockItem {
  id: string
  name: string
  category: StockCategory
  unit: string       // L, kg, sc, un
  quantity: number
  minQuantity: number
  expiresAt?: string // YYYY-MM-DD
  supplier?: string
  lot?: string
}

export interface StockMovement {
  id: string
  itemId: string
  kind: 'entrada' | 'aplicação' | 'perda' | 'transferência'
  quantity: number
  date: string
  notes: string
}

export function readStock(): StockItem[] {
  return readStore<StockItem>('stock', () => [
    { id: 's1', name: 'Glifosato 480', category: 'defensivo', unit: 'L', quantity: 320, minQuantity: 100, expiresAt: daysAgo(-220), supplier: 'AgroDistrib', lot: 'GL-2412' },
    { id: 's2', name: 'Fungicida triazol+estrobilurina', category: 'defensivo', unit: 'L', quantity: 45, minQuantity: 60, expiresAt: daysAgo(-90), supplier: 'AgroDistrib', lot: 'FG-2501' },
    { id: 's3', name: 'KCl 60%', category: 'fertilizante', unit: 'kg', quantity: 8200, minQuantity: 2000, supplier: 'FertiSul' },
    { id: 's4', name: 'Diesel S10', category: 'combustível', unit: 'L', quantity: 1400, minQuantity: 800, supplier: 'Posto Rural' },
  ])
}

export function writeStockItems(items: StockItem[]): void { writeStore('stock', items) }

export function readStockMovements(): StockMovement[] {
  return readStore<StockMovement>('stock_mov', () => [])
}

export function writeStockMovements(movs: StockMovement[]): void { writeStore('stock_mov', movs) }

export function stockAlerts(items: StockItem[]): { low: StockItem[]; expiring: StockItem[] } {
  const in60d = new Date(); in60d.setDate(in60d.getDate() + 60)
  return {
    low: items.filter(i => i.quantity <= i.minQuantity),
    expiring: items.filter(i => i.expiresAt && new Date(i.expiresAt) <= in60d),
  }
}

// ── Planejamento de safra ────────────────────────────────────

export const BUDGET_CATEGORIES = ['Sementes', 'Fertilizantes', 'Defensivos', 'Combustível', 'Mão de obra'] as const

export interface SeasonPlan {
  id: string
  cropName: string
  variety: string
  areaHa: number
  expectedYieldSc: number
  budget: Record<string, number> // categoria → R$ total planejado
}

export function readPlans(): SeasonPlan[] {
  const profile = getDemoProfileClient()
  return readStore<SeasonPlan>('plans', () =>
    profile.crops.slice(0, 2).map((c, i) => ({
      id: `plan-${c.id}`,
      cropName: c.name,
      variety: i === 0 ? 'M 8372 IPRO' : 'DKB 390',
      areaHa: c.hectares,
      expectedYieldSc: c.name.toLowerCase().includes('milho') ? 105 : 62,
      budget: {
        'Sementes':      Math.round(c.hectares * 420),
        'Fertilizantes': Math.round(c.hectares * 980),
        'Defensivos':    Math.round(c.hectares * 760),
        'Combustível':   Math.round(c.hectares * 180),
        'Mão de obra':   Math.round(c.hectares * 140),
      },
    }))
  )
}

export function writePlans(plans: SeasonPlan[]): void { writeStore('plans', plans) }

// ── Mercado: preço-alvo ──────────────────────────────────────

export interface PriceTarget {
  id: string
  commodity: 'soja' | 'milho' | 'boi'
  label: string
  target: number
  hit?: boolean
}

export function readPriceTargets(): PriceTarget[] {
  return readStore<PriceTarget>('price_targets', () => [])
}

export function writePriceTargets(targets: PriceTarget[]): void { writeStore('price_targets', targets) }

// ── Comunidade ───────────────────────────────────────────────

export type PostCategory = 'praga' | 'doença' | 'clima' | 'mercado' | 'geral'

export interface CommunityPost {
  id: string
  author: string
  city: string
  state: string
  category: PostCategory
  text: string
  likes: number
  likedByMe?: boolean
  comments: { author: string; text: string }[]
  createdAt: string
}

export function readPosts(): CommunityPost[] {
  const profile = getDemoProfileClient()
  const { state } = profile.farm
  return readStore<CommunityPost>('community', () => [
    { id: 'c1', author: 'Roberto M.', city: 'Lucas do Rio Verde', state, category: 'praga', text: 'Percevejo-marrom acima do nível de controle no meu talhão de soja. Alguém mais na região?', likes: 8, comments: [{ author: 'Ana P.', text: 'Aqui também — apliquei ontem.' }], createdAt: daysAgo(1) },
    { id: 'c2', author: 'Ana P.', city: 'Sinop', state, category: 'doença', text: 'Primeiras pústulas de ferrugem na baixeira. Fiquem atentos quem ainda não fez a 2ª aplicação.', likes: 14, comments: [], createdAt: daysAgo(2) },
    { id: 'c3', author: 'Cooperativa Centro-Norte', city: 'Sorriso', state, category: 'mercado', text: 'Prêmio de exportação melhorou no porto — bom momento para consultar contratos.', likes: 5, comments: [], createdAt: daysAgo(3) },
  ])
}

export function writePosts(posts: CommunityPost[]): void { writeStore('community', posts) }

// ── Monitoramento fitossanitário por talhão ──────────────────

export interface PestObservation {
  id: string
  date: string          // YYYY-MM-DD
  field: string         // talhão
  pestId: string
  pestName: string
  level: number         // nível observado (contagem, %, etc.)
  unit: string          // "por metro", "% plantas", "% desfolha"...
  aboveThreshold: boolean // ultrapassou o nível de controle?
  notes: string
}

export function readPestObservations(): PestObservation[] {
  const profile = getDemoProfileClient()
  const field1 = profile.crops[0]?.field ?? 'Talhão 1'
  return readStore<PestObservation>('pest_obs', () => [
    { id: 'po1', date: daysAgo(2), field: field1, pestId: 'percevejo-marrom', pestName: 'Percevejo-marrom', level: 1.5, unit: 'por metro', aboveThreshold: false, notes: 'Pano de batida — abaixo do nível de controle (2/m).' },
  ])
}

export function writePestObservations(obs: PestObservation[]): void { writeStore('pest_obs', obs) }
