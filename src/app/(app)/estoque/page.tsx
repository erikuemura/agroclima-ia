'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Package, Plus, AlertTriangle, CalendarClock, ArrowDown, ArrowUp } from 'lucide-react'
import {
  readStock, writeStockItems, readStockMovements, writeStockMovements, stockAlerts,
  type StockItem, type StockMovement, type StockCategory,
} from '@/lib/stores'

const CATEGORIES: StockCategory[] = ['semente', 'fertilizante', 'defensivo', 'combustível', 'outro']
const CAT_EMOJI: Record<StockCategory, string> = {
  semente: '🌱', fertilizante: '🧪', defensivo: '💧', combustível: '⛽', outro: '📦',
}

export default function EstoquePage() {
  const [items, setItems] = useState<StockItem[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', category: 'defensivo' as StockCategory, unit: 'L', quantity: '', minQuantity: '', supplier: '', lot: '', expiresAt: '' })
  const [movForm, setMovForm] = useState<{ itemId: string; kind: StockMovement['kind']; qty: string } | null>(null)

  useEffect(() => {
    setItems(readStock())
    setMovements(readStockMovements())
  }, [])

  const { low, expiring } = stockAlerts(items)

  function addItem() {
    const quantity = parseFloat(form.quantity)
    if (!form.name || isNaN(quantity)) return
    const item: StockItem = {
      id: String(Date.now()),
      name: form.name,
      category: form.category,
      unit: form.unit,
      quantity,
      minQuantity: parseFloat(form.minQuantity) || 0,
      supplier: form.supplier || undefined,
      lot: form.lot || undefined,
      expiresAt: form.expiresAt || undefined,
    }
    const next = [item, ...items]
    setItems(next); writeStockItems(next)
    setShowForm(false)
    setForm({ name: '', category: 'defensivo', unit: 'L', quantity: '', minQuantity: '', supplier: '', lot: '', expiresAt: '' })
  }

  function applyMovement() {
    if (!movForm) return
    const qty = parseFloat(movForm.qty)
    if (isNaN(qty) || qty <= 0) return
    const delta = movForm.kind === 'entrada' ? qty : -qty
    const next = items.map(i => i.id === movForm.itemId ? { ...i, quantity: Math.max(0, +(i.quantity + delta).toFixed(2)) } : i)
    setItems(next); writeStockItems(next)
    const mov: StockMovement = {
      id: `m${Date.now()}`, itemId: movForm.itemId, kind: movForm.kind, quantity: qty,
      date: new Date().toISOString().slice(0, 10), notes: '',
    }
    const nextMovs = [mov, ...movements]
    setMovements(nextMovs); writeStockMovements(nextMovs)
    setMovForm(null)
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-stone-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-green-700" /> Estoque de insumos
          </h1>
          <p className="text-sm text-stone-400 mt-0.5">Entradas, saídas e alertas de reposição</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 bg-green-700 text-white text-xs font-medium px-3.5 py-2 rounded-lg hover:bg-green-800 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Novo insumo
        </button>
      </div>

      {/* Alertas */}
      {(low.length > 0 || expiring.length > 0) && (
        <div className="space-y-2">
          {low.map(i => (
            <div key={`low-${i.id}`} className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <p className="text-xs text-amber-800">
                <strong>{i.name}</strong> abaixo do mínimo: {i.quantity}{i.unit} (mínimo {i.minQuantity}{i.unit})
              </p>
            </div>
          ))}
          {expiring.map(i => (
            <div key={`exp-${i.id}`} className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3.5 py-2.5">
              <CalendarClock className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <p className="text-xs text-blue-800">
                <strong>{i.name}</strong> (lote {i.lot ?? '—'}) vence em {new Date(i.expiresAt!).toLocaleDateString('pt-BR')}
              </p>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Card className="p-4 space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <input placeholder="Nome do insumo" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="col-span-2 border border-stone-200 rounded-lg px-2 py-1.5 text-xs" />
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as StockCategory })}
              className="border border-stone-200 rounded-lg px-2 py-1.5 text-xs">
              {CATEGORIES.map(c => <option key={c} value={c}>{CAT_EMOJI[c]} {c}</option>)}
            </select>
            <input placeholder="Unidade (L, kg…)" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}
              className="border border-stone-200 rounded-lg px-2 py-1.5 text-xs" />
            <input placeholder="Quantidade" inputMode="decimal" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })}
              className="border border-stone-200 rounded-lg px-2 py-1.5 text-xs" />
            <input placeholder="Mínimo" inputMode="decimal" value={form.minQuantity} onChange={e => setForm({ ...form, minQuantity: e.target.value })}
              className="border border-stone-200 rounded-lg px-2 py-1.5 text-xs" />
            <input placeholder="Fornecedor" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })}
              className="border border-stone-200 rounded-lg px-2 py-1.5 text-xs" />
            <input placeholder="Lote" value={form.lot} onChange={e => setForm({ ...form, lot: e.target.value })}
              className="border border-stone-200 rounded-lg px-2 py-1.5 text-xs" />
            <input type="date" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })}
              className="border border-stone-200 rounded-lg px-2 py-1.5 text-xs" title="Validade" />
          </div>
          <button onClick={addItem}
            className="w-full bg-green-700 text-white text-xs font-medium py-2 rounded-lg hover:bg-green-800 transition-colors">
            Adicionar ao estoque
          </button>
        </Card>
      )}

      {/* Itens */}
      <div className="space-y-2">
        {items.map(i => {
          const isLow = i.quantity <= i.minQuantity
          return (
            <Card key={i.id} className="p-3.5">
              <div className="flex items-center gap-3">
                <span className="text-xl leading-none">{CAT_EMOJI[i.category]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800 truncate">{i.name}</p>
                  <p className="text-[10px] text-stone-400">
                    {i.supplier ?? '—'} {i.lot && `· lote ${i.lot}`} {i.expiresAt && `· val. ${new Date(i.expiresAt).toLocaleDateString('pt-BR')}`}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-semibold ${isLow ? 'text-amber-600' : 'text-stone-800'}`}>
                    {i.quantity.toLocaleString('pt-BR')} {i.unit}
                  </p>
                  <p className="text-[10px] text-stone-400">mín {i.minQuantity}{i.unit}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => setMovForm({ itemId: i.id, kind: 'entrada', qty: '' })}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-stone-200 text-green-600 hover:bg-green-50" title="Entrada">
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setMovForm({ itemId: i.id, kind: 'aplicação', qty: '' })}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-stone-200 text-amber-600 hover:bg-amber-50" title="Saída">
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {movForm?.itemId === i.id && (
                <div className="flex gap-2 mt-3 items-center bg-stone-50 rounded-lg p-2">
                  <select value={movForm.kind} onChange={e => setMovForm({ ...movForm, kind: e.target.value as StockMovement['kind'] })}
                    className="border border-stone-200 rounded-lg px-2 py-1.5 text-xs bg-white">
                    <option value="entrada">Entrada (compra)</option>
                    <option value="aplicação">Saída — aplicação</option>
                    <option value="perda">Saída — perda</option>
                    <option value="transferência">Saída — transferência</option>
                  </select>
                  <input placeholder={`Qtd (${i.unit})`} inputMode="decimal" autoFocus value={movForm.qty}
                    onChange={e => setMovForm({ ...movForm, qty: e.target.value })}
                    className="flex-1 border border-stone-200 rounded-lg px-2 py-1.5 text-xs bg-white" />
                  <button onClick={applyMovement}
                    className="bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-800">Confirmar</button>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Movimentações recentes */}
      {movements.length > 0 && (
        <Card className="p-4">
          <h3 className="text-xs font-medium text-stone-600 mb-2">Movimentações recentes</h3>
          <div className="space-y-1">
            {movements.slice(0, 8).map(m => {
              const item = items.find(i => i.id === m.itemId)
              return (
                <div key={m.id} className="flex items-center gap-2 text-[11px] text-stone-500 py-1 border-b border-stone-50 last:border-0">
                  <span className={m.kind === 'entrada' ? 'text-green-600' : 'text-amber-600'}>
                    {m.kind === 'entrada' ? '↓' : '↑'}
                  </span>
                  <span className="flex-1 truncate">{item?.name ?? '—'} · {m.kind}{m.notes && ` · ${m.notes}`}</span>
                  <span>{m.quantity}{item?.unit}</span>
                  <span className="text-stone-300">{new Date(m.date + 'T12:00').toLocaleDateString('pt-BR')}</span>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
