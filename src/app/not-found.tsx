import Link from 'next/link'
import { Leaf, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-4 text-center">
      <div className="w-14 h-14 bg-green-800 rounded-2xl flex items-center justify-center mb-6">
        <Leaf className="w-7 h-7 text-white" />
      </div>
      <p className="text-[64px] leading-none font-semibold text-stone-200 mb-2">404</p>
      <h1 className="text-xl font-semibold text-stone-800 mb-2">Página não encontrada</h1>
      <p className="text-sm text-stone-500 max-w-xs mb-6">
        O endereço que você acessou não existe ou foi movido.
      </p>
      <div className="flex gap-3">
        <Link href="/" className="inline-flex items-center gap-2 bg-green-800 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-green-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar ao início
        </Link>
        <Link href="/demo" className="inline-flex items-center gap-2 border border-stone-200 text-stone-700 text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-white transition-colors">
          Ver demonstração
        </Link>
      </div>
    </div>
  )
}
