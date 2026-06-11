'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Thermometer, Droplets, Wind, Sun, AlertTriangle,
  CheckCircle2, Info, CloudRain, CloudLightning, Cloud,
} from 'lucide-react'
import type { WeatherCurrent, WeatherDay, Alert, Crop, Farm } from '@/types'
import type { DemoProfile } from '@/lib/demo-profiles'
import { cn } from '@/lib/utils'
import { CommoditiesCard } from './CommoditiesCard'
import { RegionalBenchmark } from './RegionalBenchmark'
import { QueimadasCard } from './QueimadasCard'
import { ClimateHistoryCard } from './ClimateHistoryCard'
import { NasaPowerCard } from './NasaPowerCard'

interface Props {
  weather: { current: WeatherCurrent; days: WeatherDay[] }
  alerts: Alert[]
  crops: Crop[]
  farm: Farm
  profile: DemoProfile
}

const WeatherIcon = ({ icon, size = 20 }: { icon: WeatherDay['icon']; size?: number }) => {
  const cls = `w-${size === 20 ? 5 : 6} h-${size === 20 ? 5 : 6}`
  if (icon === 'storm') return <CloudLightning className={cn(cls, 'text-red-500')} />
  if (icon === 'rain') return <CloudRain className={cn(cls, 'text-blue-500')} />
  if (icon === 'partly-cloudy') return <Cloud className={cn(cls, 'text-stone-400')} />
  if (icon === 'cloud') return <Cloud className={cn(cls, 'text-stone-400')} />
  return <Sun className={cn(cls, 'text-amber-500')} />
}

const AlertIcon = ({ severity }: { severity: Alert['severity'] }) => {
  if (severity === 'danger') return <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
  if (severity === 'warning') return <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
  if (severity === 'success') return <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
  return <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
}

const alertBg: Record<Alert['severity'], string> = {
  danger: 'bg-red-50 border-red-200',
  warning: 'bg-amber-50 border-amber-200',
  success: 'bg-green-50 border-green-200',
  info: 'bg-blue-50 border-blue-200',
}

const statusColor: Record<Crop['status'], string> = {
  normal: 'bg-green-100 text-green-800',
  attention: 'bg-amber-100 text-amber-800',
  critical: 'bg-red-100 text-red-800',
}

const statusLabel: Record<Crop['status'], string> = {
  normal: 'Normal',
  attention: 'Atenção',
  critical: 'Crítico',
}

