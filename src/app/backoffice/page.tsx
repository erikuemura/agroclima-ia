'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Users, ExternalLink, Search, X, Loader2, MapPin, Sprout, Wallet, AlertTriangle } from 'lucide-react'

interface AdminUser {
  id: string
  kind: 'demo' | 'supabase'
  name: string
  email: string
  plan: string
  farm: string
  location: string
  hectares: number | null
  lastSignIn: string | null
  createdAt: string | null
  impersonateProfile: string | null
}

interface UserDetail {
  id: string
  kind: string
  name: string
  email: string
  role: string
  description: string | null
  plan: string
  farm: { name: string; city: string; state: string; lat: number; lon: number; hectares: number } | null
  crops: { name: string; field: string; hectares: number; phase: string; status: string; plantedAt: string; harvestAt: string }[]
  activeAlerts: number | null
  createdAt?: string | null
  lastSignIn?: string | null
  emailConfirmed?: boolean
  finance: {
    health: 'em_dia' | 'atrasado' | 'cancelado' | 'sem_assinatura'
    subscription: { reason: string; amount: number; status: string; nextPayment: string | null; createdAt: string | null } | null
  }
  impersonateProfile: string | null
}

const HEALTH_META = {
  em_dia:         { label: 'Em dia',         cls: 'bg-green-100 text-green-800' },
  atrasado:       { label: 'Atrasado',       cls: 'bg-red-100 text-red-700' },
  cancelado:      { label: 'Cancelado',      cls: 'bg-stone-200 text-stone-600' },
  sem_assinatura: { label: 'Sem assinatura', cls: 'bg-amber-100 text-amber-700' },
} as const

