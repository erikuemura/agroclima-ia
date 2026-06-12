'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShieldCheck, Users, CreditCard, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/admin', label: 'Usuários', icon: Users },
  { href: '/admin/pagamentos', label: 'Pagamentos', icon: CreditCard },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // A tela de login não usa o shell do backoffice
  if (pathname === '/admin/login') return <>{children}</>

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    window.location.href = '/admin/login'
  }

  return (
    <div className="min-h-screen bg-stone-100">
      <header className="bg-stone-900 text-white">
        <div className="max-w-5xl mx-auto px-4 flex items-center gap-6 h-14">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-400" />
            <span className="text-sm font-semibold">Backoffice</span>
            <span className="text-[10px] bg-stone-700 text-stone-300 px-2 py-0.5 rounded-full">CampoClima</span>
          </div>
          <nav className="flex items-center gap-1 flex-1">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}
                className={cn('flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors',
                  pathname === href ? 'bg-stone-700 text-white' : 'text-stone-400 hover:text-white hover:bg-stone-800')}>
                <Icon className="w-3.5 h-3.5" /> {label}
              </Link>
            ))}
          </nav>
          <button onClick={logout}
            className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-white transition-colors">
            <LogOut className="w-3.5 h-3.5" /> Sair
          </button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
