'use client'

import { Leaf, WifiOff } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-4 text-center">
      <div className="w-14 h-14 bg-green-800 rounded-2xl flex items-center justify-center mb-6">
        <Leaf className="w-7 h-7 text-white" />
      </div>
      <WifiOff className="w-8 h-8 text-stone-300 mb-4" />
      <h1 className="text-xl font-semibold text-stone-800 mb-2">Sem conexão</h1>
      <p className="text-sm text-stone-500 max-w-xs">
        Você está offline. Algumas páginas em cache ainda funcionam — tente navegar para elas ou aguarde a conexão voltar.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-6 bg-green-800 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-green-900 transition-colors"
      >
        Tentar novamente
      </button>
    </div>
  )
}
