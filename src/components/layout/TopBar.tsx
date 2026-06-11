import { Badge } from '@/components/ui/badge'
import { Menu } from 'lucide-react'

interface TopBarProps {
  onMenuClick?: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
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
          <span>Sorriso — MT</span>
          <span>·</span>
          <span>Atualizado às 06h00</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="text-xs text-green-700 border-green-200 bg-green-50">
          Beta
        </Badge>
        <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-xs font-medium text-green-800">
          JO
        </div>
      </div>
    </header>
  )
}
