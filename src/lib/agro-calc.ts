// ─────────────────────────────────────────────────────────────
// Cálculos agronômicos puros usados pelas ferramentas públicas.
// Funções determinísticas e testáveis (sem I/O).
// ─────────────────────────────────────────────────────────────

// ── Calagem — método da saturação por bases ──────────────────
// NC (t/ha) = ((V2 − V1) × CTC) / PRNT
//   V1 = saturação atual (%), V2 = desejada (%),
//   CTC = capacidade de troca catiônica (cmolc/dm³), PRNT = qualidade do calcário (%)
export interface LimingResult {
  tonsPerHa: number
  totalTons: number
  status: 'desnecessario' | 'recomendado'
}

// Saturação por bases (V%) alvo recomendada por cultura
export const TARGET_V: Record<string, number> = {
  soja: 60, milho: 60, algodão: 60, café: 60, 'cana-de-açúcar': 60,
  feijão: 60, trigo: 60, pastagem: 50, 'hortaliças': 70, 'frutíferas': 60,
}

export function limingNeed(
  vCurrent: number, vTarget: number, ctc: number, prnt: number, areaHa: number
): LimingResult {
  if (vTarget <= vCurrent || ctc <= 0 || prnt <= 0) {
    return { tonsPerHa: 0, totalTons: 0, status: 'desnecessario' }
  }
  const tonsPerHa = +(((vTarget - vCurrent) * ctc) / prnt).toFixed(2)
  return {
    tonsPerHa,
    totalTons: +(tonsPerHa * areaHa).toFixed(1),
    status: 'recomendado',
  }
}

// ── População de plantas / sementes ──────────────────────────
export interface PlantingResult {
  seedsPerHa: number        // sementes viáveis necessárias por hectare
  seedsPerMeter: number     // por metro linear
  seedsTotal: number        // no campo inteiro
  kgPerHa: number | null    // se PMS informado (g por mil sementes)
  bagsNeeded: number | null // sacos de sementes (se kg por saco informado)
}

// população = plantas/ha desejadas no estande final
// germinação + emergência (%) descontam para achar sementes a semear
export function plantingRate(
  targetPopulation: number,   // plantas/ha
  rowSpacingCm: number,       // espaçamento entre linhas (cm)
  germination: number,        // % germinação
  emergence: number,          // % emergência/vigor a campo
  areaHa: number,
  thousandSeedWeightG?: number, // PMS — peso de mil sementes (g)
  seedsPerBag?: number,         // sementes por saco (p/ converter em sacos)
): PlantingResult {
  const effective = (germination / 100) * (emergence / 100)
  const seedsPerHa = effective > 0 ? Math.round(targetPopulation / effective) : 0
  // metros lineares por hectare = 10.000 m² / espaçamento(m)
  const linearMetersPerHa = rowSpacingCm > 0 ? 10000 / (rowSpacingCm / 100) : 0
  const seedsPerMeter = linearMetersPerHa > 0 ? +(seedsPerHa / linearMetersPerHa).toFixed(1) : 0
  const kgPerHa = thousandSeedWeightG ? +((seedsPerHa * thousandSeedWeightG) / 1_000_000).toFixed(1) : null
  const bagsNeeded = seedsPerBag && seedsPerBag > 0 ? +((seedsPerHa * areaHa) / seedsPerBag).toFixed(1) : null
  return {
    seedsPerHa,
    seedsPerMeter,
    seedsTotal: Math.round(seedsPerHa * areaHa),
    kgPerHa,
    bagsNeeded,
  }
}

// ── Valor da safra ───────────────────────────────────────────
export interface HarvestValueResult {
  totalBags: number
  grossValue: number   // R$
  perHa: number        // R$/ha
}

export function harvestValue(
  areaHa: number, yieldBagsPerHa: number, pricePerBag: number
): HarvestValueResult {
  const totalBags = Math.round(areaHa * yieldBagsPerHa)
  const grossValue = Math.round(totalBags * pricePerBag)
  return {
    totalBags,
    grossValue,
    perHa: Math.round(yieldBagsPerHa * pricePerBag),
  }
}
