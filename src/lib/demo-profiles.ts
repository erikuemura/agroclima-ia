import type { Farm, Crop, Alert } from '@/types'

export type DemoProfileId = 'pequeno' | 'medio' | 'grande'

export interface DemoProfile {
  id: string // demo: 'pequeno'|'medio'|'grande' · contas reais: 'real-<farmId>'
  label: string
  role: string
  description: string
  avatar: string
  email: string
  plan: string
  farm: Farm
  crops: Crop[]
  alerts: Alert[]
  stats: { label: string; value: string; sub: string; trend: 'up' | 'down' | 'neutral' }[]
}

export const DEMO_PROFILES: Record<DemoProfileId, DemoProfile> = {

  // ──────────────────────────────────────────────
  // 1. PEQUENO AGRICULTOR — Família rural, 80 ha
  // ──────────────────────────────────────────────
  pequeno: {
    id: 'pequeno',
    label: 'Pequeno Agricultor',
    role: 'Agricultura familiar',
    description: 'Produtor familiar com 80 ha no interior do Paraná. Cultiva soja e milho para subsistência e venda local. Primeiro ano usando tecnologia agrícola.',
    avatar: 'JM',
    email: 'demo.pequeno@campoclima.com.br',
    plan: 'Produtor · R$49/mês',
    farm: {
      id: 'demo-pequeno',
      name: 'Sítio Boa Esperança',
      city: 'Cascavel',
      state: 'PR',
      lat: -24.9558,
      lon: -53.4552,
      hectares: 80,
    },
    crops: [
      {
        id: 'p1',
        name: 'Soja safra 25/26',
        emoji: '🌱',
        field: 'Talhão A — Frente',
        hectares: 50,
        plantedAt: '2025-10-20',
        harvestAt: '2026-03-05',
        phase: 'Floração',
        phasePercent: 45,
        status: 'normal',
      },
      {
        id: 'p2',
        name: 'Milho 2ª safra',
        emoji: '🌽',
        field: 'Talhão B — Fundo',
        hectares: 30,
        plantedAt: '2026-02-10',
        harvestAt: '2026-06-30',
        phase: 'Germinação',
        phasePercent: 12,
        status: 'normal',
      },
    ],
    alerts: [
      { id: 'p-a1', severity: 'warning', title: 'Chuva prevista amanhã', description: 'Precipitação de 18mm esperada. Evitar pulverização nas próximas 24h.', crop: 'Soja safra 25/26' },
      { id: 'p-a2', severity: 'info', title: 'Janela de pulverização', description: 'Quinta-feira 6h–9h: vento 7km/h, umidade 74%. Condições ideais.', crop: 'Soja safra 25/26' },
      { id: 'p-a3', severity: 'success', title: 'Germinação do milho normal', description: '91% de emergência. Estande dentro do esperado para a densidade plantada.' },
    ],
    stats: [
      { label: 'Área total', value: '80 ha', sub: '2 talhões ativos', trend: 'neutral' },
      { label: 'NDVI médio', value: '0.68', sub: 'Soja em floração', trend: 'up' },
      { label: 'Chuva 7 dias', value: '22mm', sub: 'Dentro do normal', trend: 'neutral' },
      { label: 'Safra estimada', value: '58 sc/ha', sub: '+4% vs ano passado', trend: 'up' },
    ],
  },

  // ──────────────────────────────────────────────
  // 2. MÉDIO AGRICULTOR — 600 ha no Mato Grosso
  // ──────────────────────────────────────────────
  medio: {
    id: 'medio',
    label: 'Médio Agricultor',
    role: 'Produtor rural independente',
    description: 'Produtor com 600 ha em Sorriso/MT. Opera soja + milho safrinha com 2 funcionários. Foco em produtividade e redução de custos operacionais.',
    avatar: 'CS',
    email: 'demo.medio@campoclima.com.br',
    plan: 'Produtor · R$49/mês',
    farm: {
      id: 'demo-medio',
      name: 'Fazenda São João',
      city: 'Sorriso',
      state: 'MT',
      lat: -12.5449,
      lon: -55.7212,
      hectares: 600,
    },
    crops: [
      {
        id: 'm1',
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
        id: 'm2',
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
    ],
    alerts: [
      { id: 'm-a1', severity: 'danger', title: 'Risco de geada nas próximas 48h', description: 'Temperatura mínima projetada: 2°C na madrugada de quinta. Acionar irrigação de proteção.', crop: 'Soja safra 25/26' },
      { id: 'm-a2', severity: 'warning', title: 'Janela de pulverização amanhã', description: 'Condições ideais 6h–10h: vento 8km/h, umidade 72%. Priorizar fungicida.', crop: 'Soja safra 25/26' },
      { id: 'm-a3', severity: 'warning', title: 'Déficit hídrico no Talhão 2', description: 'ETo acumulado 7 dias sem chuva significativa. Considerar irrigação suplementar.' },
      { id: 'm-a4', severity: 'info', title: 'NDVI estável em 0.74', description: 'Vegetação dentro do esperado para a fase atual. Sem anomalias detectadas por satélite.' },
    ],
    stats: [
      { label: 'Área total', value: '600 ha', sub: '2 culturas ativas', trend: 'neutral' },
      { label: 'NDVI médio', value: '0.74', sub: 'Acima da média regional', trend: 'up' },
      { label: 'Chuva 7 dias', value: '12mm', sub: 'Abaixo do ideal', trend: 'down' },
      { label: 'Safra estimada', value: '62 sc/ha', sub: '+8% vs safra anterior', trend: 'up' },
    ],
  },

  // ──────────────────────────────────────────────
  // 3. GRANDE AGRICULTOR / EMPRESA — 4.200 ha
  // ──────────────────────────────────────────────
  grande: {
    id: 'grande',
    label: 'Grande Produtor',
    role: 'Grupo agrícola — 3 fazendas',
    description: 'Grupo Agropecuário Cerrado com 4.200 ha distribuídos em 3 propriedades no MT. Opera soja, milho, algodão e pastagem. Equipe de 12 funcionários + 2 agrônomos.',
    avatar: 'GA',
    email: 'demo.grande@campoclima.com.br',
    plan: 'Premium · R$129/mês',
    farm: {
      id: 'demo-grande',
      name: 'Grupo Cerrado Agro',
      city: 'Nova Mutum',
      state: 'MT',
      lat: -13.8271,
      lon: -56.0803,
      hectares: 4200,
    },
    crops: [
      {
        id: 'g1',
        name: 'Soja safra 25/26',
        emoji: '🌱',
        field: 'Fazenda Norte — Talhões 1–8',
        hectares: 1800,
        plantedAt: '2025-10-05',
        harvestAt: '2026-02-10',
        phase: 'Pré-colheita',
        phasePercent: 88,
        status: 'normal',
      },
      {
        id: 'g2',
        name: 'Milho 2ª safra',
        emoji: '🌽',
        field: 'Fazenda Sul — Talhões 9–14',
        hectares: 1200,
        plantedAt: '2026-01-20',
        harvestAt: '2026-06-10',
        phase: 'V6 — Crescimento vegetativo',
        phasePercent: 35,
        status: 'normal',
      },
      {
        id: 'g3',
        name: 'Algodão',
        emoji: '🌿',
        field: 'Fazenda Leste — Talhões 15–18',
        hectares: 800,
        plantedAt: '2025-12-01',
        harvestAt: '2026-07-30',
        phase: 'Floração — capulhos formando',
        phasePercent: 55,
        status: 'attention',
      },
      {
        id: 'g4',
        name: 'Pastagem renovada',
        emoji: '🌾',
        field: 'Reserva — Talhão 19',
        hectares: 400,
        plantedAt: '2025-09-01',
        harvestAt: '2026-12-31',
        phase: 'Estabelecimento',
        phasePercent: 70,
        status: 'normal',
      },
    ],
    alerts: [
      { id: 'g-a1', severity: 'success', title: 'Soja pronta para colheita em 12 dias', description: 'Umidade dos grãos: 16.2%. Aguardar 12 dias para atingir 13% ideal. Agendar colhedoras.', crop: 'Soja safra 25/26' },
      { id: 'g-a2', severity: 'warning', title: 'Percevejo no algodão — Talhão 16', description: 'NDVI indica estresse localizado. Monitoramento de pragas recomendado nas próximas 48h.', crop: 'Algodão' },
      { id: 'g-a3', severity: 'danger', title: 'Vendaval previsto — 65km/h', description: 'Frente fria com rajadas de 65km/h na madrugada de sexta. Risco de acamamento no milho V6.', crop: 'Milho 2ª safra' },
      { id: 'g-a4', severity: 'info', title: 'Relatório mensal disponível', description: 'Resumo de janeiro: produtividade, insumos e projeção de receita gerado pela IA.' },
      { id: 'g-a5', severity: 'success', title: 'NDVI acima da média regional', description: 'Fazenda Norte: NDVI 0.81 vs média regional 0.72. Manejo diferenciado com bom resultado.' },
    ],
    stats: [
      { label: 'Área total', value: '4.200 ha', sub: '3 fazendas · 4 culturas', trend: 'neutral' },
      { label: 'NDVI médio', value: '0.79', sub: '+10% vs média regional', trend: 'up' },
      { label: 'Receita estimada', value: 'R$ 8,4M', sub: 'Safra 25/26 projetada', trend: 'up' },
      { label: 'Colheita soja', value: '12 dias', sub: '1.800 ha em pré-colheita', trend: 'neutral' },
    ],
  },
}

function parseRealProfile(cookieHeader: string): DemoProfile | null {
  const match = cookieHeader.match(/farm_profile=([^;]+)/)
  if (!match) return null
  try {
    const p = JSON.parse(decodeURIComponent(match[1]))
    if (p?.farm?.lat != null && Array.isArray(p?.crops)) return p as DemoProfile
  } catch { /* cookie corrompido — ignora */ }
  return null
}

export function getDemoProfileFromCookie(cookieHeader: string | null): DemoProfile {
  if (!cookieHeader) return DEMO_PROFILES.medio
  // Fazenda real (usuário autenticado) tem prioridade sobre demo
  const real = parseRealProfile(cookieHeader)
  if (real) return real
  const match = cookieHeader.match(/demo_profile=([^;]+)/)
  const id = (match?.[1] ?? 'medio') as DemoProfileId
  return DEMO_PROFILES[id] ?? DEMO_PROFILES.medio
}

export function getDemoProfileClient(): DemoProfile {
  if (typeof document === 'undefined') return DEMO_PROFILES.medio
  return getDemoProfileFromCookie(document.cookie)
}
