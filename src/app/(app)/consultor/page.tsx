'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Briefcase, Activity, AlertTriangle, Send, ChevronRight } from 'lucide-react'
import { DEMO_PROFILES, type DemoProfileId } from '@/lib/demo-profiles'
import type { Insight, HealthScore } from '@/types'
import { readStore, writeStore } from '@/lib/stores'

interface FarmSnapshot {
  id: DemoProfileId
  healthScore: HealthScore
  insights: Insight[]
}

interface Recommendation {
  id: string
  farmId: DemoProfileId
  text: string
  date: string
}

const FARM_IDS: DemoProfileId[] = ['pequeno', 'medio', 'grande']

const levelColor: Record<HealthScore['level'], string> = {
  'ótimo': 'text-green-700 bg-green-50 border-green-200',
  'bom': 'text-lime-700 bg-lime-50 border-lime-200',
  'atenção': 'text-amber-600 bg-amber-50 border-amber-200',
  'crítico': 'text-red-600 bg-red-50 border-red-200',
}

export default function ConsultorPage() {
  const [snapshots, setSnapshots] = useState<Record<string, FarmSnapshot>>({})
  const [loading, setLoading] = useState(true)
  const [recFor, setRecFor] = useState<DemoProfileId | null>(null)
  const [recText, setRecText] = useState('')
  const [recs, setRecs] = useState<Recommendation[]>([])

  useEffect(() => {
    setRecs(readStore<Recommendation>('consultant_recs', () => []))
    Promise.allSettled(
      FARM_IDS.map(id =>
        fetch(`/api/insights?profile=${id}`).then(r => r.json()).then(d => ({ id, healthScore: d.healthScore, insights: d.insights }))
      )
    ).then(results => {
      const map: Record<string, FarmSnapshot> = {}
      results.forEach(r => { if (r.status === 'fulfilled') map[r.value.id] = r.value })
      setSnapshots(map)
      setLoading(false)
    })
  }, [])

  function sendRec() {
    if (!recFor || !recText.trim()) return
    const rec: Recommendation = {
      id: String(Date.now()), farmId: recFor, text: recText.trim(),
      date: new Date().toISOString().slice(0, 10),
    }
    const next = [rec, ...recs]
    setRecs(next)
    writeStore('consultant_recs', next)
    setRecFor(null); setRecText('')
  }

  const totalP1 = Object.values(snapshots).reduce(
    (s, f) => s + f.insights.filter(i => i.priority === 1).length, 0)

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h1 className="text-lg font-semibold text-stone-800 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-green-700" /> Modo consultor
        </h1>
        <p className="text-sm text-stone-400 mt-0.5">
          Visão consolidada das fazendas atendidas · {FARM_IDS.length} propriedades
          {totalP1 > 0 && <span className="text-red-500 font-medium"> · {totalP1} alerta(s) P1</span>}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
          {FARM_IDS.map(id => <div key={id} className="h-48 bg-stone-100 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FARM_IDS.map(id => {
            const profile = DEMO_PROFILES[id]
            const snap = snapshots[id]
            const p1 = snap?.insights.filter(i => i.priority === 1) ?? []
            return (
              <Card key={id} className="p-4 flex flex-col">
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="w-9 h-9 rounded-lg bg-green-100 text-green-800 text-xs font-semibold flex items-center justify-center">
                    {profile.avatar}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">{profile.farm.name}</p>
                    <p className="text-[10px] text-stone-400">{profile.farm.city}/{profile.farm.state} · {profile.farm.hectares.toLocaleString('pt-BR')} ha</p>
                  </div>
                </div>

                {snap ? (
                  <>
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border mb-3 ${levelColor[snap.healthScore.level]}`}>
                      <Activity className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm font-semibold">{snap.healthScore.total}/100</span>
                      <span className="text-xs capitalize ml-auto">{snap.healthScore.level}</span>
                    </div>

                    <div className="space-y-1.5 flex-1">
                      {snap.insights.slice(0, 3).map(i => (
                        <div key={i.id} className="flex items-start gap-1.5">
                          <AlertTriangle className={`w-3 h-3 mt-0.5 flex-shrink-0 ${
                            i.severity === 'danger' ? 'text-red-500' : i.severity === 'warning' ? 'text-amber-500' : 'text-blue-400'
                          }`} />
                          <p className="text-[11px] text-stone-500 leading-snug">{i.title}</p>
                        </div>
                      ))}
                      {snap.insights.length === 0 && (
                        <p className="text-[11px] text-stone-400">Sem alertas ativos ✅</p>
                      )}
                    </div>

                    {p1.length > 0 && (
                      <p className="text-[10px] text-red-500 font-medium mt-2">{p1.length} alerta(s) prioridade máxima</p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-stone-400 flex-1">Dados indisponíveis</p>
                )}

                <button onClick={() => setRecFor(recFor === id ? null : id)}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-medium text-green-700 border border-green-200 bg-green-50 hover:bg-green-100 rounded-lg py-2 transition-colors">
                  <Send className="w-3 h-3" /> Enviar recomendação
                </button>

                {recFor === id && (
                  <div className="flex gap-1.5 mt-2">
                    <input value={recText} onChange={e => setRecText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendRec()} autoFocus
                      placeholder="Recomendação para o produtor…"
                      className="flex-1 min-w-0 border border-stone-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500" />
                    <button onClick={sendRec}
                      className="bg-green-700 text-white text-xs px-2.5 rounded-lg hover:bg-green-800">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Recomendações enviadas */}
      {recs.length > 0 && (
        <Card className="p-4">
          <h3 className="text-xs font-medium text-stone-600 mb-2">Recomendações enviadas</h3>
          <div className="space-y-1.5">
            {recs.slice(0, 10).map(r => (
              <div key={r.id} className="flex items-center gap-2 text-xs text-stone-500 py-1.5 border-b border-stone-50 last:border-0">
                <span className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full flex-shrink-0">
                  {DEMO_PROFILES[r.farmId].farm.name}
                </span>
                <span className="flex-1 truncate">{r.text}</span>
                <span className="text-stone-300 flex-shrink-0">{new Date(r.date + 'T12:00').toLocaleDateString('pt-BR')}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
