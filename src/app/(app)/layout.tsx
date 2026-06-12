'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [impersonating, setImpersonating] = useState(false)

  useEffect(() => {
    setImpersonating(document.cookie.includes('admin_impersonating=1'))
  }, [])

  async function exitImpersonation() {
    await fetch('/api/admin/impersonate', { method: 'DELETE' })
    window.location.href = '/backoffice'
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {impersonating && (
        <div className="bg-purple-700 text-white text-xs px-4 py-1.5 flex items-center justify-center gap-3 flex-shrink-0">
          <span>👁 Modo suporte — você está vendo o painel como o cliente</span>
          <button onClick={exitImpersonation} className="underline font-medium hover:text-purple-200">
            Voltar ao backoffice
          </button>
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
      </div>
    </div>
  )
}
