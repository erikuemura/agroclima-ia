'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Activity, Bot, Webhook, AlertTriangle, Mail } from 'lucide-react'

interface Lead { at: string; contact?: string; kind?: string; city?: string | null }

interface ClientActivity {
  profile: string
  name: string
  aiMessages: number
  aiImages: number
  aiCostBRL: number
  lastSeen: string | null
  daysSinceLastSeen: number | null
  pageViews: number
  topModules: { path: string; count: number }[]
  churnRisk: 'baixo' | 'médio' | 'alto'
}

interface MpEvent {
  at: string
  email: string
  kind?: string
  status?: string | null
  statusDetail?: string | null
  amount?: number | null
  reason?: string | null
}

const RISK_META = {
  baixo: { label: 'Engajado', cls: 'bg-green-100 text-green-800' },
  médio: { label: 'Atenção', cls: 'bg-amber-100 text-amber-700' },
  alto:  { label: 'Risco de churn', cls: 'bg-red-100 text-red-700' },
}

const MODULE_LABEL: Record<string, string> = {
  '/app': 'Painel', '/assistente': 'AgroAssistente', '/financeiro': 'Financeiro',
  '/diario': 'Diário', '/estoque': 'Estoque', '/planejamento': 'Planejamento',
  '/ndvi': 'NDVI', '/comunidade': 'Comunidade', '/culturas': 'Culturas',
  '/irrigacao': 'Irrigação', '/pulverizacao': 'Pulverização', '/solo': 'Solo',
}