export function WeatherDashboard({ weather, alerts, crops, farm, profile }: Props) {
  const { current, days } = weather
  const waterDeficit = Math.max(0, current.eto7d - current.rain7d)
  const spraySafe = current.windSpeed >= 5 && current.windSpeed <= 20 && days[0]?.rain < 2

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-stone-800">Clima & alertas</h1>
        <p className="text-sm text-stone-400 mt-0.5">
          Previsão e recomendações para {farm.city} — {farm.state}
        </p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-stone-100 rounded-xl p-4">
          <p className="text-xs text-stone-500 flex items-center gap-1 mb-1.5">
            <Thermometer className="w-3.5 h-3.5" /> Temperatura
          </p>
          <p className="text-2xl font-semibold text-stone-800">{current.temp}°C</p>
          <p className="text-xs text-stone-400 mt-0.5">Umidade {current.humidity}%</p>
        </div>
        <div className="bg-stone-100 rounded-xl p-4">
          <p className="text-xs text-stone-500 flex items-center gap-1 mb-1.5">
            <Droplets className="w-3.5 h-3.5" /> Chuva 7 dias
          </p>
          <p className="text-2xl font-semibold text-stone-800">{current.rain7d} mm</p>
          <p className={cn('text-xs mt-0.5', waterDeficit > 15 ? 'text-red-500' : 'text-stone-400')}>
            {waterDeficit > 0 ? `Déficit: ${waterDeficit.toFixed(1)} mm` : 'Balanço positivo'}
          </p>
        </div>
        <div className="bg-stone-100 rounded-xl p-4">
          <p className="text-xs text-stone-500 flex items-center gap-1 mb-1.5">
            <Wind className="w-3.5 h-3.5" /> Vento agora
          </p>
          <p className="text-2xl font-semibold text-stone-800">{current.windSpeed} km/h</p>
          <p className={cn('text-xs mt-0.5', spraySafe ? 'text-green-600' : 'text-stone-400')}>
            {spraySafe ? '✓ Janela de pulv. ok' : 'Fora da janela ideal'}
          </p>
        </div>
        <div className="bg-stone-100 rounded-xl p-4">
          <p className="text-xs text-stone-500 flex items-center gap-1 mb-1.5">
            <Sun className="w-3.5 h-3.5" /> ETo hoje
          </p>
          <p className="text-2xl font-semibold text-stone-800">{current.eto} mm</p>
          <p className={cn('text-xs mt-0.5', current.eto > 6 ? 'text-amber-500' : 'text-stone-400')}>
            {current.eto > 6 ? 'Alta demanda hídrica' : 'Demanda moderada'}
          </p>
        </div>
      </div>

      {/* Previsão + Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-stone-700">Previsão 10 dias</h3>
            <span className="text-xs text-stone-400">{farm.city} — {farm.state}</span>
          </div>
          <div className="grid grid-cols-5 lg:grid-cols-10 gap-1">
            {days.map((day, i) => (
              <div
                key={day.date}
                className={cn(
                  'flex flex-col items-center gap-1 p-2 rounded-lg text-center',
                  i === 0 ? 'bg-stone-100' : 'hover:bg-stone-50'
                )}
              >
                <span className="text-[10px] text-stone-400">{day.label}</span>
                <WeatherIcon icon={day.icon} size={20} />
                <span className="text-xs font-medium text-stone-700">{day.tempMax}°</span>
                <span className="text-[10px] text-stone-400">{day.tempMin}°</span>
                {day.rain > 0 && (
                  <span className="text-[10px] text-blue-500">{day.rain}mm</span>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-stone-100">
            <div className="flex items-center justify-between text-xs text-stone-500 mb-1.5">
              <span>Chuva acumulada prevista 10 dias</span>
              <span className="font-medium">{days.reduce((a, d) => a + d.rain, 0).toFixed(0)} mm</span>
            </div>
            <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-400 rounded-full"
                style={{ width: `${Math.min(100, (days.reduce((a, d) => a + d.rain, 0) / 150) * 100)}%` }}
              />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-stone-700">Alertas IA</h3>
            <Badge variant="outline" className="text-xs">{alerts.length}</Badge>
          </div>
          <div className="space-y-2.5">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={cn('flex items-start gap-2 p-2.5 rounded-lg border text-xs', alertBg[alert.severity])}
              >
                <AlertIcon severity={alert.severity} />
                <div>
                  <p className="font-medium text-stone-800">{alert.title}</p>
                  <p className="text-stone-500 mt-0.5 leading-relaxed">{alert.description}</p>
                </div>
              </div>
            ))}
            {alerts.length === 0 && (
              <p className="text-xs text-stone-400 text-center py-6">Sem alertas no momento</p>
            )}
          </div>
        </Card>
      </div>

      {/* Culturas */}
      <div>
        <h3 className="text-sm font-medium text-stone-600 mb-3">Culturas monitoradas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {crops.map((crop) => (
            <Card key={crop.id} className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center text-lg">
                  {crop.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800 truncate">{crop.name}</p>
                  <p className="text-xs text-stone-400">{crop.field} · {crop.hectares} ha</p>
                </div>
                <Badge className={cn('text-xs', statusColor[crop.status])}>
                  {statusLabel[crop.status]}
                </Badge>
              </div>
              <div className="mb-2">
                <div className="flex justify-between text-xs text-stone-500 mb-1">
                  <span>{crop.phase}</span>
                  <span>{crop.phasePercent}%</span>
                </div>
                <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${crop.phasePercent}%` }}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                <span className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded">
                  Plantio: {new Date(crop.plantedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </span>
                <span className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded">
                  Colheita: {new Date(crop.harvestAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </span>
              </div>
            </Card>
          ))}

          <Card className="p-4 border-dashed flex flex-col items-center justify-center gap-2 min-h-[140px] text-stone-400 hover:bg-stone-50 cursor-pointer transition-colors">
            <div className="w-8 h-8 rounded-full border-2 border-dashed border-stone-300 flex items-center justify-center">
              <span className="text-lg leading-none">+</span>
            </div>
            <span className="text-xs">Adicionar cultura</span>
          </Card>
        </div>
      </div>

      {/* Queimadas + Histórico climático */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <QueimadasCard lat={farm.lat} lon={farm.lon} state={farm.state} />
        <ClimateHistoryCard lat={farm.lat} lon={farm.lon} />
      </div>

      {/* Cotações + Benchmark regional */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CommoditiesCard />
        <RegionalBenchmark profile={profile} />
      </div>

      {/* Climatologia NASA 30 anos */}
      <NasaPowerCard lat={farm.lat} lon={farm.lon} />

      {/* ETo + Irrigação */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="text-sm font-medium text-stone-700 mb-4">Balanço hídrico & irrigação</h3>
          <div className="space-y-2.5">
            {[
              { label: 'ETo acumulada 7 dias', value: `${current.eto7d} mm`, tag: current.eto7d > 35 ? { text: 'Alto', color: 'bg-amber-100 text-amber-800' } : null },
              { label: 'Chuva efetiva 7 dias', value: `${current.rain7d} mm`, tag: null },
              { label: 'Déficit hídrico', value: `${waterDeficit.toFixed(1)} mm`, tag: waterDeficit > 20 ? { text: 'Crítico', color: 'bg-red-100 text-red-800' } : waterDeficit > 10 ? { text: 'Moderado', color: 'bg-amber-100 text-amber-800' } : { text: 'Ok', color: 'bg-green-100 text-green-800' } },
              { label: 'Reposição recomendada', value: `${Math.ceil(waterDeficit * 0.85)} mm`, tag: { text: 'Agir hoje', color: 'bg-green-100 text-green-800' } },
              { label: 'Umidade relativa', value: `${current.humidity}%`, tag: null },
            ].map(({ label, value, tag }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0 text-sm">
                <span className="text-stone-500">{label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-stone-800">{value}</span>
                  {tag && (
                    <span className={cn('text-[10px] px-2 py-0.5 rounded font-medium', tag.color)}>
                      {tag.text}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-medium text-stone-700 mb-4">NDVI & saúde da lavoura</h3>
          <div className="mb-4">
            <p className="text-xs text-stone-400 mb-2">Talhão 1 — Soja · média: 0.74</p>
            <div className="relative h-3 rounded-full overflow-hidden mb-1" style={{ background: 'linear-gradient(to right, #fca5a5, #fde68a, #86efac, #166534)' }}>
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-green-600"
                style={{ left: 'calc(74% - 8px)' }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-stone-400">
              <span>0 — estresse severo</span>
              <span>1.0 — cobertura máxima</span>
            </div>
            <p className="text-xs text-green-600 mt-1.5">✓ Boa cobertura vegetal</p>
          </div>
          <div className="space-y-2.5">
            {[
              { icon: '🛰️', text: 'Última imagem: 08 jun · Sentinel-2 · 10m de resolução' },
              { icon: '⚠️', text: 'Zona com NDVI baixo detectada no setor NE do Talhão 1 — recomenda-se vistoria' },
              { icon: '📊', text: 'Histórico de 3 safras disponível para comparação' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-sm flex-shrink-0">
                  {icon}
                </div>
                <p className="text-xs text-stone-500 leading-relaxed mt-1">{text}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
