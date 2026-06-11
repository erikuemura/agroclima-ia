'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Wind, Droplets, Thermometer, Sparkles, Loader2, CheckCircle2, XCircle, AlertTriangle, Plus } from 'lucide-react'
import { CROPS } from '@/lib/mock-data'

interface SprayRec {
  windowStatus: 'aberta' | 'restrita' | 'fechada'
  windowReason: string
  bestTime: string
  products: { name: string; type: string; dose: string; interval: string }[]
  precautions: string[]
  tip: string
}

interface SprayRecord {
  id: string
  date: string
  crop: string
  field: string
  product: string
  dose: string
  area: number
  problem: string
}

const INITIAL_RECORDS: SprayRecord[] = [
  { id: '1', date: '2026-05-28', crop: 'Soja safra 25/26', field: 'Talhão 1', product: 'Priori Xtra', dose: '300 ml/ha', area: 420, problem: 'Ferrugem asiática' },
  { id: '2', date: '2026-05-10', crop: 'Soja safra 25/26', field: 'Talhão 1', product: 'Engeo Pleno', dose: '150 ml/ha', area: 420, problem: 'Percevejo marrom' },
]

const PROBLEMS = ['Ferrugem asiática', 'Cercospora', 'Oídio', 'Percevejos', 'Lagarta-da-soja', 'Mosca-branca', 'Ácaros', 'Plantas daninhas', 'Outro']

const windowStyle: Record<string, string> = {
  aberta:   'bg-green-50 border-green-200 text-green-800',
  restrita: 'bg-amber-50 border-amber-200 text-amber-800',
  fechada:  'bg-red-50 border-red-200 text-red-800',
}
const windowIcon: Record<string, React.ReactNode> = {
  aberta:   <CheckCircle2 className="w-5 h-5 text-green-600" />,
  restrita: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  fechada:  <XCircle className="w-5 h-5 text-red-500" />,
}
const windowLabel: Record<string, string> = {
  aberta: 'Janela aberta',
  restrita: 'Janela restrita',
  fechada: 'Janela fechada',
}

