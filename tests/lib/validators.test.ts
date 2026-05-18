import { describe, it, expect } from 'vitest'
import { runValidators } from '@/lib/validators'
import { defaultTournament } from '@/lib/defaults'
import type { Tournament } from '@/types/tournament'

function setupT(): Tournament {
  const t = defaultTournament(2026)
  t.stock = [
    { id: 'chq150', kind: 'cheque', label: '150€', amount: 150, quantity: 4 },
    { id: 'chq100', kind: 'cheque', label: '100€', amount: 100, quantity: 2 },
  ]
  return t
}

describe('V1 — finalist > winner', () => {
  it('flags when finalist value exceeds winner', () => {
    const t = setupT()
    t.attributions = {
      'SH-ELITE': {
        winner:   [{ stockItemId: 'chq100', count: 1 }],
        finalist: [{ stockItemId: 'chq150', count: 1 }],
        status: 'draft',
      },
    }
    const alerts = runValidators(t)
    expect(alerts.some(a => a.code === 'V1' && a.key === 'SH-ELITE')).toBe(true)
  })

  it('does not flag when equal', () => {
    const t = setupT()
    t.attributions = {
      'SH-ELITE': {
        winner:   [{ stockItemId: 'chq150', count: 1 }],
        finalist: [{ stockItemId: 'chq150', count: 1 }],
        status: 'draft',
      },
    }
    const alerts = runValidators(t)
    expect(alerts.some(a => a.code === 'V1')).toBe(false)
  })
})

describe('V2 — ELITE less than a numbered series', () => {
  it('flags when ELITE per-player < S1 per-player', () => {
    const t = setupT()
    t.attributions = {
      'SH-ELITE': { winner: [{ stockItemId: 'chq100', count: 1 }], finalist: [], status: 'draft' },
      'SH-S1':    { winner: [{ stockItemId: 'chq150', count: 1 }], finalist: [], status: 'draft' },
    }
    const alerts = runValidators(t)
    expect(alerts.some(a => a.code === 'V2' && a.key === 'SH-ELITE')).toBe(true)
  })
})

describe('V4 — stock insufficient', () => {
  it('flags when used > quantity', () => {
    const t = setupT()
    t.attributions = {
      'SH-ELITE': { winner: [{ stockItemId: 'chq100', count: 1 }], finalist: [], status: 'draft' },
      'SH-S1':    { winner: [{ stockItemId: 'chq100', count: 2 }], finalist: [], status: 'draft' },
    }
    const alerts = runValidators(t)
    expect(alerts.some(a => a.code === 'V4' && a.severity === 'error')).toBe(true)
  })
})

describe('V5 — empty series (informational)', () => {
  it('emits info for empty existing series', () => {
    const t = setupT()
    const alerts = runValidators(t)
    const infos = alerts.filter(a => a.code === 'V5' && a.severity === 'info')
    expect(infos.length).toBeGreaterThan(0)
  })
})