function fmtDate(d: string | null | undefined) {
  return d ? new Date(d.includes('T') ? d : d + 'T12:00').toLocaleDateString('pt-BR') : '—'
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [supabaseOn, setSupabaseOn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [detail, setDetail] = useState<UserDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)

  function openDetail(id: string) {
    setDetailOpen(true)
    setDetailLoading(true)
    setDetail(null)
    fetch(`/api/admin/user-detail?id=${encodeURIComponent(id)}`)
      .then(r => r.ok ? r.json() : null)
      .then(setDetail)
      .finally(() => setDetailLoading(false))
  }

  useEffect(() => {
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(d => { setUsers(d.users ?? []); setSupabaseOn(d.supabaseAvailable ?? false) })
      .finally(() => setLoading(false))
  }, [])

  const q = query.toLowerCase()
  const visible = users.filter(u =>
    !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.farm.toLowerCase().includes(q)
  )

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold text-stone-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-green-700" /> Usuários
          </h1>
          <p className="text-sm text-stone-400 mt-0.5">
            {users.length} conta(s)
            {!supabaseOn && ' · Supabase admin não configurado (exibindo contas demo)'}
          </p>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por nome, e-mail, fazenda…"
            className="bg-white border border-stone-200 rounded-lg pl-8 pr-3 py-2 text-xs w-64 focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-stone-100 text-[10px] uppercase tracking-wider text-stone-400">
              <th className="px-4 py-3 font-medium">Usuário</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Fazenda</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell">Plano</th>
              <th className="px-4 py-3 font-medium hidden lg:table-cell">Último acesso</th>
              <th className="px-4 py-3 font-medium text-right">Suporte</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-stone-400">Carregando…</td></tr>
            )}
            {!loading && visible.map(u => (
              <tr key={u.id} onClick={() => openDetail(u.id)}
                className="border-b border-stone-50 last:border-0 hover:bg-stone-50 transition-colors cursor-pointer">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-8 h-8 rounded-lg text-[10px] font-semibold flex items-center justify-center flex-shrink-0 ${
                      u.kind === 'demo' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {u.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-stone-800 truncate">{u.name}
                        {u.kind === 'demo' && <span className="text-[9px] bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded ml-2">demo</span>}
                      </p>
                      <p className="text-[11px] text-stone-400 truncate">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <p className="text-xs text-stone-600">{u.farm}</p>
                  <p className="text-[10px] text-stone-400">{u.location}{u.hectares ? ` · ${u.hectares.toLocaleString('pt-BR')} ha` : ''}</p>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className="text-[11px] bg-stone-100 text-stone-600 px-2 py-1 rounded-full whitespace-nowrap">{u.plan}</span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell text-[11px] text-stone-400">
                  {u.lastSignIn ? new Date(u.lastSignIn).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                </td>
                <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                  {u.impersonateProfile ? (
                    <a href={`/api/admin/impersonate?profile=${u.impersonateProfile}`}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 border border-green-200 bg-green-50 hover:bg-green-100 rounded-lg px-3 py-1.5 transition-colors whitespace-nowrap">
                      <ExternalLink className="w-3 h-3" /> Acessar painel
                    </a>
                  ) : <span className="text-xs text-stone-300">—</span>}
                </td>
              </tr>
            ))}
            {!loading && visible.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-stone-400">Nenhum usuário encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      <p className="text-[10px] text-stone-400">
        ⚠️ &quot;Acessar painel&quot; assume a sessão do cliente neste navegador (cookie de perfil) para suporte.
        Ao terminar, volte ao backoffice e a sessão do cliente expira em 4h.
      </p>

      {/* Drawer: ficha cadastral do cliente */}
      {detailOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/30" onClick={() => setDetailOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-stone-100 px-5 py-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-stone-800">Ficha do cliente</h2>
              <button onClick={() => setDetailOpen(false)} className="text-stone-400 hover:text-stone-700 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {detailLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-5 h-5 animate-spin text-stone-300" />
              </div>
            ) : detail ? (
              <div className="p-5 space-y-5">
                {/* Identificação */}
                <div className="flex items-center gap-3">
                  <span className="w-12 h-12 rounded-xl bg-green-100 text-green-800 text-sm font-semibold flex items-center justify-center">
                    {detail.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-stone-800">{detail.name}</p>
                    <p className="text-xs text-stone-400">{detail.email}</p>
                    <p className="text-[11px] text-stone-500 mt-0.5">{detail.role}</p>
                  </div>
                </div>
                {detail.description && (
                  <p className="text-xs text-stone-500 leading-relaxed bg-stone-50 rounded-lg p-3">{detail.description}</p>
                )}

                {/* Situação financeira */}
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-stone-400 font-medium mb-2 flex items-center gap-1.5">
                    <Wallet className="w-3 h-3" /> Situação financeira
                  </p>
                  <div className={`rounded-xl border p-3 ${
                    detail.finance.health === 'atrasado' ? 'bg-red-50 border-red-200' : 'bg-stone-50 border-stone-100'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${HEALTH_META[detail.finance.health].cls}`}>
                        {HEALTH_META[detail.finance.health].label}
                      </span>
                      {detail.finance.subscription && (
                        <span className="text-sm font-semibold text-stone-800">
                          R$ {detail.finance.subscription.amount.toLocaleString('pt-BR')}/mês
                        </span>
                      )}
                    </div>
                    {detail.finance.subscription ? (
                      <div className="text-[11px] text-stone-500 space-y-0.5">
                        <p>{detail.finance.subscription.reason}</p>
                        <p>
                          Próxima cobrança: <strong className={detail.finance.health === 'atrasado' ? 'text-red-600' : 'text-stone-700'}>
                            {fmtDate(detail.finance.subscription.nextPayment)}
                            {detail.finance.health === 'atrasado' && ' (vencida)'}
                          </strong>
                        </p>
                        <p>Assinante desde {fmtDate(detail.finance.subscription.createdAt)}</p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-stone-400">Nenhuma assinatura vinculada a este e-mail.</p>
                    )}
                    {detail.finance.health === 'atrasado' && (
                      <p className="text-[11px] text-red-600 mt-2 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Cobrança vencida — considere contato de retenção.
                      </p>
                    )}
                  </div>
                </div>

                {/* Fazenda */}
                {detail.farm && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-stone-400 font-medium mb-2 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" /> Propriedade
                    </p>
                    <div className="bg-stone-50 rounded-xl p-3 grid grid-cols-2 gap-2 text-[11px]">
                      <div><p className="text-stone-400">Fazenda</p><p className="font-medium text-stone-700">{detail.farm.name}</p></div>
                      <div><p className="text-stone-400">Localização</p><p className="font-medium text-stone-700">{detail.farm.city}/{detail.farm.state}</p></div>
                      <div><p className="text-stone-400">Área total</p><p className="font-medium text-stone-700">{detail.farm.hectares.toLocaleString('pt-BR')} ha</p></div>
                      <div><p className="text-stone-400">Coordenadas</p><p className="font-medium text-stone-700">{detail.farm.lat.toFixed(4)}, {detail.farm.lon.toFixed(4)}</p></div>
                      <div><p className="text-stone-400">Plano</p><p className="font-medium text-stone-700">{detail.plan}</p></div>
                      {detail.activeAlerts != null && (
                        <div><p className="text-stone-400">Alertas ativos</p><p className="font-medium text-stone-700">{detail.activeAlerts}</p></div>
                      )}
                    </div>
                  </div>
                )}

                {/* Conta Supabase */}
                {detail.kind === 'supabase' && (
                  <div className="bg-stone-50 rounded-xl p-3 grid grid-cols-2 gap-2 text-[11px]">
                    <div><p className="text-stone-400">Cadastro</p><p className="font-medium text-stone-700">{fmtDate(detail.createdAt)}</p></div>
                    <div><p className="text-stone-400">Último acesso</p><p className="font-medium text-stone-700">{fmtDate(detail.lastSignIn)}</p></div>
                    <div><p className="text-stone-400">E-mail confirmado</p><p className="font-medium text-stone-700">{detail.emailConfirmed ? 'Sim' : 'Não'}</p></div>
                  </div>
                )}

                {/* Culturas */}
                {detail.crops.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-stone-400 font-medium mb-2 flex items-center gap-1.5">
                      <Sprout className="w-3 h-3" /> Culturas ({detail.crops.length})
                    </p>
                    <div className="space-y-1.5">
                      {detail.crops.map((c, i) => (
                        <div key={i} className="bg-stone-50 rounded-lg p-2.5 text-[11px]">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-stone-700">{c.name}</p>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                              c.status === 'normal' ? 'bg-green-100 text-green-700' :
                              c.status === 'attention' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                            }`}>{c.status === 'normal' ? 'Normal' : c.status === 'attention' ? 'Atenção' : 'Crítico'}</span>
                          </div>
                          <p className="text-stone-400 mt-0.5">
                            {c.field} · {c.hectares} ha · {c.phase} · plantio {fmtDate(c.plantedAt)} → colheita {fmtDate(c.harvestAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ações */}
                {detail.impersonateProfile && (
                  <a href={`/api/admin/impersonate?profile=${detail.impersonateProfile}`}
                    className="flex items-center justify-center gap-2 w-full bg-green-700 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-green-800 transition-colors">
                    <ExternalLink className="w-4 h-4" /> Acessar painel deste cliente
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm text-stone-400 text-center py-20">Não foi possível carregar a ficha.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
