'use client'

import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Plus, X, Edit2, Sprout, TrendingUp, CalendarDays, FileText } from 'lucide-react'
import {
  CropEntry, CropStatus, PHASE_OPTIONS, CROP_OPTIONS,
} from '@/lib/crops-store'
import { fieldsFromProfile } from '@/lib/fields-data'
import { getDemoProfileClient } from '@/lib/demo-profiles'

// Converte as culturas do perfil ativo no formato do CRUD
function cropsFromProfile(): CropEntry[] {
  const p = getDemoProfileClient()
  return p.crops.map(c => ({
    id: c.id,
    name: c.name,
    variety: '',
    emoji: c.emoji,
    fieldId: c.id,
    fieldName: c.field,
    hectares: c.hectares,
    plantedAt: c.plantedAt,
    harvestAt: c.harvestAt,
    phase: c.phase,
    phasePercent: c.phasePercent,
    status: c.status,
    expectedYield: c.name.toLowerCase().includes('milho') ? 105 : 60,
    notes: '',
    season: '25/26',
  }))
}

const statusColor: Record<CropStatus, string> = {
  normal:    'bg-green-100 text-green-800',
  attention: 'bg-amber-100 text-amber-800',
  critical:  'bg-red-100 text-red-800',
}
const statusLabel: Record<CropStatus, string> = {
  normal: 'Normal', attention: 'Atenção', critical: 'Crítico',
}

