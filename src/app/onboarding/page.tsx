'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Leaf, MapPin, Sprout, CheckCircle2, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react'
import { CROP_OPTIONS } from '@/lib/crops-store'

const STATES = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

type Step = 'fazenda' | 'talhao' | 'cultura' | 'pronto'

const STEPS: { key: Step; label: string; icon: React.ReactNode }[] = [
  { key: 'fazenda', label: 'Fazenda', icon: <MapPin className="w-4 h-4" /> },
  { key: 'talhao', label: 'Talhão', icon: <Leaf className="w-4 h-4" /> },
  { key: 'cultura', label: 'Cultura', icon: <Sprout className="w-4 h-4" /> },
  { key: 'pronto', label: 'Pronto', icon: <CheckCircle2 className="w-4 h-4" /> },
]

const inputCls = 'border border-stone-200 rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500 bg-white'

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>('fazenda')
  const [saving, setSaving] = useState(false)

  const [farm, setFarm] = useState({ name: '', city: '', state: 'MT', hectares: 100 })
  const [field, setField] = useState({ name: 'Talhão 1', hectares: 100, soilType: 'Latossolo Vermelho' })
  const [crop, setCrop] = useState({ name: 'Soja', variety: '', plantedAt: '', harvestAt: '', expectedYield: 60 })

  const stepIndex = STEPS.findIndex(s => s.key === step)

  function next() {
    const order: Step[] = ['fazenda', 'talhao', 'cultura', 'pronto']
    const idx = order.indexOf(step)
    if (idx < order.length - 1) setStep(order[idx + 1])
  }

  function back() {
    const order: Step[] = ['fazenda', 'talhao', 'cultura', 'pronto']
    const idx = order.indexOf(step)
    if (idx > 0) setStep(order[idx - 1])
  }

  async function finish() {
    setSaving(true)
    await new Promise(r => setTimeout(r, 1000))
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-stone-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-green-700 flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-stone-800">AgroClima IA</span>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                i < stepIndex ? 'bg-green-700 text-white' :
                i === stepIndex ? 'bg-green-100 text-green-800 border border-green-300' :
                'bg-stone-100 text-stone-400'
              )}>
                {i < stepIndex ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.icon}
                {s.label}
              </div>
              {i < STEPS.length - 1 && <div className={cn('w-6 h-px', i < stepIndex ? 'bg-green-400' : 'bg-stone-200')} />}
            </div>
          ))}
        </div>

        <Card className="p-6">
          {step === 'fazenda' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-stone-800">Dados da fazenda</h2>
                <p className="text-sm text-stone-400 mt-0.5">Vamos configurar sua propriedade</p>
              </div>
              <div>
                <label className="text-xs font-medium text-stone-600 block mb-1">Nome da fazenda</label>
                <input value={farm.name} onChange={e => setFarm(f => ({ ...f, name: e.target.value }))}
                  placeholder="ex: Fazenda São João" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-stone-600 block mb-1">Município</label>
                  <input value={farm.city} onChange={e => setFarm(f => ({ ...f, city: e.target.value }))}
                    placeholder="ex: Sorriso" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-600 block mb-1">Estado</label>
                  <select value={farm.state} onChange={e => setFarm(f => ({ ...f, state: e.target.value }))} className={inputCls}>
                    {STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-stone-600 block mb-1">Área total (ha)</label>
                <input type="number" min={1} value={farm.hectares} onChange={e => setFarm(f => ({ ...f, hectares: +e.target.value }))} className={inputCls} />
              </div>
            </div>
          )}

          {step === 'talhao' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-stone-800">Primeiro talhão</h2>
                <p className="text-sm text-stone-400 mt-0.5">Você pode adicionar mais talhões depois</p>
              </div>
              <div>
                <label className="text-xs font-medium text-stone-600 block mb-1">Nome do talhão</label>
                <input value={field.name} onChange={e => setField(f => ({ ...f, name: e.target.value }))} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-stone-600 block mb-1">Área (ha)</label>
                  <input type="number" min={1} value={field.hectares} onChange={e => setField(f => ({ ...f, hectares: +e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-600 block mb-1">Tipo de solo</label>
                  <input value={field.soilType} onChange={e => setField(f => ({ ...f, soilType: e.target.value }))}
                    placeholder="ex: Latossolo Vermelho" className={inputCls} />
                </div>
              </div>
            </div>
          )}

          {step === 'cultura' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-stone-800">Cultura atual</h2>
                <p className="text-sm text-stone-400 mt-0.5">O que está plantado no {field.name}?</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-stone-600 block mb-1">Cultura</label>
                  <select value={crop.name} onChange={e => {
                    const opt = CROP_OPTIONS.find(c => c.name === e.target.value)
                    setCrop(c => ({ ...c, name: e.target.value, expectedYield: opt?.defaultYield ?? 60 }))
                  }} className={inputCls}>
                    {CROP_OPTIONS.map(c => <option key={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-600 block mb-1">Variedade</label>
                  <input value={crop.variety} onChange={e => setCrop(c => ({ ...c, variety: e.target.value }))}
                    placeholder="ex: Intacta RR2" className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-stone-600 block mb-1">Data de plantio</label>
                  <input type="date" value={crop.plantedAt} onChange={e => setCrop(c => ({ ...c, plantedAt: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-600 block mb-1">Colheita prevista</label>
                  <input type="date" value={crop.harvestAt} onChange={e => setCrop(c => ({ ...c, harvestAt: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-stone-600 block mb-1">Produtividade esperada (sc/ha)</label>
                <input type="number" value={crop.expectedYield} onChange={e => setCrop(c => ({ ...c, expectedYield: +e.target.value }))} className={inputCls} />
              </div>
            </div>
          )}

          {step === 'pronto' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-stone-800">Tudo pronto!</h2>
                <p className="text-sm text-stone-400 mt-1">
                  <strong className="text-stone-700">{farm.name || 'Sua fazenda'}</strong> está configurada.<br />
                  {field.hectares} ha · {crop.name} · {farm.city} — {farm.state}
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-left space-y-1.5">
                <p className="text-xs text-green-800 font-medium">Acesso imediato a:</p>
                {['Previsão do tempo em tempo real', 'Alertas agrícolas por IA', 'Análise de solo com laudo', 'AgroAssistente — chat agrônomo virtual'].map(f => (
                  <p key={f} className="text-xs text-green-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3" /> {f}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Nav buttons */}
          <div className="flex gap-2 mt-6">
            {step !== 'fazenda' && step !== 'pronto' && (
              <button onClick={back} className="flex items-center gap-1.5 border border-stone-200 rounded-lg px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Voltar
              </button>
            )}
            {step !== 'pronto' ? (
              <button onClick={next} className="flex-1 bg-green-700 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-800 transition-colors flex items-center justify-center gap-1.5">
                Continuar <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={finish} disabled={saving} className="flex-1 bg-green-700 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Leaf className="w-4 h-4" />}
                Entrar na plataforma
              </button>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