export default function PulverizacaoPage() {
  const [windSpeed, setWindSpeed] = useState(12)
  const [humidity, setHumidity] = useState(65)
  const [temp, setTemp] = useState(28)
  const [cropId, setCropId] = useState('0')
  const [problem, setProblem] = useState('Ferrugem asiática')
  const [rec, setRec] = useState<SprayRec | null>(null)
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState<SprayRecord[]>(INITIAL_RECORDS)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newRecord, setNewRecord] = useState({ product: '', dose: '', area: '420', problem: '' })

  const crop = CROPS[parseInt(cropId)]

  // local window calculation (no API needed)
  const localWindow: SprayRec['windowStatus'] =
    windSpeed > 20 || humidity < 50 ? 'fechada'
    : windSpeed > 15 || humidity < 60 ? 'restrita'
    : 'aberta'

  async function getAiRec() {
    setLoading(true)
    try {
      const res = await fetch('/api/ai-spray', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ windSpeed, humidity, temp, crop: crop.name, phase: crop.phase, problem }),
      })
      setRec(await res.json())
    } finally {
      setLoading(false)
    }
  }

  function addRecord() {
    if (!newRecord.product) return
    const record: SprayRecord = {
      id: String(Date.now()),
      date: new Date().toISOString().split('T')[0],
      crop: crop.name,
      field: crop.field,
      product: newRecord.product,
      dose: newRecord.dose,
      area: parseInt(newRecord.area) || crop.hectares,
      problem: newRecord.problem || problem,
    }
    setRecords(r => [record, ...r])
    setNewRecord({ product: '', dose: '', area: '420', problem: '' })
    setShowAddForm(false)
  }

  const displayWindow = rec?.windowStatus ?? localWindow

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h1 className="text-lg font-semibold text-stone-800">Pulverização inteligente</h1>
        <p className="text-sm text-stone-400 mt-0.5">Janela segura de aplicação e recomendações por IA</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Painel de condições */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <h3 className="text-sm font-medium text-stone-700 mb-4">Condições atuais</h3>
            <div className="space-y-4">
              {/* Vento */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-stone-500 flex items-center gap-1.5"><Wind className="w-3.5 h-3.5" /> Velocidade do vento</span>
                  <span className="text-sm font-semibold text-stone-800">{windSpeed} km/h</span>
                </div>
                <input type="range" min={0} max={40} step={1} value={windSpeed} onChange={e => setWindSpeed(+e.target.value)} className="w-full" />
                <div className="flex justify-between text-[10px] text-stone-400 mt-0.5">
                  <span>0 km/h</span><span className="text-green-600">Ideal: 5–15</span><span>40 km/h</span>
                </div>
              </div>
              {/* Umidade */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-stone-500 flex items-center gap-1.5"><Droplets className="w-3.5 h-3.5" /> Umidade relativa</span>
                  <span className="text-sm font-semibold text-stone-800">{humidity}%</span>
                </div>
                <input type="range" min={30} max={100} step={1} value={humidity} onChange={e => setHumidity(+e.target.value)} className="w-full" />
                <div className="flex justify-between text-[10px] text-stone-400 mt-0.5">
                  <span>30%</span><span className="text-green-600">Ideal: ≥60%</span><span>100%</span>
                </div>
              </div>
              {/* Temperatura */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-stone-500 flex items-center gap-1.5"><Thermometer className="w-3.5 h-3.5" /> Temperatura</span>
                  <span className="text-sm font-semibold text-stone-800">{temp}°C</span>
                </div>
                <input type="range" min={10} max={45} step={1} value={temp} onChange={e => setTemp(+e.target.value)} className="w-full" />
                <div className="flex justify-between text-[10px] text-stone-400 mt-0.5">
                  <span>10°C</span><span className="text-green-600">Ideal: 15–30°C</span><span>45°C</span>
                </div>
              </div>
            </div>

            {/* Janela calculada */}
            <div className={cn('mt-4 flex items-center gap-3 p-3 rounded-xl border', windowStyle[displayWindow])}>
              {windowIcon[displayWindow]}
              <div>
                <p className="text-sm font-semibold">{windowLabel[displayWindow]}</p>
                <p className="text-xs mt-0.5 opacity-80">
                  {rec?.windowReason ?? (
                    localWindow === 'aberta' ? 'Vento e umidade dentro do ideal para aplicação'
                    : localWindow === 'restrita' ? 'Condições limítrofes — aplique com cautela e bicos adequados'
                    : 'Condições desfavoráveis — risco de deriva ou evaporação'
                  )}
                </p>
                {rec?.bestTime && <p className="text-xs mt-1 font-medium">Melhor horário: {rec.bestTime}</p>}
              </div>
            </div>
          </Card>

          {/* Formulário IA */}
          <Card className="p-5">
            <h3 className="text-sm font-medium text-stone-700 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-green-600" /> Recomendação de produtos por IA
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-stone-500 block mb-1">Cultura</label>
                <select value={cropId} onChange={e => setCropId(e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
                  {CROPS.map((c, i) => <option key={c.id} value={i}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-stone-500 block mb-1">Problema / alvo</label>
                <select value={problem} onChange={e => setProblem(e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
                  {PROBLEMS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <button onClick={getAiRec} disabled={loading} className="w-full bg-green-700 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-green-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {loading ? 'Analisando condições...' : 'Gerar recomendação'}
            </button>

            {rec && (
              <div className="mt-4 space-y-3">
                {rec.products.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-stone-600 mb-2">Produtos recomendados</p>
                    <div className="space-y-2">
                      {rec.products.map((p, i) => (
                        <div key={i} className="flex items-start justify-between p-3 bg-stone-50 rounded-lg border border-stone-100">
                          <div>
                            <p className="text-sm font-medium text-stone-800">{p.name}</p>
                            <p className="text-xs text-stone-500 mt-0.5">{p.type} · {p.dose}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">{p.interval}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {rec.precautions.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs font-medium text-amber-800 mb-1">Precauções</p>
                    <ul className="space-y-0.5">
                      {rec.precautions.map((p, i) => <li key={i} className="text-xs text-amber-700">· {p}</li>)}
                    </ul>
                  </div>
                )}
                {rec.tip && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-xs text-green-800">💡 {rec.tip}</p>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Histórico */}
        <div>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-stone-700">Histórico de aplicações</h3>
              <button onClick={() => setShowAddForm(!showAddForm)} className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors">
                <Plus className="w-4 h-4 text-stone-600" />
              </button>
            </div>

            {showAddForm && (
              <div className="mb-4 p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-2">
                <p className="text-xs font-medium text-stone-600">Registrar aplicação</p>
                <input placeholder="Produto" value={newRecord.product} onChange={e => setNewRecord(r => ({ ...r, product: e.target.value }))}
                  className="w-full border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-green-500" />
                <input placeholder="Dose (ex: 300 ml/ha)" value={newRecord.dose} onChange={e => setNewRecord(r => ({ ...r, dose: e.target.value }))}
                  className="w-full border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-green-500" />
                <input placeholder="Problema tratado" value={newRecord.problem} onChange={e => setNewRecord(r => ({ ...r, problem: e.target.value }))}
                  className="w-full border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-green-500" />
                <button onClick={addRecord} className="w-full bg-green-700 text-white rounded-lg py-1.5 text-xs hover:bg-green-800 transition-colors">
                  Salvar registro
                </button>
              </div>
            )}

            <div className="space-y-3">
              {records.map(r => (
                <div key={r.id} className="border-b border-stone-100 last:border-0 pb-3 last:pb-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-xs font-medium text-stone-800">{r.product}</p>
                    <span className="text-[10px] text-stone-400">
                      {new Date(r.date + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-500">{r.field} · {r.dose} · {r.area} ha</p>
                  <p className="text-[10px] text-stone-400 mt-0.5">Alvo: {r.problem}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
