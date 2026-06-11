'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AssinaturaForm from './AssinaturaForm'

export default function AssinarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-stone-400 text-sm">Carregando...</div>}>
      <AssinaturaPageContent />
    </Suspense>
  )
}

function AssinaturaPageContent() {
  const params = useSearchParams()
  const planId = (params.get('plano') ?? 'produtor') as 'produtor' | 'premium'
  const annual  = params.get('anual') === '1'
  return <AssinaturaForm planId={planId} annual={annual} />
}
