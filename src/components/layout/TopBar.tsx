'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Menu } from 'lucide-react'
import { getDemoProfileClient } from '@/lib/demo-profiles'

interface TopBarProps {
  onMenuClick?: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
  // Perfil e hora só no cliente (evita mismatch de hidratação)
  const [info, setInfo] = useState<{ city: string; state: string; avatar: string; time: string } | null>(null)

  useEffect(() => {
    const p = getDemoProfileClient()
    setInfo({
      city: p.farm.city,
      state: p.farm.state,
      avatar: p.avatar,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    })
  }, [])

  return (
    <header className="h-12 border-b border-stone-200 bg-white flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="sm:hidden text-stone-500 hover:text-stone-800 transition-colors p-0.5"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex items-center gap-2 text-xs text-stone-400">
          <span>{info ? `${info.city} — ${info.state}` : 'Carregando…'}</span>
          {info && <><span>·</span><span>Atualizado às {info.time}</span></>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="text-xs text-green-700 border-green-200 bg-green-50">
          Beta
        </Badge>
        <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-xs font-medium text-green-800">
          {info?.avatar ?? '··'}
        </div>
      </div>
    </header>
  )
}
