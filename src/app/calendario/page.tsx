'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Sparkles, Loader2, CheckCircle2, Circle, Bot } from 'lucide-react'
import { AgriEvent, EventType, EVENT_COLOR, EVENT_ICON, INITIAL_EVENTS } from '@/lib/calendar-data'
import { CROPS } from '@/lib/mock-data'

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

export default function CalendarioPage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [events, setEvents] = useState<AgriEvent[]>(INITIAL_EVENTS)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [view, setView] = useState<'month' | 'list'>('month')

  const days = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()

  const eventsByDate = useMemo(() => {
    const map: Record<string, AgriEvent[]> = {}
    events.forEach(e => { if (!map[e.date]) map[e.date] = []; map[e.date].push(e) })
    return map
  }, [events])

  function prevMonth() { if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1) }
  function nextMonth() { if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1) }
  function dateKey(d: number) { return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` }
  function toggleDone(id: string) { setEvents(evs => evs.map(e => e.id === id ? { ...e, done: !e.done } : e)) }

  async function generateSchedule() {
    const crop = CROPS[0]
    setGenerating(true)
    try {
      const res = await fetch('/api/ai-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crop: crop.name, field: crop.field, plantedAt: crop.plantedAt, harvestAt: crop.harvestAt, currentDate: today.toISOString().split('T')[0] }),
      })
      const newEvents: AgriEvent[] = await res.json()
      setEvents(ev => { const ids = new Set(ev.map(e => e.id)); return [...ev, ...newEvents.filter(e => !ids.has(e.id))] })
    } finally { setGenerating(false) }
  }

  const todayKey = today.toISOString().split('T')[0]
  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] ?? []) : []
  const upcoming = events.filter(e => !e.done && e.date >= todayKey).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8)

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-stone-800">Calendário agrícola</h1>
          <p className="text-sm text-stone-400 mt-0.5">{events.length} eventos · {events.filter(e => !e.done).length} pendentes</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setView(v => v === 'month' ? 'list' : 'month')} className="text-xs border border-stone-200 rounded-lg px-3 py-1.5 hover:bg-stone-50 text-stone-600 transition-colors">
            {view === 'month' ? 'Ver lista' : 'Ver mês'}
          </button>
          <button onClick={generateSchedule} disabled={generating} className="flex items-center gap-1.5 text-xs bg-green-700 text-white rounded-lg px-3 py-1.5 hover:bg-green-800 disabled:opacity-60 transition-colors">
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Gerar cronograma IA
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {view === 'month' ? (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="p-1 hover:bg-stone-100 rounded-lg"><ChevronLeft className="w-4 h-4" /></button>
                <h3 className="text-sm font-semibold text-stone-800">{MONTHS[month]} {year}</h3>
                <button onClick={nextMonth} className="p-1 hover:bg-stone-100 rounded-lg"><ChevronRight className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-7 mb-1">
                {DAYS.map(d => <div key={d} className="text-[10px] text-stone-400 text-center py-1">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {Array(firstDay).fill(null).map((_, i) => <div key={`e${i}`} />)}
                {Array(days).fill(null).map((_, i) => {
                  const d = i + 1
                  const key = dateKey(d)
                  const dayEvents = eventsByDate[key] ?? []
                  const isToday = key === todayKey
                  const isSelected = key === selectedDate
                  return (
                    <button key={d} onClick={() => setSelectedDate(key === selectedDate ? null : key)}
                      className={cn('rounded-lg p-1 min-h-[52px] text-left transition-colors', isToday ? 'bg-green-50 border border-green-200' : 'hover:bg-stone-50', isSelected ? 'ring-2 ring-green-500' : '')}>
                      <span className={cn('text-xs block mb-0.5', isToday ? 'font-bold text-green-700' : 'text-stone-600')}>{d}</span>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 2).map(ev => (
                          <div key={ev.id} className={cn('text-[9px] px-1 py-0.5 rounded truncate border', EVENT_COLOR[ev.type], ev.done ? 'opacity-40' : '')}>
                            {EVENT_ICON[ev.type]} {ev.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && <div className="text-[9px] text-stone-400 px-1">+{dayEvents.length - 2}</div>}
                      </div>
                    </button>
                  )
                })}
              </div>
            </Card>
          ) : (
            <Card className="p-4">
              <h3 className="text-sm font-medium text-stone-700 mb-3">Todos os eventos</h3>
              <div className="space-y-2">
                {events.sort((a, b) => a.date.localeCompare(b.date)).map(ev => (
                  <div key={ev.id} className={cn('flex items-start gap-3 p-3 rounded-lg border', EVENT_COLOR[ev.type], ev.done ? 'opacity-50' : '')}>
                    <button onClick={() => toggleDone(ev.id)} className="mt-0.5 flex-shrink-0">
                      {ev.done ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Circle className="w-4 h-4 text-stone-400" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-stone-800 truncate">{EVENT_ICON[ev.type]} {ev.title}</span>
                        {ev.aiGenerated && <Bot className="w-3 h-3 text-stone-400 flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {new Date(ev.date + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {ev.field && ` · ${ev.field}`}{ev.crop && ` · ${ev.crop}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          {selectedDate && (
            <Card className="p-4">
              <h3 className="text-sm font-medium text-stone-700 mb-3">
                {new Date(selectedDate + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
              </h3>
              {selectedEvents.length === 0 ? (
                <p className="text-xs text-stone-400 text-center py-4">Nenhum evento neste dia</p>
              ) : (
                <div className="space-y-2">
                  {selectedEvents.map(ev => (
                    <div key={ev.id} className={cn('flex items-start gap-2 p-2.5 rounded-lg border', EVENT_COLOR[ev.type])}>
                      <button onClick={() => toggleDone(ev.id)} className="mt-0.5 flex-shrink-0">
                        {ev.done ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Circle className="w-4 h-4 text-stone-400" />}
                      </button>
                      <div>
                        <p className="text-xs font-medium text-stone-800">{EVENT_ICON[ev.type]} {ev.title}</p>
                        {ev.field && <p className="text-[10px] text-stone-500 mt-0.5">{ev.field}{ev.crop && ` · ${ev.crop}`}</p>}
                        {ev.aiGenerated && <p className="text-[10px] text-stone-400 flex items-center gap-1 mt-0.5"><Bot className="w-2.5 h-2.5" /> Sugerido pela IA</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          <Card className="p-4">
            <h3 className="text-sm font-medium text-stone-700 mb-3">Próximos eventos</h3>
            <div className="space-y-2">
              {upcoming.map(ev => (
                <div key={ev.id} className="flex items-start gap-2.5">
                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 border', EVENT_COLOR[ev.type])}>{EVENT_ICON[ev.type]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-stone-800 truncate">{ev.title}</p>
                    <p className="text-[10px] text-stone-400">
                      {new Date(ev.date + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      {ev.field && ` · ${ev.field}`}
                    </p>
                  </div>
                  {ev.aiGenerated && <Bot className="w-3 h-3 text-stone-300 flex-shrink-0 mt-0.5" />}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-xs font-medium text-stone-500 mb-2">Legenda</h3>
            <div className="space-y-1.5">
              {(Object.entries(EVENT_ICON) as [EventType, string][]).map(([type, icon]) => (
                <div key={type} className="flex items-center gap-2">
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded border', EVENT_COLOR[type])}>{icon}</span>
                  <span className="text-xs text-stone-500 capitalize">{type}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 mt-1 pt-1 border-t border-stone-100">
                <Bot className="w-3 h-3 text-stone-400" />
                <span className="text-xs text-stone-400">Gerado pela IA</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
