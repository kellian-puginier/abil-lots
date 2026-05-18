import { describe, it, expect } from 'vitest'
import {
  stockItemValue,
  stockUsed,
  stockRemaining,
  cellTotalValue,
  valuePerPlayer,
  categoryProgress,
  overallProgress,
  totalRecipients,
} from '@/lib/derivations'
import { defaultTournament } from '@/lib/defaults'
import type { Tournament } from '@/types/tournament'

function makeT(): Tournament {
  const t = defaultTournament(2026)
  t.stock = [
    { id: 'chq150', kind: 'cheque', label: 'Chèque 150€', amount: 150, quantity: 4 },
    { id: 'chq100', kind: 'cheque', label: 'Chèque 100€', amount: 100, quantity: 6 },
    { id: 'biere2', kind: 'biere',  label: 'Lot de 2 bières', unitValue: 10, quantity: 20 },
  ]
  t.attributions = {
    'SH-ELITE':  { winner: [{ stockItemId: 'chq150', count: 1 }], finalist: [{ stockItemId: 'chq100', count: 1 }], status: 'validated' },
    'DH-ELITE':  { winner: [{ stockItemId: 'chq150', count: 2 }], finalist: [{ stockItemId: 'chq100', count: 2 }], status: 'validated' },
    'SH-S1':     { winner: [{ stockItemId: 'biere2', count: 1 }], finalist: [],                                     status: 'draft' },
  }
  return t
}

describe('stockItemValue', () => {
  it('returns amount for cheque', () => {
    expect(stockItemValue({ id: 'x', kind: 'cheque', label: '', amount: 150, quantity: 1 })).toBe(150)
  })
  it('returns unitValue for biere', () => {
    expect(stockItemValue({ id: 'x', kind: 'biere', label: '', unitValue: 10, quantity: 1 })).toBe(10)
  })
  it('returns 0 if both missing', () => {
    expect(stockItemValue({ id: 'x', kind: 'cheque', label: '', quantity: 1 })).toBe(0)
  })
})

describe('stockUsed', () => {
  it('sums counts across attributions', () => {
    const t = makeT()
    expect(stockUsed(t, 'chq150')).toBe(3)
    expect(stockUsed(t, 'chq100')).toBe(3)
    expect(stockUsed(t, 'biere2')).toBe(1)
  })
})

describe('stockRemaining', () => {
  it('returns quantity minus used', () => {
    const t = makeT()
    expect(stockRemaining(t, t.stock[0])).toBe(1)
    expect(stockRemaining(t, t.stock[1])).toBe(3)
    expect(stockRemaining(t, t.stock[2])).toBe(19)
  })
})

describe('cellTotalValue', () => {
  it('sums value × count for both roles', () => {
    const t = makeT()
    expect(cellTotalValue(t, 'SH-ELITE')).toBe(250)
    expect(cellTotalValue(t, 'DH-ELITE')).toBe(500)
  })
})

describe('valuePerPlayer', () => {
  it('sums values regardless of count for simple', () => {
    const t = makeT()
    expect(valuePerPlayer(t, 'SH-ELITE', 'winner')).toBe(150)
    expect(valuePerPlayer(t, 'SH-ELITE', 'finalist')).toBe(100)
  })
  it('sums values regardless of count for double', () => {
    const t = makeT()
    expect(valuePerPlayer(t, 'DH-ELITE', 'winner')).toBe(150)
    expect(valuePerPlayer(t, 'DH-ELITE', 'finalist')).toBe(100)
  })
})

describe('categoryProgress', () => {
  it('counts validated series', () => {
    const t = makeT()
    const sh = categoryProgress(t, 'SH')
    expect(sh.validated).toBe(1)
    expect(sh.total).toBe(6)
  })
})

describe('overallProgress', () => {
  it('sums across categories', () => {
    const t = makeT()
    const p = overallProgress(t)
    expect(p.validated).toBe(2)
    expect(p.total).toBe(6 + 4 + 7 + 6 + 7)
  })
})

describe('totalRecipients', () => {
  it('simple series count as 2 (1 win + 1 fin), double as 4', () => {
    const t = makeT()
    // SH:6*2 + SD:4*2 + DH:7*4 + DD:6*4 + DMX:7*4 = 12 + 8 + 28 + 24 + 28 = 100
    expect(totalRecipients(t)).toBe(100)
  })
})
