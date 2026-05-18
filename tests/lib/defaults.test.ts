import { describe, it, expect } from 'vitest'
import { defaultTournament } from '@/lib/defaults'

describe('defaultTournament', () => {
  it('has 5 categories with expected seriesCount', () => {
    const t = defaultTournament()
    expect(t.categories.SH.seriesCount).toBe(6)
    expect(t.categories.SD.seriesCount).toBe(4)
    expect(t.categories.DH.seriesCount).toBe(7)
    expect(t.categories.DD.seriesCount).toBe(6)
    expect(t.categories.DMX.seriesCount).toBe(7)
  })

  it('marks doubles correctly', () => {
    const t = defaultTournament()
    expect(t.categories.SH.isDouble).toBe(false)
    expect(t.categories.SD.isDouble).toBe(false)
    expect(t.categories.DH.isDouble).toBe(true)
    expect(t.categories.DD.isDouble).toBe(true)
    expect(t.categories.DMX.isDouble).toBe(true)
  })

  it('has empty stock and attributions', () => {
    const t = defaultTournament()
    expect(t.stock).toEqual([])
    expect(t.attributions).toEqual({})
  })

  it('has schemaVersion 1 and locked false', () => {
    const t = defaultTournament()
    expect(t.meta.schemaVersion).toBe(1)
    expect(t.meta.locked).toBe(false)
  })

  it('name defaults to "Tour des Héraults <year>"', () => {
    const t = defaultTournament(2026)
    expect(t.meta.year).toBe(2026)
    expect(t.meta.name).toBe('Tour des Héraults 2026')
  })
})
