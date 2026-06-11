'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { History, Bot, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ClimateData {
  source: string
  monthName: string
  daysElapsed: number
  current:  { rain: number; tempAvg: number }
  lastYear: { rain: number; tempAvg: number }
  rainDelta: number
  tempDelta: number
  rainStatus: 'seco' | 'chuvoso' | 'normal'
  tempStatus: 'quente' | 'frio' | 'normal'
}

export function ClimateHistoryCard({ lat, lon }: { lat: number; lon: number }) {
  const router = useRouter()
  const [data, setData] = useState<ClimateData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/climate-history?lat=${lat}&lon=${lon}`)
      .then(r => r.json()).then(setData).finally(() => setLoading(false))
  }, [lat, lon])

  function askAI() {
    if (!data) return
    const q = data.rainStatus !== 'normal'
      ? `A chuva de ${data.monthName} está ${Math.abs(data.rainDelta)}% ${data.rainStatus === 'seco' ? 'abaixo' : 'acima'} do ano passado (${data.current.rain}mm vs ${data.lastYear.rain}mm). Como isso afeta minhas culturas?`
      : `Como a temperatura ${data.tempDelta > 0 ? `${data.tempDelta}°C acima` : `${Math.abs(data.tempDelta)}°C abaixo`} da média histórica impacta a produtividade?`
    router.push(`/assistente?q=${encodeURIComponent(q)}`)
  }

  const rainBar = (val: number, max: number) =>
    `${Math.min(100, Math.round((val / Math.max(max, 1)) * 100))}%`

  if (loading) return (
    <Card className="p-5">
      <div className="h-4 w-40 bg-stone-100 rounded animate-pulse mb-4" />
      <div className="space-y-2">{[0,1,2].map(i => <div key={i} className="h-8 bg-stone-100 rounded-lg animate-pulse" />)}</div>
    </Card>
  )

  if (!data) return null

  const maxRain = Math.max(data.current.rain, data.lastYear.rain, 1)
  const rainUp  = data.rainDelta > 5
  const rainDn  = data.rainDelta < -5
  const tempUp  = data.tempDelta > 0.5
  const tempDn  = data.tempDelta < -0.5

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-medium text-stone-700">Comparativo histórico</h3>
        </div>
        <span className="text-[10px] text-stone-400 capitalize">{data.monthName} · {data.daysElapsed}d</span>
      </div>

      {/* Rain comparison */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-stone-500">Chuva acumulada</span>
          <span className={`flex items-center gap-1 text-xs font-semibold ${rainDn ? 'text-red-500' : rainUp ? 'text-blue-600' : 'text-stone-500'}`}>
            {rainDn ? <TrendingDown className="w-3 h-3" /> : rainUp ? <TrendingUp className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {data.rainDelta > 0 ? '+' : ''}{data.rainDelta}% vs ano passado
          </span>
        </div>
        <div className="space-y-1.5">
          {[
            { label: `${data.monthName} 2026`,  val: data.current.rain,  color: rainDn ? 'bg-red-400' : rainUp ? 'bg-blue-500' : 'bg-stone-500' },
            { label: `${data.monthName} 2025`,  val: data.lastYear.rain, color: 'bg-stone-300' },
          ].map(({ label, val, color }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-[10px] text-stone-400 w-20 flex-shrink-0">{label}</span>
              <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${color}`} style={{ width: rainBar(val, maxRain) }} />
              </div>
              <span className="text-[11px] font-medium text-stone-700 w-12 text-right">{val} mm</span>
            </div>
          ))}
        </div>
      </div>

      {/* Temp comparison */}
      <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-stone-50 mb-4">
        <span className="text-xs text-stone-500">Temperatura média</span>
        <div className="flex items-center gap-3 text-sm">
          <span className={`font-semibold ${tempUp ? 'text-red-500' : tempDn ? 'text-blue-500' : 'text-stone-700'}`}>
            {data.current.tempAvg}°C
          </span>
          <span className="text-stone-300">vs</span>
          <span className="text-stone-400">{data.lastYear.tempAvg}°C</span>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
            tempUp ? 'bg-red-50 text-red-600' : tempDn ? 'bg-blue-50 text-blue-600' : 'bg-stone-100 text-stone-500'
          }`}>
            {data.tempDelta > 0 ? '+' : ''}{data.tempDelta}°C
          </span>
        </div>
      </div>

      <button onClick={askAI} className="w-full flex items-center justify-center gap-2 text-xs font-medium text-green-700 border border-green-200 bg-green-50 hover:bg-green-100 rounded-xl py-2 transition-colors">
        <Bot className="w-3.5 h-3.5" />
        Impacto nas culturas com IA
      </button>
      <p className="text-[9px] text-stone-300 mt-2 text-right">{data.source}</p>
    </Card>
  )
}
