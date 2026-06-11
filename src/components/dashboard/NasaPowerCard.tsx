'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Satellite, Bot } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface NasaMonth { month: string; rain: number; temp: number; rh: number; solar: number }

interface NasaData {
  source: string
  months: NasaMonth[]
  currentNormal: NasaMonth
  currentMonthName: string
  annualRain: number
  wettestMonth: string; wettestRain: number
  driestMonth: string;  driestRain: number
}

export function NasaPowerCard({ lat, lon }: { lat: number; lon: number }) {
  const router = useRouter()
  const [data, setData] = useState<NasaData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/nasa-power?lat=${lat}&lon=${lon}`)
      .then(r => r.json()).then(setData).finally(() => setLoading(false))
  }, [lat, lon])

  function askAI() {
    if (!data) return
    const q = `Segundo a climatologia NASA de 30 anos, ${data.currentMonthName} tem média de ${data.currentNormal.rain}mm de chuva, ${data.currentNormal.temp}°C e umidade ${data.currentNormal.rh}%. O mês mais seco é ${data.driestMonth} (${data.driestRain}mm). Como planejar o calendário agrícola com base nisso?`
    router.push(`/assistente?q=${encodeURIComponent(q)}`)
  }

  if (loading) return (
    <Card className="p-5">
      <div className="h-4 w-44 bg-stone-100 rounded animate-pulse mb-4" />
      <div className="h-24 bg-stone-100 rounded-xl animate-pulse" />
    </Card>
  )

  if (!data) return null

  const maxRain = Math.max(...data.months.map(m => m.rain), 1)

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Satellite className="w-4 h-4 text-purple-500" />
          <h3 className="text-sm font-medium text-stone-700">Climatologia 30 anos</h3>
        </div>
        <span className="text-[10px] text-stone-400">NASA POWER</span>
      </div>

      {/* Monthly rain chart — simple bar */}
      <div className="flex items-end gap-0.5 h-16 mb-2">
        {data.months.map((m, i) => {
          const isCurrent = i === new Date().getMonth()
          const h = Math.max(4, Math.round((m.rain / maxRain) * 56))
          return (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-0.5">
              <div
                className={`w-full rounded-t transition-all ${isCurrent ? 'bg-purple-500' : 'bg-stone-200'}`}
                style={{ height: `${h}px` }}
                title={`${m.month}: ${m.rain}mm`}
              />
            </div>
          )
        })}
      </div>
      <div className="flex justify-between text-[9px] text-stone-300 mb-4">
        {data.months.map(m => <span key={m.month}>{m.month}</span>)}
      </div>

      {/* Current month normal */}
      <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 mb-3">
        <p className="text-[10px] font-medium text-purple-600 uppercase tracking-wide mb-2">Normal histórica — {data.currentMonthName}</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: 'Chuva',   value: `${data.currentNormal.rain}mm` },
            { label: 'Temp',    value: `${data.currentNormal.temp}°C` },
            { label: 'Umidade', value: `${data.currentNormal.rh}%` },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-sm font-semibold text-stone-800">{value}</p>
              <p className="text-[10px] text-stone-400">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Wettest / driest */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-blue-50 rounded-lg p-2 text-center">
          <p className="text-[10px] text-blue-500 font-medium">💧 Mais chuvoso</p>
          <p className="text-sm font-semibold text-blue-800">{data.wettestMonth}</p>
          <p className="text-[10px] text-blue-500">{data.wettestRain}mm/mês</p>
        </div>
        <div className="bg-amber-50 rounded-lg p-2 text-center">
          <p className="text-[10px] text-amber-600 font-medium">☀️ Mais seco</p>
          <p className="text-sm font-semibold text-amber-800">{data.driestMonth}</p>
          <p className="text-[10px] text-amber-600">{data.driestRain}mm/mês</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-stone-500 mb-3">
        <span>Chuva anual histórica</span>
        <span className="font-semibold text-stone-800">{data.annualRain} mm/ano</span>
      </div>

      <button onClick={askAI} className="w-full flex items-center justify-center gap-2 text-xs font-medium text-green-700 border border-green-200 bg-green-50 hover:bg-green-100 rounded-xl py-2 transition-colors">
        <Bot className="w-3.5 h-3.5" />
        Planejar safra com base no clima
      </button>
    </Card>
  )
}
