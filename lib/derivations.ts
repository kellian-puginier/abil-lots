import type { Tournament, StockItem, CategoryCode, SeriesAward, LotRef } from '@/types/tournament'
import { generateSeriesKeys } from '@/lib/series'

// ─── Valeurs unitaires ───────────────────────────────────────────────────────

/** Valeur perçue par le joueur (prix public du lot). */
export function stockItemValue(item: StockItem): number {
  return item.amount ?? item.unitValue ?? 0
}

/** Coût réel pour le club (défaut = valeur perçue si non renseigné). */
export function stockItemClubCost(item: StockItem): number {
  return item.clubCost ?? stockItemValue(item)
}

// ─── Helpers internes ────────────────────────────────────────────────────────

/**
 * Retourne l'ensemble des LotRef d'une attribution, en tenant compte
 * du mode genderSplit (lots H/F distincts).
 */
function allRefs(award: SeriesAward): LotRef[] {
  const base = [...award.winner, ...award.finalist]
  if (award.genderSplit) {
    return [...base, ...(award.winnerF ?? []), ...(award.finalistF ?? [])]
  }
  return base
}

function roleRefs(award: SeriesAward, role: 'winner' | 'finalist'): LotRef[] {
  if (award.genderSplit) {
    const f = role === 'winner' ? (award.winnerF ?? []) : (award.finalistF ?? [])
    return [...award[role], ...f]
  }
  return award[role]
}

// ─── Stock utilisé / restant ─────────────────────────────────────────────────

export function stockUsed(t: Tournament, stockItemId: string): number {
  let total = 0
  for (const award of Object.values(t.attributions)) {
    for (const ref of allRefs(award)) {
      if (ref.stockItemId === stockItemId) total += ref.count
    }
  }
  return total
}

export function stockRemaining(t: Tournament, item: StockItem): number {
  return item.quantity - stockUsed(t, item.id)
}

// ─── Valeur d'un rôle ────────────────────────────────────────────────────────

function refsValue(t: Tournament, refs: LotRef[]): { perPlayer: number; total: number } {
  let perPlayer = 0
  let total = 0
  for (const ref of refs) {
    const item = t.stock.find(s => s.id === ref.stockItemId)
    if (!item) continue
    const v = stockItemValue(item)
    perPlayer += v
    total += v * ref.count
  }
  return { perPlayer, total }
}

/** Valeur totale d'une cellule (vainqueur + finaliste), en valeur perçue joueur. */
export function cellTotalValue(t: Tournament, key: string): number {
  const a = t.attributions[key]
  if (!a) return 0
  if (a.genderSplit) {
    return (
      refsValue(t, a.winner).total +
      refsValue(t, a.winnerF ?? []).total +
      refsValue(t, a.finalist).total +
      refsValue(t, a.finalistF ?? []).total
    )
  }
  return refsValue(t, a.winner).total + refsValue(t, a.finalist).total
}

/**
 * Valeur perçue par joueur pour un rôle (mode non-split : même valeur pour tous).
 * En mode genderSplit, retourne la valeur de l'homme (pour rétro-compatibilité).
 * Utiliser `valuePerGender` pour le détail H/F.
 */
export function valuePerPlayer(t: Tournament, key: string, role: 'winner' | 'finalist'): number {
  const a = t.attributions[key]
  if (!a) return 0
  return refsValue(t, a[role]).perPlayer
}

/**
 * Valeur perçue par joueur en mode genderSplit.
 * Retourne null si la série n'est pas en mode genderSplit.
 */
export function valuePerGender(
  t: Tournament,
  key: string,
  role: 'winner' | 'finalist',
): { m: number; f: number } | null {
  const a = t.attributions[key]
  if (!a?.genderSplit) return null
  const fKey = role === 'winner' ? 'winnerF' : 'finalistF'
  return {
    m: refsValue(t, a[role]).perPlayer,
    f: refsValue(t, a[fKey] ?? []).perPlayer,
  }
}

// ─── Progression ─────────────────────────────────────────────────────────────

export function categoryProgress(t: Tournament, code: CategoryCode): { validated: number; total: number } {
  const cfg = t.categories[code]
  const keys = generateSeriesKeys(cfg.seriesCount)
  let validated = 0
  for (const k of keys) {
    const a = t.attributions[`${code}-${k}`]
    if (a?.status === 'validated') validated++
  }
  return { validated, total: cfg.seriesCount }
}

export function overallProgress(t: Tournament): { validated: number; total: number } {
  let validated = 0
  let total = 0
  for (const code of Object.keys(t.categories) as CategoryCode[]) {
    const p = categoryProgress(t, code)
    validated += p.validated
    total += p.total
  }
  return { validated, total }
}

export function totalRecipients(t: Tournament): number {
  let total = 0
  for (const code of Object.keys(t.categories) as CategoryCode[]) {
    const cfg = t.categories[code]
    total += cfg.seriesCount * (cfg.isDouble ? 4 : 2)
  }
  return total
}

// ─── Synthèse financière ─────────────────────────────────────────────────────

export interface TournamentTotals {
  playerValueTotal: number
  clubCostTotal: number
  dotationConsumed: number
  realCashSpend: number
  dotationEnvelope: number
  dotationRemaining: number
}

export function tournamentTotals(t: Tournament): TournamentTotals {
  let playerValueTotal = 0
  let clubCostTotal    = 0
  let dotationConsumed = 0

  for (const award of Object.values(t.attributions)) {
    for (const ref of allRefs(award)) {
      const item = t.stock.find(x => x.id === ref.stockItemId)
      if (!item) continue
      playerValueTotal += stockItemValue(item) * ref.count
      const cc = stockItemClubCost(item) * ref.count
      clubCostTotal += cc
      if (item.usesDotation) dotationConsumed += cc
    }
  }

  const dotationEnvelope = t.meta.dotationEnvelope ?? 0
  return {
    playerValueTotal,
    clubCostTotal,
    dotationConsumed,
    realCashSpend:     clubCostTotal - dotationConsumed,
    dotationEnvelope,
    dotationRemaining: dotationEnvelope - dotationConsumed,
  }
}
