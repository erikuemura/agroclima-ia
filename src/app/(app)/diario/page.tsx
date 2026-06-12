'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { ClipboardList, Plus, Trash2 } from 'lucide-react'
import { getDemoProfileClient } from '@/lib/demo-profiles'
import {
  readDiary, writeDiary, readStock, writeStockItems, readStockMovements, writeStockMovements,
  DIARY_TYPE_META, type DiaryEvent, type DiaryEventType, type StockItem,
} from '@/lib/stores'

const TYPES: DiaryEventType[] = ['plantio', 'pulverização', 'adubação', 'irrigação', 'colheita', 'monitoramento', 'outro']

export default function DiarioPage() {
  const profile = getDemoProfileClient()
  const fields = [...new Set(profile.crops.map(c => c.field))]

  const [events, setEvents] = useState<DiaryEvent[]>([])
  const [stock, setStock] = useState<StockItem[]>([])
  const [fieldFilter, setFieldFilter] = useState<string>('todos')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    type: 'pulverização' as DiaryEventType,
    date: new Date().toISOString().slice(0, 10),
    field: fields[0] ?? '',
    operator: '',
    machine: '',
    notes: '',
    stockItemId: '',
    stockQty: '',
  })

  useEffect(() => {
    setEvents(readDiary())
    setStock(readStock())
  }, [])

  function addEvent() {
    if (!form.field || !form.date) return
    const event: DiaryEvent = {
      id: String(Date.now()),
      type: form.type,
      date: form.date,
      field: form.field,
      operator: form.operator || '—',
      machine: form.machine || '—',
      notes: form.notes,
      stockItemId: form.stockItemId || undefined,
      stockQty: form.stockQty ? parseFloat(form.stockQty) : undefined,
    }
    const next = [event, ...events].sort((a, b) => b.date.localeCompare(a.date))
    setEvents(next)
    writeDiary(next)

    // Integração com estoque: aplicação dá baixa automática
    if (event.stockItemId && event.stockQty) {
      const items = readStock().map(i =>
        i.id === event.stockItemId ? { ...i, quantity: Math.max(0, +(i.quantity - event.stockQty!).toFixed(2)) } : i
      )
      writeStockItems(items)
      setStock(items)
      const movs = readStockMovements()
      writeStockMovements([
        { id: `m${Date.now()}`, itemId: event.stockItemId, kind: 'aplicação', quantity: event.stockQty, date: event.date, notes: `${event.type} no ${event.field}` },
        ...movs,
      ])
    }

    setShowForm(false)
    setForm({ ...form, operator: '', machine: '', notes: '', stockItemId: '', stockQty: '' })
  }

  function removeEvent(id: string) {
    const next = events.filter(e => e.id !== id)
    setEvents(next)
    writeDiary(next)
  }

  const visible = fieldFilter === 'todos' ? events : events.filter(e => e.field === fieldFilter)

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-stone-800 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-green-700" /> Diário de campo
          </h1>
          <p className="text-sm text-stone-400 mt-0.5">Todas as operações por talhão — {profile.farm.name}</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 bg-green-700 text-white text-xs font-medium px-3.5 py-2 rounded-lg hover:bg-green-800 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Registrar operação
        </button>
      </div>

      {showForm && (
        <Card className="p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as DiaryEventType })}
              className="border border-stone-200 rounded-lg px-2 py-1.5 text-xs">
              {TYPES.map(t => <option key={t} value={t}>{DIARY_TYPE_META[t].emoji} {t}</option>)}
            </select>
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
              className="border border-stone-200 rounded-lg px-2 py-1.5 text-xs" />
            <select value={form.field} onChange={e => setForm({ ...form, field: e.target.value })}
              className="border border-stone-200 rounded-lg px-2 py-1.5 text-xs">
              {fields.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <input placeholder="Operador" value={form.operator} onChange={e => setForm({ ...form, operator: e.target.value })}
              className="border border-stone-200 rounded-lg px-2 py-1.5 text-xs" />
            <input placeholder="Máquina" value={form.machine} onChange={e => setForm({ ...form, machine: e.target.value })}
              className="border border-stone-200 rounded-lg px-2 py-1.5 text-xs" />
            <input placeholder="Observações" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              className="border border-stone-200 rounded-lg px-2 py-1.5 text-xs" />
          </div>

          {(form.type === 'pulverização' || form.type === 'adubação') && (
            <div className="flex gap-2 items-center bg-stone-50 rounded-lg p-2">
              <span className="text-[10px] text-stone-400 flex-shrink-0">Baixa no estoque:</span>
              <select value={form.stockItemId} onChange={e => setForm({ ...form, stockItemId: e.target.value })}
                className="flex-1 border border-stone-200 rounded-lg px-2 py-1.5 text-xs bg-white">
                <option value="">— sem baixa —</option>
                {stock.map(i => <option key={i.id} value={i.id}>{i.name} ({i.quantity}{i.unit})</option>)}
              </select>
              <input placeholder="Qtd" inputMode="decimal" value={form.stockQty}
                onChange={e => setForm({ ...form, stockQty: e.target.value })}
                className="w-16 border border-stone-200 rounded-lg px-2 py-1.5 text-xs bg-white" />
            </div>
          )}

          <button onClick={addEvent}
            className="w-full bg-green-700 text-white text-xs font-medium py-2 rounded-lg hover:bg-green-800 transition-colors">
            Salvar no diário
          </button>
        </Card>
      )}

      {/* Filtro por talhão */}
      <div className="flex gap-1.5 flex-wrap">
        {['todos', ...fields].map(f => (
          <button key={f} onClick={() => setFieldFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              fieldFilter === f ? 'bg-green-700 text-white border-green-700' : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50'
            }`}>
            {f === 'todos' ? 'Todos os talhões' : f}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        {visible.map(e => {
          const meta = DIARY_TYPE_META[e.type]
          return (
            <Card key={e.id} className="p-3.5 flex items-start gap-3">
              <span className="text-xl leading-none mt-0.5">{meta.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${meta.color}`}>{e.type}</span>
                  <span className="text-xs font-medium text-stone-700">{e.field}</span>
                  <span className="text-[10px] text-stone-400">{new Date(e.date + 'T12:00').toLocaleDateString('pt-BR')}</span>
                </div>
                {e.notes && <p className="text-xs text-stone-500 mt-1">{e.notes}</p>}
                <p className="text-[10px] text-stone-400 mt-1">
                  Operador: {e.operator} · Máquina: {e.machine}
                  {e.stockQty && ' · Baixa de estoque registrada'}
                </p>
              </div>
              <button onClick={() => removeEvent(e.id)} className="text-stone-300 hover:text-red-500 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </Card>
          )
        })}
        {visible.length === 0 && (
          <p className="text-sm text-stone-400 text-center py-10">Nenhuma operação registrada neste talhão.</p>
        )}
      </div>
    </div>
  )
}
