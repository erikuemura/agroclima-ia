import { NextResponse } from 'next/server'
import { isAdminRequest, unauthorized } from '@/lib/admin-auth'
import { queryEvents, type ServerEvent } from '@/lib/server-events'
import { DEMO_PROFILES } from '@/lib/demo-profiles'

export interface ClientActivity {
  profile: string
  name: string
  aiMessages: number
  aiImages: number
  aiCostBRL: number
  lastSeen: string | null
  daysSinceLastSeen: number | null
  pageViews: number
  topModules: { path: string; count: number }[]
  churnRisk: 'baixo' | 'médio' | 'alto'
}

function daysSince(iso: string | null): number | null {
  if (!iso) return null
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}

export async function GET(req: Request) {
  if (!(await isAdminRequest(req))) return unauthorized()

  const [ai, activity, mp] = await Promise.all([
    queryEvents('ai_usage', 1000),
    queryEvents('app_activity', 2000),
    queryEvents('mp_webhook', 100),
  ])

  const profiles = Object.values(DEMO_PROFILES).map(p => ({ id: p.id, name: p.label }))

  const clients: ClientActivity[] = profiles.map(({ id, name }) => {
    const myAi = ai.events.filter(e => e.profile === id)
    const myActivity = activity.events.filter(e => e.profile === id)

    const lastSeen = [...myAi, ...myActivity]
      .map(e => e.at).sort().pop() ?? null
    const days = daysSince(lastSeen)

    const moduleCount = new Map<string, number>()
    for (const e of myActivity) {
      const path = String(e.data.path ?? '')
      moduleCount.set(path, (moduleCount.get(path) ?? 0) + 1)
    }
    const topModules = [...moduleCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([path, count]) => ({ path, count }))

    // Risco de churn: sem atividade registrada = sem dado; >14d = alto; >7d = médio
    const churnRisk: ClientActivity['churnRisk'] =
      days == null ? 'médio' : days > 14 ? 'alto' : days > 7 ? 'médio' : 'baixo'

    return {
      profile: id,
      name,
      aiMessages: myAi.length,
      aiImages: myAi.filter(e => e.data.hasImage === true).length,
      aiCostBRL: +myAi.reduce((s, e) => s + Number(e.data.costBRL ?? 0), 0).toFixed(2),
      lastSeen,
      daysSinceLastSeen: days,
      pageViews: myActivity.length,
      topModules,
      churnRisk,
    }
  })

  const mpEvents = mp.events.slice(0, 30).map((e: ServerEvent) => ({
    at: e.at, email: e.profile, ...e.data,
  }))

  return NextResponse.json({
    clients,
    mpEvents,
    source: ai.source, // 'supabase' = persistido | 'memoria' = por instância (reseta no deploy)
  })
}
