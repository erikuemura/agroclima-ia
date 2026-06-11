'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Cloud, Sprout, Map, BarChart2, Droplets, FlaskConical,
  CalendarDays, FileText, Settings, Leaf, Bot,
} from 'lucide-react'

const nav = [
  {
    section: 'Principal',
    items: [
      { href: '/', label: 'Clima & alertas', icon: Cloud, dot: 'warning' },
      { href: '/culturas', label: 'Minhas culturas', icon: Sprout },
      { href: '/talhoes', label: 'Talhões & mapa', icon: Map },
      { href: '/ndvi', label: 'NDVI & satélite', icon: BarChart2 },
    ],
  },
  {
    section: 'Gestão',
    items: [
      { href: '/solo', label: 'Análise de solo IA', icon: FlaskConical },
      { href: '/irrigacao', label: 'Irrigação', icon: Droplets },
      { href: '/pulverizacao', label: 'Pulverização', icon: Sprout, dot: 'success' },
      { href: '/calendario', label: 'Calendário', icon: CalendarDays },
      { href: '/relatorios', label: 'Relatórios', icon: FileText },
    ],
  },
  {
    section: 'IA',
    items: [
      { href: '/assistente', label: 'AgroAssistente', icon: Bot },
    ],
  },
  {
    section: 'Conta',
    items: [
      { href: '/configuracoes', label: 'Configurações', icon: Settings },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-52 flex-shrink-0 border-r border-stone-200 bg-white flex flex-col overflow-y-auto">
      <div className="flex items-center gap-2 px-4 py-3.5 border-b border-stone-200">
        <Leaf className="w-5 h-5 text-green-700" />
        <span className="font-semibold text-sm text-stone-800">AgroClima IA</span>
      </div>

      <div className="px-4 py-3 border-b border-stone-100">
        <p className="text-xs text-stone-400">Fazenda</p>
        <p className="text-sm font-medium text-stone-800 mt-0.5">Faz. São João</p>
        <p className="text-xs text-stone-400">Sorriso — MT</p>
      </div>

      <nav className="flex-1 py-2">
        {nav.map(({ section, items }) => (
          <div key={section}>
            <p className="px-4 pt-4 pb-1 text-[10px] uppercase tracking-widest text-stone-400 font-medium">
              {section}
            </p>
            {items.map(({ href, label, icon: Icon, dot }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-2.5 px-4 py-2 text-sm transition-colors',
                    active
                      ? 'bg-stone-100 text-stone-900 font-medium'
                      : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1">{label}</span>
                  {dot === 'warning' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                  {dot === 'success' && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>
    </aside>
  )
}
