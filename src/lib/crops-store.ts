'use client'

import { useState, useCallback } from 'react'

export type CropStatus = 'normal' | 'attention' | 'critical'

export interface CropEntry {
  id: string
  name: string
  variety: string
  emoji: string
  fieldId: string
  fieldName: string
  hectares: number
  plantedAt: string
  harvestAt: string
  phase: string
  phasePercent: number
  status: CropStatus
  expectedYield: number // sacas/ha
  notes: string
  season: string // ex: "25/26"
}

export const PHASE_OPTIONS = [
  'Semeadura',
  'Germinação',
  'Emergência',
  'Desenvolvimento vegetativo',
  'Floração',
  'Enchimento de grãos',
  'Maturação fisiológica',
  'Pré-colheita',
  'Colheita',
]

export const CROP_OPTIONS = [
  { name: 'Soja', emoji: '🌱', defaultYield: 60 },
  { name: 'Milho', emoji: '🌽', defaultYield: 140 },
  { name: 'Algodão', emoji: '🌿', defaultYield: 250 },
  { name: 'Sorgo', emoji: '🌾', defaultYield: 80 },
  { name: 'Feijão', emoji: '🫘', defaultYield: 30 },
  { name: 'Arroz', emoji: '🍚', defaultYield: 80 },
  { name: 'Trigo', emoji: '🌾', defaultYield: 45 },
  { name: 'Café', emoji: '☕', defaultYield: 35 },
  { name: 'Cana-de-açúcar', emoji: '🎋', defaultYield: 800 },
  { name: 'Pastagem', emoji: '🍃', defaultYield: 0 },
]

export const INITIAL_CROPS: CropEntry[] = [
  {
    id: '1',
    name: 'Soja',
    variety: 'Intacta RR2 PRO',
    emoji: '🌱',
    fieldId: 't1',
    fieldName: 'Talhão 1',
    hectares: 420,
    plantedAt: '2025-10-15',
    harvestAt: '2026-02-20',
    phase: 'Enchimento de grãos',
    phasePercent: 72,
    status: 'attention',
    expectedYield: 62,
    notes: 'Monitorar ferrugem asiática. Déficit hídrico observado.',
    season: '25/26',
  },
  {
    id: '2',
    name: 'Milho',
    variety: '2B587 PW',
    emoji: '🌽',
    fieldId: 't2',
    fieldName: 'Talhão 2',
    hectares: 180,
    plantedAt: '2026-02-01',
    harvestAt: '2026-06-20',
    phase: 'Germinação',
    phasePercent: 8,
    status: 'normal',
    expectedYield: 135,
    notes: '2ª safra. Aguardando estabelecimento.',
    season: '25/26',
  },
]
