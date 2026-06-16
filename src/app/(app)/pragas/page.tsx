'use client'

import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import {
  Bug, Search, BookOpen, ClipboardList, Stethoscope, Bot, Camera,
  ChevronDown, ChevronUp, Plus, Trash2, AlertTriangle, CheckCircle2, Leaf, FlaskConical, Sprout,
} from 'lucide-react'
import { getDemoProfileClient } from '@/lib/demo-profiles'
import {
  PESTS, pestsForCrop, pestById, searchPests, pestsRelevantNow,
  SEVERITY_META, type Pest,
} from '@/lib/pests'
import {
  readPestObservations, writePestObservations, readDiary, writeDiary,
  type PestObservation, type DiaryEvent,
} from '@/lib/stores'

type Tab = 'biblioteca' | 'diagnostico' | 'monitoramento'

const KIND_META = {
  praga:   { label: 'Praga', cls: 'bg-orange-100 text-orange-700' },
  doença:  { label: 'Doença', cls: 'bg-purple-100 text-purple-700' },
}

export default function PragasPage() {
  const router = useRouter()
  const profile = useMemo(() => getDemoProfileClient(), [])
  const cropNames = useMemo(() => [...new Set(profile.crops.map(c => c.name))], [profile])
  const [tab, setTab] = useState<Tab>('biblioteca')

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h1 className="text-lg font-semibold text-stone-800 flex items-center gap-2">
          <Bug className="w-5 h-5 text-green-700" /> Pragas e doenças
        </h1>
        <p className="text-sm text-stone-400 mt-0.5">Identifique, monitore e maneje os riscos fitossanitários da sua lavoura</p>
      </div>

      {/* Abas */}
      <div className="flex gap-1.5 flex-wrap">
        {([
          { id: 'biblioteca', label: 'Biblioteca', icon: BookOpen },
          { id: 'diagnostico', label: 'Diagnóstico', icon: Stethoscope },
          { id: 'monitoramento', label: 'Monitoramento', icon: ClipboardList },
        ] as { id: Tab; label: string; icon: typeof BookOpen }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-lg border transition-colors ${
              tab === t.id ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50'
            }`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'biblioteca' && <Biblioteca cropNames={cropNames} router={router} />}
      {tab === 'diagnostico' && <Diagnostico cropNames={cropNames} router={router} />}
      {tab === 'monitoramento' && <Monitoramento profile={profile} />}
    </div>
  )
}

// ── Card de praga expansível (reutilizado) ───────────────────
function PestCard({ pest, router, defaultOpen = false }: { pest: Pest; router: ReturnType<typeof useRouter>; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const sev = SEVERITY_META[pest.severity]
  const kind = KIND_META[pest.kind]

  function askAI() {
    const q = `Tenho suspeita de ${pest.name} (${pest.scientificName}) na minha lavoura. Como confirmo a identificação e qual o melhor manejo agora?`
    router.push(`/assistente?q=${encodeURIComponent(q)}`)
  }

  return (
    <Card className="overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-stone-50 transition-colors">
        <span className="text-2xl leading-none flex-shrink-0">{pest.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-stone-800">{pest.name}</p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${kind.cls}`}>{kind.label}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${sev.cls}`}>{sev.label}</span>
          </div>
          <p className="text-[11px] text-stone-400 italic">{pest.scientificName}</p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-stone-100 pt-3">
          <Section icon={<Search className="w-3.5 h-3.5" />} title="Como identificar">
            <ul className="space-y-1">
              {pest.symptoms.map((s, i) => <li key={i} className="text-xs text-stone-600 flex gap-1.5"><span className="text-stone-300">•</span>{s}</li>)}
            </ul>
          </Section>

          <Section icon={<AlertTriangle className="w-3.5 h-3.5" />} title="Dano">
            <p className="text-xs text-stone-600 leading-relaxed">{pest.damage}</p>
          </Section>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-wide text-amber-700 font-medium mb-1">Nível de controle (quando agir)</p>
            <p className="text-xs text-amber-800 leading-relaxed">{pest.controlLevel}</p>
          </div>

          <Section icon={<Leaf className="w-3.5 h-3.5" />} title="Manejo integrado (MIP)">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <ManejoCol label="Cultural" items={pest.management.cultural} />
              <ManejoCol label="Biológico" items={pest.management.biological} />
              <ManejoCol label="Químico" items={pest.management.chemical} />
            </div>
          </Section>

          <p className="text-[11px] text-stone-400">🌡 Favorável: {pest.favorability}</p>

          <button onClick={askAI}
            className="w-full flex items-center justify-center gap-2 text-xs font-medium text-green-700 border border-green-200 bg-green-50 hover:bg-green-100 rounded-lg py-2 transition-colors">
            <Bot className="w-3.5 h-3.5" /> Tirar dúvidas sobre {pest.name} com o AgroAssistente
          </button>
        </div>
      )}
    </Card>
  )
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-stone-400 font-medium mb-1.5 flex items-center gap-1">{icon}{title}</p>
      {children}
    </div>
  )
}

function ManejoCol({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="bg-stone-50 rounded-lg p-2.5">
      <p className="text-[10px] font-medium text-stone-600 mb-1">{label}</p>
      <ul className="space-y-0.5">
        {items.map((it, i) => <li key={i} className="text-[10px] text-stone-500 leading-snug">· {it}</li>)}
      </ul>
    </div>
  )
}

// ── Aba: Biblioteca ──────────────────────────────────────────
function Biblioteca({ cropNames, router }: { cropNames: string[]; router: ReturnType<typeof useRouter> }) {
  const [filter, setFilter] = useState<string>('minhas')
  const [query, setQuery] = useState('')

  const list = useMemo(() => {
    let base: Pest[]
    if (filter === 'todas') base = PESTS
    else if (filter === 'minhas') base = [...new Map(cropNames.flatMap(c => pestsForCrop(c)).map(p => [p.id, p])).values()]
    else base = pestsForCrop(filter)
    if (query.trim()) {
      const q = query.toLowerCase()
      base = base.filter(p => p.name.toLowerCase().includes(q) || p.scientificName.toLowerCase().includes(q) || p.symptoms.some(s => s.toLowerCase().includes(q)))
    }
    return base
  }, [filter, query, cropNames])

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar praga, doença ou sintoma…"
          className="w-full border border-stone-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {[{ id: 'minhas', label: 'Minhas culturas' }, ...cropNames.map(c => ({ id: c, label: c.split(' ')[0] })), { id: 'todas', label: 'Todas' }].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filter === f.id ? 'bg-green-700 text-white border-green-700' : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {list.map(p => <PestCard key={p.id} pest={p} router={router} />)}
        {list.length === 0 && <p className="text-sm text-stone-400 text-center py-8">Nenhuma praga encontrada para este filtro.</p>}
      </div>
    </div>
  )
}

// ── Aba: Diagnóstico guiado ──────────────────────────────────
function Diagnostico({ cropNames, router }: { cropNames: string[]; router: ReturnType<typeof useRouter> }) {
  const [crop, setCrop] = useState(cropNames[0] ?? 'Soja')
  const [symptom, setSymptom] = useState('')
  const results = useMemo(() => searchPests(symptom, crop), [symptom, crop])

  const SYMPTOM_HINTS = ['folha amarela', 'pústula', 'furo na vagem', 'lagarta', 'micélio branco', 'desfolha', 'mancha', 'inseto sugando']

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-stone-600 block mb-1">Cultura</label>
            <select value={crop} onChange={e => setCrop(e.target.value)}
              className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              {cropNames.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-stone-600 block mb-1">O que você está vendo no campo?</label>
            <input value={symptom} onChange={e => setSymptom(e.target.value)} placeholder="ex: lagarta na vagem, folha amarela…"
              className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {SYMPTOM_HINTS.map(h => (
            <button key={h} onClick={() => setSymptom(h)} className="text-[10px] text-stone-500 bg-stone-100 hover:bg-stone-200 px-2 py-1 rounded-full transition-colors">{h}</button>
          ))}
        </div>
      </Card>

      <div className="flex items-center gap-2 text-xs text-stone-400">
        <Stethoscope className="w-3.5 h-3.5" />
        {symptom.trim() ? `${results.length} candidato(s) prováveis para "${symptom}" em ${crop.split(' ')[0]}` : `Pragas e doenças que atacam ${crop.split(' ')[0]}`}
      </div>

      <div className="space-y-2">
        {results.map(p => <PestCard key={p.id} pest={p} router={router} defaultOpen={!!symptom.trim() && results.length <= 2} />)}
        {results.length === 0 && (
          <Card className="p-5 text-center">
            <p className="text-sm text-stone-500 mb-3">Não encontramos correspondência direta. Tente uma foto — o AgroAssistente analisa imagens da lavoura.</p>
            <button onClick={() => router.push('/assistente')}
              className="inline-flex items-center gap-2 text-xs font-medium text-green-700 border border-green-200 bg-green-50 hover:bg-green-100 rounded-lg px-4 py-2 transition-colors">
              <Camera className="w-3.5 h-3.5" /> Enviar foto para diagnóstico
            </button>
          </Card>
        )}
      </div>

      {/* Atalho foto sempre visível */}
      <Card className="p-4 flex items-center gap-3 bg-green-50 border-green-200">
        <Camera className="w-5 h-5 text-green-700 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-stone-800">Não tem certeza?</p>
          <p className="text-xs text-stone-500">Tire uma foto da praga ou da lesão e o AgroAssistente identifica e recomenda o manejo.</p>
        </div>
        <button onClick={() => router.push('/assistente')}
          className="text-xs font-medium text-white bg-green-700 hover:bg-green-800 rounded-lg px-3.5 py-2 transition-colors flex-shrink-0">
          Diagnóstico por foto
        </button>
      </Card>
    </div>
  )
}

// ── Aba: Monitoramento por talhão ────────────────────────────
function Monitoramento({ profile }: { profile: ReturnType<typeof getDemoProfileClient> }) {
  const fields = useMemo(() => [...new Set(profile.crops.map(c => c.field))], [profile])
  const [obs, setObs] = useState<PestObservation[]>(() => readPestObservations())
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    field: fields[0] ?? 'Talhão 1', pestId: PESTS[0].id, level: '', unit: 'por metro', notes: '', aboveThreshold: false,
  })
  const [savedMsg, setSavedMsg] = useState('')

  // Pragas prioritárias agora (pela fase das culturas)
  const priority = useMemo(() => {
    const map = new Map<string, { pest: Pest; field: string; phase: string }>()
    for (const c of profile.crops) {
      for (const p of pestsRelevantNow(c.name, c.phase)) {
        if (!map.has(p.id)) map.set(p.id, { pest: p, field: c.field, phase: c.phase })
      }
    }
    return [...map.values()].slice(0, 4)
  }, [profile])

  function save() {
    const level = parseFloat(form.level.replace(',', '.'))
    if (isNaN(level)) return
    const pest = pestById(form.pestId)!
    const entry: PestObservation = {
      id: String(Date.now()),
      date: new Date().toISOString().slice(0, 10),
      field: form.field,
      pestId: form.pestId,
      pestName: pest.name,
      level,
      unit: form.unit,
      aboveThreshold: form.aboveThreshold,
      notes: form.notes,
    }
    const next = [entry, ...obs]
    setObs(next); writePestObservations(next)

    // Integração: registra no Diário de campo
    const diaryEvent: DiaryEvent = {
      id: `pest-${entry.id}`, type: 'monitoramento', date: entry.date, field: entry.field,
      operator: '—', machine: '—',
      notes: `${pest.name}: ${level} ${form.unit}${form.aboveThreshold ? ' — ACIMA do nível de controle' : ''}${form.notes ? ` · ${form.notes}` : ''}`,
    }
    writeDiary([diaryEvent, ...readDiary()])

    setSavedMsg(form.aboveThreshold ? '⚠️ Registrado e marcado como acima do nível de controle — vai aparecer como alerta no painel.' : 'Registrado no monitoramento e no diário de campo.')
    setTimeout(() => setSavedMsg(''), 6000)
    setForm({ ...form, level: '', notes: '', aboveThreshold: false })
    setShowForm(false)
  }

  function remove(id: string) {
    const next = obs.filter(o => o.id !== id)
    setObs(next); writePestObservations(next)
  }

  return (
    <div className="space-y-4">
      {/* Prioridades da fase atual */}
      {priority.length > 0 && (
        <Card className="p-4">
          <p className="text-xs font-medium text-stone-600 mb-2 flex items-center gap-1.5"><Sprout className="w-3.5 h-3.5 text-green-600" /> Monitorar agora (pela fase das culturas)</p>
          <div className="flex gap-2 flex-wrap">
            {priority.map(({ pest, field }) => (
              <span key={pest.id} className="text-[11px] bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full flex items-center gap-1">
                {pest.emoji} {pest.name} <span className="text-stone-400">· {field}</span>
              </span>
            ))}
          </div>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-stone-500">{obs.length} registro(s) de monitoramento</p>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 bg-green-700 text-white text-xs font-medium px-3.5 py-2 rounded-lg hover:bg-green-800 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Registrar ocorrência
        </button>
      </div>

      {showForm && (
        <Card className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <select value={form.field} onChange={e => setForm({ ...form, field: e.target.value })} className="border border-stone-200 rounded-lg px-2 py-2 text-xs">
              {fields.map(f => <option key={f}>{f}</option>)}
            </select>
            <select value={form.pestId} onChange={e => setForm({ ...form, pestId: e.target.value })} className="border border-stone-200 rounded-lg px-2 py-2 text-xs">
              {PESTS.map(p => <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>)}
            </select>
            <input placeholder="Nível observado" inputMode="decimal" value={form.level} onChange={e => setForm({ ...form, level: e.target.value })}
              className="border border-stone-200 rounded-lg px-2 py-2 text-xs" />
            <input placeholder="Unidade (por metro, %…)" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}
              className="border border-stone-200 rounded-lg px-2 py-2 text-xs" />
          </div>
          <input placeholder="Observações (opcional)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
            className="w-full border border-stone-200 rounded-lg px-2 py-2 text-xs" />
          <label className="flex items-center gap-2 text-xs text-stone-600 cursor-pointer">
            <input type="checkbox" checked={form.aboveThreshold} onChange={e => setForm({ ...form, aboveThreshold: e.target.checked })} className="accent-red-600" />
            Acima do nível de controle (gera alerta no painel)
          </label>
          {/* Mostra o nível de controle da praga selecionada como referência */}
          <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
            📏 Referência: {pestById(form.pestId)?.controlLevel}
          </p>
          <button onClick={save} className="w-full bg-green-700 text-white text-xs font-medium py-2 rounded-lg hover:bg-green-800 transition-colors">
            Salvar registro
          </button>
        </Card>
      )}

      {savedMsg && (
        <div className="flex items-center gap-1.5 text-[11px] text-green-700 bg-green-50 border border-green-200 rounded-lg px-2.5 py-2">
          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" /> {savedMsg}
        </div>
      )}

      <div className="space-y-2">
        {obs.map(o => {
          const pest = pestById(o.pestId)
          return (
            <Card key={o.id} className={`p-3.5 ${o.aboveThreshold ? 'border-red-200 bg-red-50/40' : ''}`}>
              <div className="flex items-start gap-3">
                <span className="text-xl leading-none">{pest?.emoji ?? '🐛'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-stone-800">{o.pestName}</p>
                    <span className="text-xs text-stone-500">{o.field}</span>
                    {o.aboveThreshold && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Acima do controle</span>}
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">Nível: <strong>{o.level} {o.unit}</strong> · {new Date(o.date + 'T12:00').toLocaleDateString('pt-BR')}</p>
                  {o.notes && <p className="text-[11px] text-stone-400 mt-0.5">{o.notes}</p>}
                </div>
                <button onClick={() => remove(o.id)} className="text-stone-300 hover:text-red-500 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>
          )
        })}
        {obs.length === 0 && <p className="text-sm text-stone-400 text-center py-8">Nenhuma ocorrência registrada. Use o pano de batida e registre os níveis por talhão.</p>}
      </div>

      <p className="text-[10px] text-stone-400 flex items-start gap-1">
        <FlaskConical className="w-3 h-3 flex-shrink-0 mt-0.5" />
        Ocorrências marcadas como “acima do controle” viram alerta prioritário no painel da fazenda e ficam registradas no diário de campo.
      </p>
    </div>
  )
}
