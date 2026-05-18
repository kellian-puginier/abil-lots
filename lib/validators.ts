import type { Tournament, CategoryCode } from '@/types/tournament'
import { generateSeriesKeys } from '@/lib/series'
import {
  valuePerPlayer,
  stockRemaining,
} from '@/lib/derivations'

export type AlertCode = 'V1' | 'V2' | 'V3' | 'V4' | 'V5'
export type AlertSeverity = 'info' | 'warn' | 'error'

export interface Alert {
  code: AlertCode
  severity: AlertSeverity
  key?: string
  stockItemId?: string
  message: string
}

const CODES: readonly CategoryCode[] = ['SH', 'SD', 'DH', 'DD', 'DMX']

export function runValidators(t: Tournament): Alert[] {
  const alerts: Alert[] = []

  // V1 — finalist > winner
  for (const [key, a] of Object.entries(t.attributions)) {
    const winnerTotal   = sumRoleTotal(t, a.winner)
    const finalistTotal = sumRoleTotal(t, a.finalist)
    if (winnerTotal > 0 && finalistTotal > winnerTotal) {
      alerts.push({ code: 'V1', severity: 'warn', key, message: `Le finaliste de ${key} est plus doté que le vainqueur.` })
    }
  }

  // V2 — ELITE per-player < any numbered series winner
  for (const code of CODES) {
    const cfg = t.categories[code]
    const keys = generateSeriesKeys(cfg.seriesCount)
    const eliteKey = `${code}-ELITE`
    const eliteVal = valuePerPlayer(t, eliteKey, 'winner')
    for (const k of keys.slice(1)) {
      const v = valuePerPlayer(t, `${code}-${k}`, 'winner')
      if (eliteVal > 0 && v > eliteVal) {
        alerts.push({ code: 'V2', severity: 'warn', key: eliteKey, message: `ELITE ${code} est moins dotée que ${k} (vainqueur).` })
        break
      }
    }
  }

  // V3 — > 30% gap between categories at the same rank
  const ranks = new Set<string>()
  for (const code of CODES) for (const k of generateSeriesKeys(t.categories[code].seriesCount)) ranks.add(k)
  for (const rank of ranks) {
    const values: number[] = []
    for (const code of CODES) {
      const k = `${code}-${rank}`
      if (t.attributions[k]) values.push(valuePerPlayer(t, k, 'winner'))
    }
    if (values.length >= 2) {
      const max = Math.max(...values)
      const positives = values.filter(v => v > 0)
      const min = positives.length ? Math.min(...positives) : 0
      if (max > 0 && (max - min) / max > 0.30) {
        alerts.push({ code: 'V3', severity: 'warn', message: `Écart > 30 % entre catégories au rang ${rank} (vainqueur).` })
      }
    }
  }

  // V4 — stock insufficient
  for (const item of t.stock) {
    const remaining = stockRemaining(t, item)
    if (remaining < 0) {
      alerts.push({ code: 'V4', severity: 'error', stockItemId: item.id, message: `Stock insuffisant pour ${item.label} (manque ${-remaining}).` })
    }
  }

  // V5 — empty series (info)
  for (const code of CODES) {
    const cfg = t.categories[code]
    for (const k of generateSeriesKeys(cfg.seriesCount)) {
      const key = `${code}-${k}`
      const a = t.attributions[key]
      if (!a || (a.winner.length === 0 && a.finalist.length === 0)) {
        alerts.push({ code: 'V5', severity: 'info', key, message: `Série ${key} non dotée.` })
      }
    }
  }

  return alerts
}

function sumRoleTotal(t: Tournament, refs: { stockItemId: string; count: number }[]): number {
  let s = 0
  for (const ref of refs) {
    const item = t.stock.find(x => x.id === ref.stockItemId)
    if (!item) continue
    const v = item.amount ?? item.unitValue ?? 0
    s += v * ref.count
  }
  return s
}
