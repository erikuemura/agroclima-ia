'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import {
  Activity, AlertTriangle, CheckCircle2, Info, ArrowRight, Sparkles, CloudRain,
} from 'lucide-react'
import type { Insight, HealthScore } from '@/types'
import { cn } from '@/lib/utils'
import { formatBRL, pricesFromApi, type CommodityPrices } from '@/lib/finance'
import { buildLocalInsights } from '@/lib/intelligence/local-insights'

interface InsightsResponse {
  healthScore: HealthScore
  insights: Insight[]
  dailySummary: {
    rainYesterday: number | null
    rain7d: number
    rain30d: number | null
    phytosanitaryRisk: { disease: string; level: string } | null
    cropStages: { name: string; phase: string; percent: number }[]
    forecast5d: { label: string; icon: string; tempMax: number; rain: number }[]
  }
}

const sevIcon = {
  danger:  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />,
  success: <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />,
  info:    <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />,
}

const sevBg = {
  danger:  'bg-red-50 border-red-200',
  warning: 'bg-amber-50 border-amber-200',
  success: 'bg-green-50 border-green-200',
  info:    'bg-blue-50 border-blue-200',
}

const catLabel: Record<string, string> = {
  clima: 'Clima', doenças: 'Doenças', hídrico: 'Hídrico', operações: 'Operações',
  estoque: 'Estoque', financeiro: 'Financeiro', mercado: 'Mercado', satélite: 'Satélite',
}

function scoreColor(level: HealthScore['level']) {
  if (level === 'ótimo')   return { ring: '#16a34a', text: 'text-green-700' }
  if (level === 'bom')     return { ring: '#65a30d', text: 'text-lime-700' }
  if (level === 'atenção') return { ring: '#d97706', text: 'text-amber-600' }
  return { ring: '#dc2626', text: 'text-red-600' }
}

