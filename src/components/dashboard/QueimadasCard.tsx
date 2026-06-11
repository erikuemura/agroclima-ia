'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Flame, RefreshCw, Bot, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface FireData {
  source: string
  totalState7d: number
  nearby50: number
  nearby100: number
  nearestKm: number | null
  nearestMunicipio: string | null
  risk: 'mínimo' | 'baixo' | 'moderado' | 'alto'
}

const riskConfig = {
  mínimo:   { color: 'text-green-600',  bg: 'bg-green-50  border-green-200',  dot: 'bg-green-500' },
  baixo:    { color: 'text-amber-600',  bg: 'bg-amber-50  border-amber-200',  dot: 'bg-amber-400' },
  moderado: { color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', dot: 'bg-orange-500' },
  alto:     { color: 'text-red-600',    bg: 'bg-red-50    border-red-200',    dot: 'bg-red-500'   },
}

export function QueimadasCard({ lat, lon, state }: { lat: number; lon: number; state: string }) {
  const router = useRouter()
  const [data, setData] = useState<FireData | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/queimadas?lat=${lat}&lon=${lon}&state=${state}`)
      if (res.ok) setData(await res.json())
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [lat, lon, state])

  const cfg = data ? riskConfig[data.risk] : riskConfig.mínimo

  function askAI() {
    const q = (data?.nearby50 ?? 0) > 0
      ? `Há ${data!.nearby50} focos de queimada a até 50km da fazenda (risco ${data!.risk}). Devo me preocupar? Como proteger as culturas?`
      : `Como monitorar e me prevenir de queimadas próximas à fazenda?`
    router.push(`/assistente?q=${encodeURIComponent(q)}`)
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-500" />
          <h3 className="text-sm font-medium text-stone-700">Queimadas próximas</h3>
        </div>
        <button onClick={load} disabled={loading} className="text-stone-400 hover:text-stone-600 transition-colors disabled:opacity-40">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && !data ? (
        <div className="space-y-2.5">
          {[0,1,2].map(i => <div key={i} className="h-8 rounded-lg bg-stone-100 animate-pulse" />)}
        </div>
      ) : data ? (
        <>
          {/* Risk badge */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border mb-4 ${cfg.bg}`}>
            <span className={`w-2 h-2 rounded-full ${cfg.dot} flex-shrink-0`} />
            <span className={`text-sm font-semibold capitalize ${cfg.color}`}>Risco {data.risk}</span>
            {data.nearestKm && (
              <span className="text-xs text-stone-500 ml-auto">{data.nearestKm}km do mais próximo</span>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: 'no estado (7d)',  value: data.totalState7d },
              { label: '≤ 50 km',         value: data.nearby50 },
              { label: '≤ 100 km',        value: data.nearby100 },
            ].map(({ label, value }) => (
              <div key={label} className="bg-stone-50 rounded-xl p-2.5 text-center">
                <p className={`text-lg font-semibold ${value > 0 ? cfg.color : 'text-stone-400'}`}>{value}</p>
                <p className="text-[10px] text-stone-400 leading-tight mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {data.nearestMunicipio && (
            <p className="text-xs text-stone-500 mb-3">
              📍 Foco mais próximo: <span className="font-medium">{data.nearestMunicipio}</span>
            </p>
          )}

          {/* AI button */}
          <button
            onClick={askAI}
            className="w-full flex items-center justify-center gap-2 text-xs font-medium text-green-700 border border-green-200 bg-green-50 hover:bg-green-100 rounded-xl py-2 transition-colors"
          >
            <Bot className="w-3.5 h-3.5" />
            Analisar risco com AgroAssistente
          </button>

          <p className="text-[9px] text-stone-300 mt-2 text-right">{data.source}</p>
        </>
      ) : (
        <p className="text-sm text-stone-400 py-4 text-center">Dados indisponíveis</p>
      )}
    </Card>
  )
}
