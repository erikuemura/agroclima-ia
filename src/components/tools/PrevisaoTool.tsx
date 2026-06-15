'use client'

import { useState } from 'react'
import { Search, Loader2, CloudRain, Sun, Cloud, CloudLightning, Wind, Droplets, MapPin } from 'lucide-react'
import { ToolCTA } from '@/components/site/ToolCTA'

interface Day { date: string; label: string; tempMax: number; tempMin: number; rain: number; windMax: number; code: number }
interface Forecast { city: string; state: string; current: { temp: number; humidity: number; wind: number }; days: Day[]; spray: 'aberta' | 'restrita' | 'fechada' }

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function icon(code: number, rain: number) {
  if (code >= 95) return <CloudLightning className="w-6 h-6 text-red-500" />
  if (code >= 51 || rain > 3) return <CloudRain className="w-6 h-6 text-blue-500" />
  if (code >= 2) return <Cloud className="w-6 h-6 text-stone-400" />
  return <Sun className="w-6 h-6 text-amber-500" />
}

export function PrevisaoTool() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<Forecast | null>(null)

  async function search(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true); setError(''); setData(null)
    try {
      const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=pt&country=BR`).then(r => r.json())
      const place = geo.results?.[0]
      if (!place) { setError(`Não encontramos "${query}". Tente o nome do município.`); return }

      const f = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,weathercode&hourly=relative_humidity_2m&current_weather=true&timezone=auto&forecast_days=7`).then(r => r.json())

      const days: Day[] = (f.daily.time as string[]).map((date: string, i: number) => {
        const d = new Date(date + 'T12:00:00')
        return {
          date, label: i === 0 ? 'Hoje' : DAY_LABELS[d.getDay()],
          tempMax: Math.round(f.daily.temperature_2m_max[i]),
          tempMin: Math.round(f.daily.temperature_2m_min[i]),
          rain: Math.round(f.daily.precipitation_sum[i] * 10) / 10,
          windMax: Math.round(f.daily.wind_speed_10m_max[i]),
          code: f.daily.weathercode[i],
        }
      })
      const humidity = Math.round(f.hourly?.relative_humidity_2m?.[0] ?? 65)
      const wind = Math.round(f.current_weather.windspeed)
      const spray: Forecast['spray'] = wind > 20 || humidity < 50 ? 'fechada' : wind > 15 || humidity < 60 ? 'restrita' : 'aberta'

      setData({
        city: place.name, state: place.admin1 ?? '',
        current: { temp: Math.round(f.current_weather.temperature), humidity, wind },
        days, spray,
      })
    } catch {
      setError('Erro ao buscar a previsão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const sprayMeta = {
    aberta: { label: 'Janela de pulverização ABERTA agora', cls: 'bg-green-50 border-green-200 text-green-800' },
    restrita: { label: 'Janela de pulverização RESTRITA', cls: 'bg-amber-50 border-amber-200 text-amber-800' },
    fechada: { label: 'Janela de pulverização FECHADA', cls: 'bg-red-50 border-red-200 text-red-800' },
  }

  return (
    <div className="space-y-5">
      <form onSubmit={search} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Digite seu município (ex: Sorriso, Cascavel...)"
            className="w-full border border-stone-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        <button type="submit" disabled={loading} className="bg-green-800 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-green-900 disabled:opacity-50 transition-colors flex items-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Ver previsão
        </button>
      </form>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {data && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-stone-500">
            <MapPin className="w-4 h-4 text-green-600" /> {data.city}{data.state ? ` — ${data.state}` : ''}
          </div>

          {/* Condições atuais */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Temperatura', value: `${data.current.temp}°C`, icon: <Sun className="w-4 h-4 text-amber-500" /> },
              { label: 'Umidade', value: `${data.current.humidity}%`, icon: <Droplets className="w-4 h-4 text-blue-500" /> },
              { label: 'Vento', value: `${data.current.wind} km/h`, icon: <Wind className="w-4 h-4 text-stone-400" /> },
            ].map(c => (
              <div key={c.label} className="bg-stone-50 rounded-xl p-4 text-center">
                <div className="flex justify-center mb-1">{c.icon}</div>
                <p className="text-xl font-semibold text-stone-800">{c.value}</p>
                <p className="text-[10px] text-stone-400">{c.label}</p>
              </div>
            ))}
          </div>

          {/* Janela de pulverização */}
          <div className={`rounded-xl border p-3.5 text-sm font-medium ${sprayMeta[data.spray].cls}`}>
            {sprayMeta[data.spray].label}
          </div>

          {/* Previsão 7 dias */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4">
            <p className="text-sm font-medium text-stone-700 mb-3">Próximos 7 dias</p>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {data.days.map(d => (
                <div key={d.date} className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-stone-50 text-center">
                  <span className="text-[10px] text-stone-400">{d.label}</span>
                  {icon(d.code, d.rain)}
                  <span className="text-xs font-medium text-stone-700">{d.tempMax}°</span>
                  <span className="text-[10px] text-stone-400">{d.tempMin}°</span>
                  {d.rain > 0 && <span className="text-[10px] text-blue-500">{d.rain}mm</span>}
                </div>
              ))}
            </div>
            <p className="text-xs text-stone-400 mt-3 text-right">
              Chuva acumulada 7 dias: <strong>{data.days.reduce((a, d) => a + d.rain, 0).toFixed(0)} mm</strong>
            </p>
          </div>

          <ToolCTA tool="previsao-do-tempo" headline={`Monitore o clima de ${data.city} o ano todo`} />
        </div>
      )}

      {!data && !loading && (
        <p className="text-sm text-stone-400 text-center py-6">
          Digite o nome do seu município para ver a previsão de 7 dias e a janela de pulverização.
        </p>
      )}
    </div>
  )
}
