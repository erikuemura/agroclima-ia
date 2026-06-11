'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Droplets, TrendingDown, TrendingUp, Plus, Loader2, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { FIELDS } from '@/lib/fields-data'
import { FARM } from '@/lib/mock-data'

interface DayBalance {
  date: string
  label: string
  rain: number
  eto: number
  balance: number
}

interface IrrigationRecord {
  id: string
  date: string
  field: string
  lamina: number
  method: string
}

const METHODS = ['Pivô central', 'Gotejamento', 'Aspersão', 'Sulcos', 'Inundação']

const MOCK_BALANCE: DayBalance[] = [
  { date: '04/jun', label: '04/jun', rain: 0, eto: 5.8, balance: -5.8 },
  { date: '05/jun', label: '05/jun', rain: 0, eto: 6.1, balance: -6.1 },
  { date: '06/jun', label: '06/jun', rain: 2.1, eto: 5.5, balance: -3.4 },
  { date: '07/jun', label: '07/jun', rain: 0, eto: 6.3, balance: -6.3 },
  { date: '08/jun', label: '08/jun', rain: 0, eto: 5.9, balance: -5.9 },
  { date: '09/jun', label: '09/jun', rain: 0, eto: 4.2, balance: -4.2 },
  { date: '10/jun', label: 'Hoje', rain: 1.3, eto: 3.8, balance: -2.5 },
]

const INITIAL_RECORDS: IrrigationRecord[] = [
  { id: '1', date: '2026-06-02', field: 'Talhão 2', lamina: 18, method: 'Pivô central' },
  { id: '2', date: '2026-05-20', field: 'Talhão 1', lamina: 22, method: 'Pivô central' },
]

type FieldBalance = {
  id: string
  name: string
  cropName: string | null
  cropEmoji: string | null
  eto7d: number
  rain7d: number
  deficit: number
  recommendation: number
  urgency: 'ok' | 'moderate' | 'critical'
}

function buildFieldBalances(eto7d: number, rain7d: number): FieldBalance[] {
  return FIELDS.map((f, i) => {
    const fieldEto = eto7d * (0.9 + i * 0.08)
    const deficit = Math.max(0, fieldEto - rain7d)
    const rec = Math.ceil(deficit * 0.85)
    return {
      id: f.id,
      name: f.name,
      cropName: f.cropName,
      cropEmoji: f.cropEmoji,
      eto7d: Math.round(fieldEto * 10) / 10,
      rain7d,
      deficit: Math.round(deficit * 10) / 10,
      recommendation: rec,
      urgency: deficit > 25 ? 'critical' : deficit > 12 ? 'moderate' : 'ok',
    }
  })
}

const urgencyStyle = {
  ok:       { badge: 'bg-green-100 text-green-800', bar: 'bg-green-500', icon: <CheckCircle2 className="w-4 h-4 text-green-500" /> },
  moderate: { badge: 'bg-amber-100 text-amber-800', bar: 'bg-amber-400',  icon: <AlertTriangle className="w-4 h-4 text-amber-500" /> },
  critical: { badge: 'bg-red-100 text-red-800',    bar: 'bg-red-500',    icon: <XCircle className="w-4 h-4 text-red-500" /> },
}
const urgencyLabel = { ok: 'Adequado', moderate: 'Moderado', critical: 'Crítico' }

