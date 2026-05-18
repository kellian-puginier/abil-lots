import { describe, it, expect, beforeEach } from 'vitest'
import { useStore } from '@/lib/store'

describe('store actions', () => {
  beforeEach(() => {
    localStorage.clear()
    useStore.getState().resetToDefaults()
  })

  it('initializes with default tournament', () => {
    const t = useStore.getState().tournament
    expect(t.categories.SH.seriesCount).toBe(6)
  })

  it('setSeriesCount mutates and purges removed series', () => {
    const { setSeriesCount, setAward } = useStore.getState()
    setAward('SH', 'S5', { winner: [], finalist: [], status: 'validated' })
    setSeriesCount('SH', 3) // ELITE, S1, S2 — S5 must be purged
    const t = useStore.getState().tournament
    expect(t.categories.SH.seriesCount).toBe(3)
    expect(t.attributions['SH-S5']).toBeUndefined()
  })

  it('upsertStockItem adds and updates by id', () => {
    const { upsertStockItem } = useStore.getState()
    upsertStockItem({ id: 'a', kind: 'cheque', label: '150€', amount: 150, quantity: 4 })
    upsertStockItem({ id: 'a', kind: 'cheque', label: '150€', amount: 150, quantity: 7 })
    expect(useStore.getState().tournament.stock.length).toBe(1)
    expect(useStore.getState().tournament.stock[0].quantity).toBe(7)
  })

  it('setLocked toggles meta.locked', () => {
    useStore.getState().setLocked(true)
    expect(useStore.getState().tournament.meta.locked).toBe(true)
  })

  it('toggleDelivered sets and clears deliveredAt', () => {
    const { setAward, toggleDelivered } = useStore.getState()
    setAward('SH', 'ELITE', { winner: [], finalist: [], status: 'validated' })
    toggleDelivered('SH-ELITE')
    expect(useStore.getState().tournament.attributions['SH-ELITE'].deliveredAt).toBeDefined()
    toggleDelivered('SH-ELITE')
    expect(useStore.getState().tournament.attributions['SH-ELITE'].deliveredAt).toBeUndefined()
  })
})
