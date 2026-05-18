import type { Tournament, StockItem, CategoryCode, SeriesAward } from '@/types/tournament'
import { generateSeriesKeys } from '@/lib/series'

export function stockItemValue(item: StockItem): number {
  return item.amount ?? item.unitValue ?? 0
}

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

export function cellTotalValue(t: Tournament, key: string): number {
  const a = t.attributions[key]
  if (!a) return 0
  return awardValue(t, a.winner).total + awardValue(t, a.finalist).total
}

export function valuePerPlayer(t: Tournament, key: string, role: 'winner' | 'finalist'): number {
  const a = t.attributions[key]
  if (!a) return 0
  return awardValue(t, a[role]).perPlayer
}

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