export default function IrrigacaoPage() {
  const [eto7d, setEto7d] = useState(28.1)
  const [rain7d, setRain7d] = useState(1.3)
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState<IrrigationRecord[]>(INITIAL_RECORDS)
  const [showAdd, setShowAdd] = useState(false)
  const [newRec, setNewRec] = useState({ field: FIELDS[0].name, lamina: 20, method: 'Pivô central' })
  const [selectedField, setSelectedField] = useState<string>(FIELDS[0].id)

  useEffect(() => {
    fetch(`/api/weather?lat=${FARM.lat}&lon=${FARM.lon}`)
      .then(r => r.json())
      .then(d => {
        setEto7d(d.current.eto7d ?? 28.1)
        setRain7d(d.current.rain7d ?? 1.3)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const balances = buildFieldBalances(eto7d, rain7d)
  const sel = balances.find(b => b.id === selectedField) ?? balances[0]
  const accumulated7d = MOCK_BALANCE.reduce((a, d) => a + d.rain, 0)
  const eto7dAccum = MOCK_BALANCE.reduce((a, d) => a + d.eto, 0)
  const deficit7d = Math.max(0, eto7dAccum - accumulated7d)

  function addRecord() {
    setRecords(r => [{
      id: String(Date.now()),
      date: new Date().toISOString().split('T')[0],
      ...newRec,
    }, ...r])
    setShowAdd(false)
  }

  const maxBar = Math.max(...MOCK_BALANCE.map(d => Math.abs(d.balance)), 1)

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h1 className="text-lg font-semibold text-stone-800">Irrigação</h1>
        <p className="text-sm text-stone-400 mt-0.5">Balanço hídrico por talhão · dados climáticos em tempo real</p>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'ETo 7 dias', value: loading ? '…' : `${eto7d} mm`, sub: 'Evapotranspiração', icon: <TrendingUp className="w-3.5 h-3.5" />, warn: eto7d > 35 },
          { label: 'Chuva 7 dias', value: loading ? '…' : `${rain7d} mm`, sub: 'Precipitação efetiva', icon: <Droplets className="w-3.5 h-3.5" />, warn: false },
          { label: 'Déficit 7 dias', value: loading ? '…' : `${Math.max(0, eto7d - rain7d).toFixed(1)} mm`, sub: 'Necessidade hídrica', icon: <TrendingDown className="w-3.5 h-3.5" />, warn: (eto7d - rain7d) > 20 },
          { label: 'Lâmina recomendada', value: loading ? '…' : `${Math.ceil(Math.max(0, eto7d - rain7d) * 0.85)} mm`, sub: 'Reposição sugerida', icon: <Droplets className="w-3.5 h-3.5" />, warn: false },
        ].map(({ label, value, sub, icon, warn }) => (
          <div key={label} className={cn('rounded-xl p-4', warn ? 'bg-amber-50' : 'bg-stone-100')}>
            <p className={cn('text-xs flex items-center gap-1 mb-1.5', warn ? 'text-amber-600' : 'text-stone-500')}>{icon}{label}</p>
            <p className={cn('text-2xl font-semibold', warn ? 'text-amber-700' : 'text-stone-800')}>{value}</p>
            <p className="text-xs text-stone-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Balanço diário */}
        <Card className="col-span-2 p-5">
          <h3 className="text-sm font-medium text-stone-700 mb-4">Balanço hídrico diário — 7 dias</h3>
          <div className="flex items-end gap-2 h-32 mb-2">
            {MOCK_BALANCE.map(d => {
              const isNeg = d.balance < 0
              const pct = Math.abs(d.balance) / maxBar * 100
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col justify-end" style={{ height: '80px' }}>
                    <div
                      className={cn('rounded-sm w-full transition-all', isNeg ? 'bg-red-400' : 'bg-blue-400')}
                      style={{ height: `${pct}%` }}
                      title={`${d.balance.toFixed(1)} mm`}
                    />
                  </div>
                  <span className="text-[9px] text-stone-400 text-center leading-tight">{d.label}</span>
                </div>
              )
            })}
          </div>
          <div className="flex gap-4 text-xs text-stone-400">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-400 inline-block" /> Superávit</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" /> Déficit</span>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-stone-100">
            {MOCK_BALANCE.map(d => (
              <div key={d.date} className="flex justify-between text-xs">
                <span className="text-stone-400">{d.label}</span>
                <span className={cn('font-medium', d.balance < 0 ? 'text-red-500' : 'text-blue-500')}>
                  {d.balance > 0 ? '+' : ''}{d.balance.toFixed(1)} mm
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Por talhão */}
        <div className="space-y-3">
          {balances.map(b => {
            const style = urgencyStyle[b.urgency]
            const isSelected = b.id === selectedField
            return (
              <Card
                key={b.id}
                onClick={() => setSelectedField(b.id)}
                className={cn('p-4 cursor-pointer transition-colors', isSelected ? 'ring-2 ring-green-500' : 'hover:bg-stone-50')}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{b.cropEmoji ?? '🟫'}</span>
                    <div>
                      <p className="text-xs font-medium text-stone-800">{b.name}</p>
                      <p className="text-[10px] text-stone-400">{b.cropName ?? 'Sem cultura'}</p>
                    </div>
                  </div>
                  <Badge className={cn('text-[10px]', style.badge)}>{urgencyLabel[b.urgency]}</Badge>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-400">Déficit</span>
                    <span className="font-medium text-stone-700">{b.deficit} mm</span>
                  </div>
                  <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full', style.bar)} style={{ width: `${Math.min(100, (b.deficit / 40) * 100)}%` }} />
                  </div>
                  {b.deficit > 0 && (
                    <p className="text-[10px] text-stone-500">Repor: <strong>{b.recommendation} mm</strong></p>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Histórico de irrigações */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-stone-700">Histórico de irrigações</h3>
          <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 text-xs border border-stone-200 rounded-lg px-3 py-1.5 hover:bg-stone-50 text-stone-600 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Registrar
          </button>
        </div>

        {showAdd && (
          <div className="mb-4 p-3 bg-stone-50 rounded-lg border border-stone-200">
            <p className="text-xs font-medium text-stone-600 mb-3">Nova irrigação</p>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="text-xs text-stone-500 block mb-1">Talhão</label>
                <select value={newRec.field} onChange={e => setNewRec(r => ({ ...r, field: e.target.value }))}
                  className="w-full border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-green-500">
                  {FIELDS.map(f => <option key={f.id}>{f.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-stone-500 block mb-1">Lâmina (mm)</label>
                <input type="number" min={1} value={newRec.lamina} onChange={e => setNewRec(r => ({ ...r, lamina: +e.target.value }))}
                  className="w-full border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-green-500" />
              </div>
              <div>
                <label className="text-xs text-stone-500 block mb-1">Método</label>
                <select value={newRec.method} onChange={e => setNewRec(r => ({ ...r, method: e.target.value }))}
                  className="w-full border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-green-500">
                  {METHODS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <button onClick={addRecord} className="bg-green-700 text-white rounded-lg px-3 py-1.5 text-xs hover:bg-green-800 transition-colors">Salvar</button>
          </div>
        )}

        <div className="space-y-2">
          {records.map(r => (
            <div key={r.id} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Droplets className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-800">{r.field}</p>
                  <p className="text-xs text-stone-400">{r.method}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-blue-600">{r.lamina} mm</p>
                <p className="text-xs text-stone-400">
                  {new Date(r.date + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
