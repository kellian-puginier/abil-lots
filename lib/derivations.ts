import type { Tournament, StockItem, CategoryCode, SeriesAward } from '@/types/tournament'
import { generateSeriesKeys } from '@/lib/series'

// ─── Valeurs unitaires ───────────────────────────────────────────────────────

/** Valeur perçue par le joueur (prix public du lot). */
export function stockItemValue(item: StockItem): number {
  return item.amount ?? item.unitValue ?? 0
}

/** Coût réel pour le club (peut être inférieur si achat en gros / remise).
 *  Si non renseigné, on suppose qu'il égale la valeur perçue. */
export function stockItemClubCost(item: StockItem): number {
  return item.clubCost ?? stockItemValue(item)
}

// ─── Stock utilisé / restant ─────────────────────────────────────────────────

export function stockUsed(t: Tournament, stockItemId: string): number {
  let total = 0
  for (const award of Object.values(t.attributions)) {
    for (const ref of [...award.winner, ...award.finalist]) {
      if (ref.stockItemId === stockItemId) total += ref.count
    }
  }
  return total
}

export function stockRemaining(t: Tournament, item: StockItem): number {
  return item.quantity - stockUsed(t, item.id)
}

// ─── Valeur d'une attribution (rôle vainqueur ou finaliste) ──────────────────

function awardValue(t: Tournament, refs: SeriesAward['winner']): { perPlayer: number; total: number } {
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
  return awardValue(t, a.winner).total + awardValue(t, a.finalist).total
}

/** Valeur perçue par joueur (pas × count) pour un rôle donné. */
export function valuePerPlayer(t: Tournament, key: string, role: 'winner' | 'finalist'): number {
  const a = t.attributions[key]
  if (!a) return 0
  return awardValue(t, a[role]).perPlayer
}

// ─── Progression / récapitulatif ─────────────────────────────────────────────

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
  /** Somme des valeurs perçues par les joueurs sur toutes les attributions. */
  playerValueTotal: number
  /** Somme des coûts réels du club sur toutes les attributions. */
  clubCostTotal: number
  /** Part du coût club couverte par la dotation équipementier. */
  dotationConsumed: number
  /** Ce que le club paie vraiment en cash (hors dotation). */
  realCashSpend: number
  /** Enveloppe de dotation configurée (0 si non renseignée). */
  dotationEnvelope: number
  /** Dotation restante (peut être négative si dépassée). */
  dotationRemaining: number
}

export function tournamentTotals(t: Tournament): TournamentTotals {
  let playerValueTotal = 0
  let clubCostTotal    = 0
  let dotationConsumed = 0

  for (const award of Object.values(t.attributions)) {
    for (const ref of [...award.winner, ...award.finalist]) {
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
    realCashSpend:      clubCostTotal - dotationConsumed,
    dotationEnvelope,
    dotationRemaining:  dotationEnvelope - dotationConsumed,
  }
}
