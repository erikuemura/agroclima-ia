'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    // Em dev o cache-first de chunks serve JS desatualizado — só registra em produção
    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()))
      return
    }
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  }, [])
  return null
}
