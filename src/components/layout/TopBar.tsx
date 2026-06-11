import { Badge } from '@/components/ui/badge'

export function TopBar() {
  return (
    <header className="h-12 border-b border-stone-200 bg-white flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-2 text-xs text-stone-400">
        <span>Sorriso — MT</span>
        <span>·</span>
        <span>Atualizado às 06h00</span>
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