const BLANK: Omit<CropEntry, 'id'> = {
  name: 'Soja', variety: '', emoji: '🌱', fieldId: 't1', fieldName: 'Talhão 1',
  hectares: 100, plantedAt: '', harvestAt: '', phase: 'Semeadura',
  phasePercent: 0, status: 'normal', expectedYield: 60, notes: '', season: '25/26',
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-stone-600">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'border border-stone-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500 bg-white'

export default function CulturasPage() {
  const FIELDS = useMemo(() => fieldsFromProfile(getDemoProfileClient()), [])
  const [crops, setCrops] = useState<CropEntry[]>(cropsFromProfile)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<CropEntry, 'id'>>(BLANK)

  const set = (k: keyof typeof form, v: string | number) => setForm(f => ({ ...f, [k]: v }))

  function openNew() {
    setForm(BLANK)
    setEditId(null)
    setShowForm(true)
  }

  function openEdit(c: CropEntry) {
    const { id, ...rest } = c
    setForm(rest)
    setEditId(id)
    setShowForm(true)
  }

  function save() {
    if (!form.plantedAt || !form.harvestAt) return
    const cropOpt = CROP_OPTIONS.find(c => c.name === form.name)
    const field = FIELDS.find(f => f.id === form.fieldId)
    const entry = { ...form, emoji: cropOpt?.emoji ?? '🌱', fieldName: field?.name ?? form.fieldName }
    if (editId) {
      setCrops(cs => cs.map(c => c.id === editId ? { ...entry, id: editId } : c))
    } else {
      setCrops(cs => [...cs, { ...entry, id: String(Date.now()) }])
    }
    setShowForm(false)
  }

  function remove(id: string) {
    setCrops(cs => cs.filter(c => c.id !== id))
  }

  const totalHa = crops.reduce((a, c) => a + c.hectares, 0)
  const active = crops.filter(c => c.phasePercent < 100).length

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-stone-800">Minhas culturas</h1>
          <p className="text-sm text-stone-400 mt-0.5">{crops.length} culturas · {active} ativas · {totalHa} ha</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-1.5 text-xs bg-green-700 text-white rounded-lg px-3 py-2 hover:bg-green-800 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Nova cultura
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <Card className="p-5 border-green-200 bg-green-50/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-stone-800">{editId ? 'Editar cultura' : 'Cadastrar nova cultura'}</h3>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-stone-400" /></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <FormField label="Cultura">
              <select value={form.name} onChange={e => { set('name', e.target.value); set('expectedYield', CROP_OPTIONS.find(c => c.name === e.target.value)?.defaultYield ?? 60) }} className={inputCls}>
                {CROP_OPTIONS.map(c => <option key={c.name}>{c.name}</option>)}
              </select>
            </FormField>
            <FormField label="Variedade / híbrido">
              <input value={form.variety} onChange={e => set('variety', e.target.value)} placeholder="ex: Intacta RR2" className={inputCls} />
            </FormField>
            <FormField label="Talhão">
              <select value={form.fieldId} onChange={e => set('fieldId', e.target.value)} className={inputCls}>
                {FIELDS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </FormField>
            <FormField label="Área (ha)">
              <input type="number" min={1} value={form.hectares} onChange={e => set('hectares', +e.target.value)} className={inputCls} />
            </FormField>
            <FormField label="Data de plantio">
              <input type="date" value={form.plantedAt} onChange={e => set('plantedAt', e.target.value)} className={inputCls} />
            </FormField>
            <FormField label="Colheita prevista">
              <input type="date" value={form.harvestAt} onChange={e => set('harvestAt', e.target.value)} className={inputCls} />
            </FormField>
            <FormField label="Fase fenológica">
              <select value={form.phase} onChange={e => set('phase', e.target.value)} className={inputCls}>
                {PHASE_OPTIONS.map(p => <option key={p}>{p}</option>)}
              </select>
            </FormField>
            <FormField label="Progresso da fase (%)">
              <input type="number" min={0} max={100} value={form.phasePercent} onChange={e => set('phasePercent', +e.target.value)} className={inputCls} />
            </FormField>
            <FormField label="Produtiv. esperada (sc/ha)">
              <input type="number" min={0} value={form.expectedYield} onChange={e => set('expectedYield', +e.target.value)} className={inputCls} />
            </FormField>
            <FormField label="Status">
              <select value={form.status} onChange={e => set('status', e.target.value as CropStatus)} className={inputCls}>
                <option value="normal">Normal</option>
                <option value="attention">Atenção</option>
                <option value="critical">Crítico</option>
              </select>
            </FormField>
            <FormField label="Safra">
              <input value={form.season} onChange={e => set('season', e.target.value)} placeholder="ex: 25/26" className={inputCls} />
            </FormField>
          </div>
          <FormField label="Observações">
            <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Variedade, histórico, tratamentos..." className={cn(inputCls, 'resize-none')} />
          </FormField>
          <div className="flex gap-2 mt-4">
            <button onClick={save} className="bg-green-700 text-white rounded-lg px-4 py-2 text-sm hover:bg-green-800 transition-colors">
              {editId ? 'Salvar alterações' : 'Cadastrar cultura'}
            </button>
            <button onClick={() => setShowForm(false)} className="border border-stone-200 rounded-lg px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 transition-colors">Cancelar</button>
          </div>
        </Card>
      )}

      {/* Cards de culturas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {crops.map(crop => {
          const planted = new Date(crop.plantedAt + 'T12:00')
          const harvest = new Date(crop.harvestAt + 'T12:00')
          const totalDays = Math.max(1, (harvest.getTime() - planted.getTime()) / 86400000)
          const elapsed = Math.max(0, (Date.now() - planted.getTime()) / 86400000)
          const daysLeft = Math.max(0, Math.ceil((harvest.getTime() - Date.now()) / 86400000))
          const safraProgress = Math.min(100, Math.round((elapsed / totalDays) * 100))

          return (
            <Card key={crop.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-xl flex-shrink-0">{crop.emoji}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-stone-800">{crop.name}</p>
                      <Badge className={cn('text-[10px] px-1.5 py-0', statusColor[crop.status])}>{statusLabel[crop.status]}</Badge>
                    </div>
                    <p className="text-xs text-stone-400">{crop.variety && `${crop.variety} · `}{crop.fieldName} · {crop.hectares} ha</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(crop)} className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors">
                    <Edit2 className="w-3.5 h-3.5 text-stone-400" />
                  </button>
                  <button onClick={() => remove(crop.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                    <X className="w-3.5 h-3.5 text-stone-400 hover:text-red-500" />
                  </button>
                </div>
              </div>

              {/* Progresso da safra */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-stone-500 mb-1">
                  <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> Progresso da safra</span>
                  <span>{safraProgress}% · {daysLeft}d para colheita</span>
                </div>
                <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${safraProgress}%` }} />
                </div>
              </div>

              {/* Fase fenológica */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-stone-500 mb-1">
                  <span className="flex items-center gap-1"><Sprout className="w-3 h-3" /> {crop.phase}</span>
                  <span>{crop.phasePercent}%</span>
                </div>
                <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${crop.phasePercent}%` }} />
                </div>
              </div>

              {/* Métricas */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-stone-50 rounded-lg p-2 text-center">
                  <p className="text-[10px] text-stone-400">Plantio</p>
                  <p className="text-xs font-medium text-stone-700">{planted.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</p>
                </div>
                <div className="bg-stone-50 rounded-lg p-2 text-center">
                  <p className="text-[10px] text-stone-400">Colheita prev.</p>
                  <p className="text-xs font-medium text-stone-700">{harvest.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</p>
                </div>
                <div className="bg-stone-50 rounded-lg p-2 text-center">
                  <p className="text-[10px] text-stone-400 flex items-center justify-center gap-0.5"><TrendingUp className="w-2.5 h-2.5" /> Produtiv.</p>
                  <p className="text-xs font-medium text-stone-700">{crop.expectedYield} sc/ha</p>
                </div>
              </div>

              {crop.notes && (
                <div className="flex items-start gap-1.5 text-[11px] text-stone-400 bg-stone-50 rounded-lg px-2.5 py-2">
                  <FileText className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>{crop.notes}</span>
                </div>
              )}
            </Card>
          )
        })}

        {/* Adicionar */}
        <button onClick={openNew} className="border-2 border-dashed border-stone-200 rounded-xl flex flex-col items-center justify-center gap-2 min-h-[200px] text-stone-400 hover:bg-stone-50 hover:border-stone-300 transition-colors cursor-pointer">
          <div className="w-10 h-10 rounded-full border-2 border-dashed border-stone-300 flex items-center justify-center">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-sm">Cadastrar nova cultura</span>
        </button>
      </div>
    </div>
  )
}