export function ExecutivePanel() {
  const [data, setData] = useState<InsightsResponse | null>(null)
  const [localInsights, setLocalInsights] = useState<Insight[]>([])
  const [pendingOps, setPendingOps] = useState(0)

  useEffect(() => {
    let prices: CommodityPrices | null = null
    fetch('/api/commodities').then(r => r.json()).then(d => { prices = pricesFromApi(d) }).catch(() => {})
      .finally(() => {
        fetch('/api/insights')
          .then(r => r.json())
          .then((d: InsightsResponse) => {
            setData(d)
            const local = buildLocalInsights(prices)
            setLocalInsights(local)
            setPendingOps(local.filter(i => i.category === 'operações').length)
          })
          .catch(() => {})
      })
  }, [])

  if (!data) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-pulse">
        <div className="h-36 bg-stone-100 rounded-xl" />
        <div className="h-36 bg-stone-100 rounded-xl lg:col-span-2" />
      </div>
    )
  }

  const all = [...data.insights, ...localInsights]
  const priority = all.filter(i => i.priority <= 2).slice(0, 6)
  const feed = all.slice(0, 10)
  const { ring, text } = scoreColor(data.healthScore.level)
  const circumference = 2 * Math.PI * 36
  const ds = data.dailySummary

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Health Score */}
        <Card className="p-5 flex items-center gap-5">
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg viewBox="0 0 80 80" className="w-24 h-24 -rotate-90">
              <circle cx="40" cy="40" r="36" fill="none" stroke="#f5f5f4" strokeWidth="7" />
              <circle cx="40" cy="40" r="36" fill="none" stroke={ring} strokeWidth="7" strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - data.healthScore.total / 100)} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn('text-2xl font-bold', text)}>{data.healthScore.total}</span>
              <span className="text-[9px] text-stone-400">/100</span>
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-stone-400 flex items-center gap-1.5 mb-1">
              <Activity className="w-3.5 h-3.5" /> Saúde da fazenda
            </p>
            <p className={cn('text-base font-semibold capitalize mb-2', text)}>{data.healthScore.level}</p>
            <div className="space-y-1">
              {data.healthScore.components.map(c => (
                <div key={c.label} className="flex items-center gap-2">
                  <span className="text-[10px] text-stone-400 w-20 flex-shrink-0">{c.label}</span>
                  <div className="flex-1 h-1 bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${c.score}%`, background: c.score >= 70 ? '#16a34a' : c.score >= 45 ? '#d97706' : '#dc2626' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Resumo diário */}
        <Card className="p-5 lg:col-span-2">
          <p className="text-xs text-stone-400 flex items-center gap-1.5 mb-3">
            <CloudRain className="w-3.5 h-3.5" /> Resumo diário
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
            {[
              { label: 'Chuva ontem', value: ds.rainYesterday != null ? `${ds.rainYesterday}mm` : '—' },
              { label: 'Chuva 7 dias', value: `${ds.rain7d}mm` },
              { label: 'Chuva 30 dias', value: ds.rain30d != null ? `${ds.rain30d}mm` : '—' },
              { label: 'Risco fitossanitário', value: ds.phytosanitaryRisk ? ds.phytosanitaryRisk.level : 'baixo' },
              { label: 'Operações pendentes', value: String(pendingOps) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-stone-50 rounded-lg p-2 text-center">
                <p className="text-sm font-semibold text-stone-800 capitalize">{value}</p>
                <p className="text-[9px] text-stone-400 leading-tight mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            {ds.cropStages.map(c => (
              <span key={c.name} className="text-[10px] bg-green-50 text-green-800 border border-green-200 px-2 py-1 rounded-full">
                {c.name}: {c.phase} ({c.percent}%)
              </span>
            ))}
          </div>
        </Card>
      </div>

      {/* Insights prioritários */}
      {priority.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-stone-600 mb-3 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-500" /> Insights prioritários
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {priority.map(insight => (
              <div key={insight.id} className={cn('rounded-xl border p-3.5', sevBg[insight.severity])}>
                <div className="flex items-start gap-2.5">
                  {sevIcon[insight.severity]}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-stone-800">{insight.title}</p>
                      <span className="text-[9px] uppercase tracking-wide bg-white/70 text-stone-500 px-1.5 py-0.5 rounded">
                        {catLabel[insight.category]}
                      </span>
                      {insight.priority === 1 && (
                        <span className="text-[9px] uppercase tracking-wide bg-red-600 text-white px-1.5 py-0.5 rounded">P1</span>
                      )}
                    </div>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">{insight.recommendation}</p>
                    <div className="flex items-center justify-between mt-2">
                      {insight.impactBRL ? (
                        <span className="text-xs font-semibold text-stone-700">Impacto: {formatBRL(insight.impactBRL)}</span>
                      ) : <span className="text-[10px] text-stone-400">{insight.source}</span>}
                      {insight.action && (
                        <Link href={insight.action.href}
                          className="text-xs font-medium text-green-700 flex items-center gap-1 hover:underline">
                          {insight.action.label} <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feed de alertas */}
      <Card className="p-5">
        <h3 className="text-sm font-medium text-stone-700 mb-3">Feed de alertas</h3>
        <div className="space-y-0.5">
          {feed.map(i => (
            <div key={`feed-${i.id}`} className="flex items-center gap-2.5 py-2 border-b border-stone-50 last:border-0">
              {sevIcon[i.severity]}
              <span className="text-xs text-stone-600 flex-1 min-w-0 truncate">{i.title}</span>
              <span className="text-[9px] uppercase tracking-wide text-stone-400 flex-shrink-0">{catLabel[i.category]}</span>
            </div>
          ))}
          {feed.length === 0 && (
            <p className="text-xs text-stone-400 text-center py-4">Nenhum alerta ativo — tudo em ordem ✅</p>
          )}
        </div>
      </Card>
    </div>
  )
}
