'use client'

import type { Insight } from '@/types'

// ─────────────────────────────────────────────────────────────
// Notificações de insights P1 via service worker (PWA).
// Fase atual: notificação local disparada quando o app detecta
// um insight P1 novo (dedupe persistente). O handler `push` no
// sw.js já está pronto para Web Push com VAPID quando o backend
// de subscriptions existir.
// ─────────────────────────────────────────────────────────────

const NOTIFIED_KEY = 'campoclima_notified_insights'
const PREF_KEY = 'campoclima_push_enabled'

export function pushSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator
}

export function pushEnabled(): boolean {
  return pushSupported() && Notification.permission === 'granted' && localStorage.getItem(PREF_KEY) === '1'
}

export async function enablePush(): Promise<boolean> {
  if (!pushSupported()) return false
  const permission = await Notification.requestPermission()
  const ok = permission === 'granted'
  localStorage.setItem(PREF_KEY, ok ? '1' : '0')
  return ok
}

export function disablePush(): void {
  localStorage.setItem(PREF_KEY, '0')
}

// Notifica insights P1 ainda não notificados (1×/dia por insight)
export async function notifyP1Insights(insights: Insight[]): Promise<number> {
  if (!pushEnabled()) return 0
  const reg = await navigator.serviceWorker.ready
  const today = new Date().toISOString().slice(0, 10)

  let notified: Record<string, string> = {}
  try { notified = JSON.parse(localStorage.getItem(NOTIFIED_KEY) ?? '{}') } catch { /* reset */ }

  const fresh = insights.filter(i => i.priority === 1 && notified[i.id] !== today)
  for (const insight of fresh.slice(0, 3)) {
    await reg.showNotification(`🚨 ${insight.title}`, {
      body: insight.recommendation,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: insight.id, // substitui notificação anterior do mesmo insight
      data: { url: insight.action?.href ?? '/app' },
    })
    notified[insight.id] = today
  }

  // poda entradas antigas
  for (const k of Object.keys(notified)) if (notified[k] !== today) delete notified[k]
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify(notified))
  return fresh.length
}
