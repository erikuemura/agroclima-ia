'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { FlaskConical, Loader2, Sparkles, Satellite } from 'lucide-react'
import type { SoilData } from '@/types'
import { getDemoProfileClient } from '@/lib/demo-profiles'

const CROPS = ['Soja', 'Milho', 'Algodão', 'Sorgo', 'Feijão', 'Arroz', 'Trigo', 'Café', 'Cana-de-açúcar', 'Pastagem']
const TEXTURES: SoilData['texture'][] = ['argilosa', 'areno-argilosa', 'arenosa', 'média']

const defaultForm: SoilData = {
  ph: 5.8,
  nitrogen: 22,
  phosphorus: 18,
  potassium: 120,
  organicMatter: 2.5,
  texture: 'argilosa',
  crop: 'Soja',
}

function FieldRow({ label, unit, children }: { label: string; unit?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-stone-600">
        {label}{unit && <span className="text-stone-400 ml-1">({unit})</span>}
      </label>
      {children}
    </div>
  )
}

export default function SoloPage() {
  const profile = getDemoProfileClient()
  const [form, setForm] = useState<SoilData>(defaultForm)
  const [analysis, setAnalysis] = useState('')
  const [loading, setLoading] = useState(false)
  const [soilGridLoading, setSoilGridLoading] = useState(false)
  const [soilGridSource, setSoilGridSource] = useState<string | null>(null)

  const set = (key: keyof SoilData, val: string | number) =>
    setForm(f => ({ ...f, [key]: val }))

  async function fillFromSatellite() {
    setSoilGridLoading(true)
    try {
      const res = await fetch(`/api/soil-grid?lat=${profile.farm.lat}&lon=${profile.farm.lon}`)
      if (res.ok) {
        const data = await res.json()
        setForm(f => ({ ...f, ...data.formValues, crop: f.crop }))
        setSoilGridSource(`${data.source} · pH ${data.ph} · ${data.texture}`)
      }
    } finally {
      setSoilGridLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setAnalysis('')
    try {
      const res = await fetch('/api/soil-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      setAnalysis(data.analysis)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-lg font-semibold text-stone-800 flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-stone-500" />
          Análise de solo com IA
        </h1>
        <p className="text-sm text-stone-400 mt-0.5">
          Insira os dados do laudo e receba recomendações de calagem, gessagem e adubação
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-stone-700">Dados da análise</h3>
            <button
              type="button"
              onClick={fillFromSatellite}
              disabled={soilGridLoading}
              className="flex items-center gap-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
            >
              {soilGridLoading
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <Satellite className="w-3 h-3" />}
              Preencher pelo satélite
            </button>
          </div>
          {soilGridSource && (
            <p className="text-[10px] text-purple-500 bg-purple-50 rounded-lg px-3 py-1.5 mb-3">
              🛰️ {soilGridSource}
            </p>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FieldRow label="pH" unit="H₂O">
                <input
                  type="number" step="0.1" min="3" max="9"
                  value={form.ph}
                  onChange={e => set('ph', parseFloat(e.target.value))}
                  className="border border-stone-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </FieldRow>
              <FieldRow label="Matéria Orgânica" unit="%">
                <input
                  type="number" step="0.1" min="0" max="10"
                  value={form.organicMatter}
                  onChange={e => set('organicMatter', parseFloat(e.target.value))}
                  className="border border-stone-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </FieldRow>
              <FieldRow label="Nitrogênio (N)" unit="mg/kg">
                <input
                  type="number" step="1" min="0"
                  value={form.nitrogen}
                  onChange={e => set('nitrogen', parseInt(e.target.value))}
                  className="border border-stone-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </FieldRow>
              <FieldRow label="Fósforo (P)" unit="mg/kg">
                <input
                  type="number" step="1" min="0"
                  value={form.phosphorus}
                  onChange={e => set('phosphorus', parseInt(e.target.value))}
                  className="border border-stone-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </FieldRow>
              <FieldRow label="Potássio (K)" unit="mg/kg">
                <input
                  type="number" step="1" min="0"
                  value={form.potassium}
                  onChange={e => set('potassium', parseInt(e.target.value))}
                  className="border border-stone-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </FieldRow>
              <FieldRow label="Textura">
                <select
                  value={form.texture}
                  onChange={e => set('texture', e.target.value as SoilData['texture'])}
                  className="border border-stone-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                >
                  {TEXTURES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </FieldRow>
            </div>
            <FieldRow label="Cultura pretendida">
              <select
                value={form.crop}
                onChange={e => set('crop', e.target.value)}
                className="border border-stone-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                {CROPS.map(c => <option key={c}>{c}</option>)}
              </select>
            </FieldRow>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-700 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-green-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {loading ? 'Analisando...' : 'Gerar laudo com IA'}
            </button>
          </form>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-medium text-stone-700 mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-green-600" />
            Laudo gerado pela IA
          </h3>
          {!analysis && !loading && (
            <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center">
                <FlaskConical className="w-6 h-6 text-stone-400" />
              </div>
              <p className="text-sm text-stone-400">Preencha os dados e clique em gerar laudo</p>
            </div>
          )}
          {loading && (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
              <p className="text-sm text-stone-400">Analisando dados e gerando recomendações...</p>
            </div>
          )}
          {analysis && (
            <div className="prose prose-sm prose-stone max-w-none text-sm leading-relaxed whitespace-pre-wrap text-stone-700">
              {analysis}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
