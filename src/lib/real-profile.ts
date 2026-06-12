import type { DemoProfile } from '@/lib/demo-profiles'
import type { Crop } from '@/types'

// ─────────────────────────────────────────────────────────────
// Constrói um perfil (mesmo formato dos demo) a partir da
// fazenda REAL do usuário no Supabase. O perfil vai num cookie
// (`farm_profile`) que toda a plataforma já sabe ler — assim os
// módulos funcionam com dados reais sem reescrita.
// ─────────────────────────────────────────────────────────────

export interface DbFarm {
  id: string; name: string; city: string; state: string
  lat: number; lon: number; hectares: number
}

export interface DbCrop {
  id: string; name: string; variety: string | null; field: string
  hectares: number; planted_at: string; harvest_at: string | null
  expected_yield: number | null
}

const CROP_EMOJI: Record<string, string> = {
  soja: '🌱', milho: '🌽', algod: '🌿', trigo: '🌾', cana: '🎋', feij: '🫘', past: '🌾',
}

function emojiFor(name: string): string {
  const n = name.toLowerCase()
  for (const [key, emoji] of Object.entries(CROP_EMOJI)) if (n.includes(key)) return emoji
  return '🌱'
}

// Fase estimada pela posição no ciclo plantio→colheita
function phaseFor(plantedAt: string, harvestAt: string | null): { phase: string; percent: number } {
  const start = new Date(plantedAt).getTime()
  const end = harvestAt ? new Date(harvestAt).getTime() : start + 120 * 86_400_000
  const pct = Math.max(0, Math.min(100, Math.round(((Date.now() - start) / (end - start)) * 100)))
  const phase =
    pct < 10 ? 'Germinação' :
    pct < 35 ? 'Desenvolvimento vegetativo' :
    pct < 55 ? 'Floração' :
    pct < 80 ? 'Enchimento de grãos' :
    pct < 95 ? 'Maturação fisiológica' : 'Pré-colheita'
  return { phase, percent: pct }
}

export function buildProfileFromFarm(farm: DbFarm, crops: DbCrop[], email: string, plan = 'Gratuito'): DemoProfile {
  const profileCrops: Crop[] = crops.map(c => {
    const { phase, percent } = phaseFor(c.planted_at, c.harvest_at)
    return {
      id: c.id,
      name: c.variety ? `${c.name} ${c.variety}` : c.name,
      emoji: emojiFor(c.name),
      field: c.field,
      hectares: Number(c.hectares),
      plantedAt: c.planted_at,
      harvestAt: c.harvest_at ?? '',
      phase,
      phasePercent: percent,
      status: 'normal',
    }
  })

  return {
    id: `real-${farm.id.slice(0, 8)}`,
    label: farm.name,
    role: 'Produtor rural',
    description: '',
    avatar: farm.name.slice(0, 2).toUpperCase(),
    email,
    plan,
    farm: {
      id: farm.id,
      name: farm.name,
      city: farm.city,
      state: farm.state,
      lat: Number(farm.lat),
      lon: Number(farm.lon),
      hectares: Number(farm.hectares),
    },
    crops: profileCrops,
    alerts: [], // alertas reais são gerados pela IA a partir do clima
    stats: [],
  }
}

export const FARM_PROFILE_COOKIE = 'farm_profile'

export function encodeProfileCookie(profile: DemoProfile): string {
  return encodeURIComponent(JSON.stringify(profile))
}

export function decodeProfileCookie(value: string): DemoProfile | null {
  try {
    const p = JSON.parse(decodeURIComponent(value))
    if (p?.farm?.lat != null && p?.farm?.lon != null && Array.isArray(p?.crops)) return p as DemoProfile
    return null
  } catch {
    return null
  }
}
