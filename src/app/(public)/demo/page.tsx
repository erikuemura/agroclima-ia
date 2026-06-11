'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Leaf, ArrowRight, Check, Loader2 } from 'lucide-react'
import { DEMO_PROFILES, type DemoProfileId } from '@/lib/demo-profiles'

const PROFILES = [
  {
    id: 'pequeno' as DemoProfileId,
    emoji: '🌾',
    color: 'border-amber-200 hover:border-amber-400',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    btn: 'bg-amber-600 hover:bg-amber-700',
    accent: 'text-amber-700',
  },
  {
    id: 'medio' as DemoProfileId,
    emoji: '🌱',
    color: 'border-green-300 hover:border-green-500 ring-2 ring-green-200',
    badge: 'bg-green-50 text-green-700 border-green-200',
    btn: 'bg-green-800 hover:bg-green-900',
    accent: 'text-green-700',
    featured: true,
  },
  {
    id: 'grande' as DemoProfileId,
    emoji: '🏢',
    color: 'border-blue-200 hover:border-blue-400',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    btn: 'bg-blue-700 hover:bg-blue-800',
    accent: 'text-blue-700',
  },
]

export default function DemoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<DemoProfileId | null>(null)

  function enter(id: DemoProfileId) {
    setLoading(id)
    document.cookie = `demo_profile=${id}; path=/; max-age=86400`
    router.push('/app')
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-stone-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-green-800 rounded-lg flex items-center justify-center">
            <Leaf className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-stone-900">CampoClima</span>
        </div>
        <span className="text-xs bg-purple-100 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-full font-medium">
          Modo Demo
        </span>
      </nav>

      {/* Header */}
      <div className="text-center pt-12 pb-8 px-4">
        <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 text-xs font-medium px-3 py-1.5 rounded-full border border-purple-200 mb-4">
          🔐 Acesso demo — sem necessidade de cadastro
        </div>
        <h1 className="text-2xl sm:text-3xl font-medium text-stone-900 mb-2">
          Escolha o perfil para explorar
        </h1>
        <p className="text-stone-500 text-sm max-w-md mx-auto">
          Cada perfil tem dados reais simulados — fazenda, culturas, alertas IA e histórico climático.
        </p>
      </div>

      {/* Profile cards */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {PROFILES.map(({ id, emoji, color, badge, btn, accent, featured }) => {
            const profile = DEMO_PROFILES[id]
            const isLoading = loading === id
            return (
              <div
                key={id}
                className={`bg-white rounded-2xl border-2 p-6 flex flex-col transition-all cursor-pointer ${color} ${featured ? 'shadow-md' : ''}`}
                onClick={() => !loading && enter(id)}
              >
                {featured && (
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-green-600 mb-3">
                    ★ Mais completo
                  </div>
                )}

                <div className="text-3xl mb-3">{emoji}</div>

                <div className={`text-xs font-semibold border px-2.5 py-1 rounded-full self-start mb-3 ${badge}`}>
                  {profile.plan}
                </div>

                <h2 className="text-base font-semibold text-stone-900 mb-0.5">{profile.label}</h2>
                <p className={`text-xs font-medium mb-3 ${accent}`}>{profile.role}</p>
                <p className="text-xs text-stone-400 leading-relaxed mb-5">{profile.description}</p>

                {/* Farm info */}
                <div className="bg-stone-50 rounded-xl p-3 mb-5 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-400">Fazenda</span>
                    <span className="font-medium text-stone-700">{profile.farm.name}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-400">Localização</span>
                    <span className="font-medium text-stone-700">{profile.farm.city} — {profile.farm.state}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-400">Área total</span>
                    <span className="font-medium text-stone-700">{profile.farm.hectares.toLocaleString('pt-BR')} ha</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-400">Culturas</span>
                    <span className="font-medium text-stone-700">{profile.crops.length} ativas</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-400">Alertas IA</span>
                    <span className="font-medium text-stone-700">{profile.alerts.length} ativos</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-1.5 mb-6 flex-1">
                  {profile.crops.map(c => (
                    <li key={c.id} className="flex items-center gap-2 text-xs text-stone-500">
                      <span>{c.emoji}</span>
                      <span>{c.name} · {c.hectares}ha</span>
                    </li>
                  ))}
                </ul>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mb-5">
                  {profile.stats.slice(0, 2).map(s => (
                    <div key={s.label} className="bg-stone-50 rounded-lg p-2 text-center">
                      <p className={`text-sm font-semibold ${accent}`}>{s.value}</p>
                      <p className="text-[10px] text-stone-400">{s.label}</p>
                    </div>
                  ))}
                </div>

                <button
                  disabled={!!loading}
                  className={`w-full ${btn} text-white rounded-xl py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60`}
                >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Entrando...</>
                  ) : (
                    <><ArrowRight className="w-4 h-4" /> Entrar como {profile.label}</>
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {/* Footer note */}
        <div className="mt-8 text-center">
          <p className="text-xs text-stone-400 flex items-center justify-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-green-500" />
            Dados simulados com base em produtores reais do Mato Grosso e Paraná
          </p>
          <p className="text-xs text-stone-400 mt-1">
            Nenhum dado real é armazenado nesta sessão de demonstração
          </p>
        </div>
      </div>
    </div>
  )
}