export default function BackofficeAtividadePage() {
  const [clients, setClients] = useState<ClientActivity[]>([])
  const [mpEvents, setMpEvents] = useState<MpEvent[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [source, setSource] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/activity')
      .then(r => r.json())
      .then(d => { setClients(d.clients ?? []); setMpEvents(d.mpEvents ?? []); setLeads(d.leads ?? []); setSource(d.source ?? '') })
      .finally(() => setLoading(false))
  }, [])

  const totalCost = +clients.reduce((s, c) => s + c.aiCostBRL, 0).toFixed(2)
  const totalMsgs = clients.reduce((s, c) => s + c.aiMessages, 0)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-stone-800 flex items-center gap-2">
          <Activity className="w-5 h-5 text-green-700" /> Atividade & custo de IA
        </h1>
        <p className="text-sm text-stone-400 mt-0.5">
          Engajamento e COGS de IA por cliente
          {source === 'memoria' && ' · dados desta instância (configure SUPABASE_SERVICE_ROLE_KEY para histórico persistente)'}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-stone-800 text-white rounded-xl p-4">
          <p className="text-xs text-stone-400 mb-1">Custo de IA estimado (período)</p>
          <p className="text-2xl font-semibold">R$ {totalCost.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <p className="text-xs text-stone-500 mb-1">Mensagens de IA</p>
          <p className="text-2xl font-semibold text-stone-800">{totalMsgs}</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <p className="text-xs text-stone-500 mb-1">Clientes em risco</p>
          <p className="text-2xl font-semibold text-red-600">{clients.filter(c => c.churnRisk === 'alto').length}</p>
        </div>
      </div>

      {/* Tabela por cliente */}
      <Card className="overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-stone-100 text-[10px] uppercase tracking-wider text-stone-400">
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Último acesso</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell">Páginas</th>
              <th className="px-4 py-3 font-medium"><span className="flex items-center gap-1"><Bot className="w-3 h-3" /> IA</span></th>
              <th className="px-4 py-3 font-medium">Custo IA</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Módulos mais usados</th>
              <th className="px-4 py-3 font-medium">Engajamento</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-stone-400">Carregando…</td></tr>
            )}
            {!loading && clients.map(c => {
              const risk = RISK_META[c.churnRisk]
              return (
                <tr key={c.profile} className="border-b border-stone-50 last:border-0 hover:bg-stone-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-stone-800">{c.name}</td>
                  <td className="px-4 py-3 text-xs text-stone-500">
                    {c.lastSeen
                      ? c.daysSinceLastSeen === 0
                        ? 'Hoje'
                        : `Há ${c.daysSinceLastSeen} dia(s)`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-xs text-stone-500">{c.pageViews}</td>
                  <td className="px-4 py-3 text-xs text-stone-600">
                    {c.aiMessages} msg{c.aiImages > 0 && ` · ${c.aiImages} 📷`}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-stone-800 whitespace-nowrap">
                    R$ {c.aiCostBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex gap-1 flex-wrap">
                      {c.topModules.map(m => (
                        <span key={m.path} className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded">
                          {MODULE_LABEL[m.path] ?? m.path} ({m.count})
                        </span>
                      ))}
                      {c.topModules.length === 0 && <span className="text-xs text-stone-300">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-medium px-2 py-1 rounded-full ${risk.cls}`}>{risk.label}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>

      <p className="text-[10px] text-stone-400 flex items-center gap-1">
        <AlertTriangle className="w-3 h-3" />
        Custo estimado: Haiku 4.5 (texto) e Sonnet 4.6 (fotos) a preço de tabela, ~4 caracteres/token, câmbio R$ 5,50.
        Compare com a mensalidade do cliente para avaliar margem.
      </p>

      {/* Leads do site */}
      <Card className="p-4">
        <h3 className="text-sm font-medium text-stone-700 mb-1 flex items-center gap-2">
          <Mail className="w-4 h-4 text-green-600" /> Leads do site ({leads.length})
        </h3>
        <p className="text-xs text-stone-400 mb-3">Contatos deixados na landing por visitantes que ainda não criaram conta.</p>
        <div className="space-y-1">
          {leads.map((l, i) => (
            <div key={i} className="flex items-center gap-2 text-[11px] py-1.5 border-b border-stone-50 last:border-0">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${l.kind === 'email' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                {l.kind === 'email' ? 'E-mail' : 'WhatsApp'}
              </span>
              <span className="text-stone-700 font-medium flex-1 truncate">{l.contact}</span>
              {l.city && <span className="text-stone-400">{l.city}</span>}
              <span className="text-stone-300 flex-shrink-0">{new Date(l.at).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          ))}
          {leads.length === 0 && <p className="text-xs text-stone-400 text-center py-3">Nenhum lead ainda.</p>}
        </div>
      </Card>

      {/* Log de webhooks MP */}
      <Card className="p-4">
        <h3 className="text-sm font-medium text-stone-700 mb-1 flex items-center gap-2">
          <Webhook className="w-4 h-4 text-blue-500" /> Eventos de cobrança (webhooks Mercado Pago)
        </h3>
        <p className="text-xs text-stone-400 mb-3">Últimos eventos recebidos — útil para investigar “por que este cliente consta atrasado?”</p>
        <div className="space-y-1">
          {mpEvents.map((e, i) => (
            <div key={i} className="flex items-center gap-2 text-[11px] py-1.5 border-b border-stone-50 last:border-0">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                e.status === 'approved' || e.status === 'authorized' ? 'bg-green-100 text-green-700'
                : e.status === 'rejected' || e.status === 'cancelled' ? 'bg-red-100 text-red-700'
                : 'bg-stone-100 text-stone-500'
              }`}>
                {e.kind === 'payment' ? 'Cobrança' : 'Assinatura'} · {e.status ?? '—'}
              </span>
              <span className="text-stone-600 flex-1 truncate">{e.email}{e.statusDetail && ` · ${e.statusDetail}`}{e.reason && ` · ${e.reason}`}</span>
              {e.amount != null && <span className="text-stone-700 font-medium">R$ {Number(e.amount).toLocaleString('pt-BR')}</span>}
              <span className="text-stone-300 flex-shrink-0">{new Date(e.at).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          ))}
          {mpEvents.length === 0 && (
            <p className="text-xs text-stone-400 text-center py-4">
              Nenhum webhook recebido ainda — os eventos aparecem aqui quando o MP começar a cobrar assinaturas reais.
            </p>
          )}
        </div>
      </Card>
    </div>
  )
}
