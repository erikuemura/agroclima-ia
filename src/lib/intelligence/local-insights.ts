'use client'

import type { Insight } from '@/types'
import { formatBRL, type CommodityPrices } from '@/lib/finance'
import {
  readStock, stockAlerts, readDiary, readPlans, readPriceTargets, writePriceTargets,
} from '@/lib/stores'
import { getDemoProfileClient } from '@/lib/demo-profiles'

// ─────────────────────────────────────────────────────────────
// Insights gerados no cliente a partir dos dados locais
// (estoque, diário, planejamento, preço-alvo). Complementam os
// insights server-side de /api/insights na Home e no assistente.
// ─────────────────────────────────────────────────────────────

export function buildLocalInsights(prices: CommodityPrices | null): Insight[] {
  if (typeof window === 'undefined') return []
  const out: Insight[] = []
  const profile = getDemoProfileClient()

  // Estoque crítico / validade
  const { low, expiring } = stockAlerts(readStock())
  for (const item of low) {
    out.push({
      id: `stock-low-${item.id}`,
      category: 'estoque', priority: 2, severity: 'warning',
      title: `Estoque crítico: ${item.name}`,
      recommendation: `Restam ${item.quantity}${item.unit} (mínimo ${item.minQuantity}${item.unit}). Programe a reposição antes da próxima aplicação.`,
      action: { label: 'Ver estoque', href: '/estoque' },
      source: 'Controle de estoque',
    })
  }
  for (const item of expiring) {
    out.push({
      id: `stock-exp-${item.id}`,
      category: 'estoque', priority: 3, severity: 'info',
      title: `Validade próxima: ${item.name}`,
      recommendation: `Lote ${item.lot ?? '—'} vence em ${new Date(item.expiresAt!).toLocaleDateString('pt-BR')}. Priorize o uso deste lote.`,
      action: { label: 'Ver estoque', href: '/estoque' },
      source: 'Controle de estoque',
    })
  }

  // Talhões sem atualização no diário (>7 dias)
  const diary = readDiary()
  const fields = [...new Set(profile.crops.map(c => c.field))]
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7)
  const stale = fields.filter(f => {
    const last = diary.filter(e => e.field === f).sort((a, b) => b.date.localeCompare(a.date))[0]
    return !last || new Date(last.date) < cutoff
  })
  if (stale.length > 0) {
    out.push({
      id: 'diary-stale',
      category: 'operações', priority: 3, severity: 'info',
      title: `${stale.length} talhão(ões) sem registro há mais de 7 dias`,
      recommendation: `Sem registros recentes em: ${stale.join(', ')}. Registre as operações para manter o histórico da safra.`,
      action: { label: 'Abrir diário de campo', href: '/diario' },
      source: 'Diário de campo',
    })
  }

  // Custos vs orçamento do planejamento
  try {
    const costs: { value: number }[] = JSON.parse(localStorage.getItem('campoclima_costs') ?? '[]')
    const spent = costs.reduce((s, c) => s + c.value, 0)
    const budget = readPlans().reduce((s, p) => s + Object.values(p.budget).reduce((a, b) => a + b, 0), 0)
    if (budget > 0 && spent > budget) {
      const overPct = Math.round(((spent - budget) / budget) * 100)
      out.push({
        id: 'budget-over',
        category: 'financeiro', priority: 2, severity: 'warning',
        title: `Custos ${overPct}% acima do orçamento da safra`,
        recommendation: `Gasto realizado de ${formatBRL(spent)} contra ${formatBRL(budget)} planejados. Revise as categorias no planejamento.`,
        impactBRL: spent - budget,
        action: { label: 'Ver planejamento', href: '/planejamento' },
        source: 'Planejamento de safra',
      })
    }
  } catch { /* sem dados */ }

  // Preço-alvo atingido
  if (prices) {
    const targets = readPriceTargets()
    let changed = false
    for (const t of targets) {
      const current = prices[t.commodity] ?? 0
      if (current >= t.target && !t.hit) { t.hit = true; changed = true }
      if (current < t.target && t.hit)   { t.hit = false; changed = true }
      if (current >= t.target) {
        out.push({
          id: `target-${t.id}`,
          category: 'mercado', priority: 1, severity: 'success',
          title: `🎯 Preço-alvo atingido: ${t.label} a R$ ${current.toFixed(2)}`,
          recommendation: `Seu alvo de R$ ${t.target.toFixed(2)} foi alcançado. Avalie travar a venda no simulador.`,
          action: { label: 'Simular venda', href: '/financeiro' },
          source: 'Monitor de preço-alvo',
        })
      }
    }
    if (changed) writePriceTargets(targets)
  }

  return out
}

// Resumo em texto para enriquecer o contexto do AgroAssistente
export function localContextString(prices: CommodityPrices | null): string {
  const insights = buildLocalInsights(prices)
  const stock = readStock()
  const diary = readDiary().slice(0, 5)
  const lines: string[] = []

  if (stock.length > 0) {
    lines.push(`📦 Estoque: ${stock.map(i => `${i.name} ${i.quantity}${i.unit}${i.quantity <= i.minQuantity ? ' (CRÍTICO)' : ''}`).join(' | ')}.`)
  }
  if (diary.length > 0) {
    lines.push(`📋 Últimas operações: ${diary.map(e => `${e.date} ${e.type} no ${e.field}`).join(' | ')}.`)
  }
  if (insights.length > 0) {
    lines.push(`⚠️ Pendências locais: ${insights.map(i => i.title).join(' | ')}.`)
  }
  return lines.join('\n')
}
