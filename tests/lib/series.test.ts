import { describe, it, expect } from 'vitest'
import { generateSeriesKeys } from '@/lib/series'

describe('generateSeriesKeys', () => {
  it('returns [ELITE] for seriesCount=1', () => {
    expect(generateSeriesKeys(1)).toEqual(['ELITE'])
  })

  it('returns [ELITE, S1] for seriesCount=2', () => {
    expect(generateSeriesKeys(2)).toEqual(['ELITE', 'S1'])
  })

  it('returns [ELITE, S1, ..., S5] for seriesCount=6', () => {
    expect(generateSeriesKeys(6)).toEqual(['ELITE', 'S1', 'S2', 'S3', 'S4', 'S5'])
  })

  it('throws for seriesCount < 1', () => {
    expect(() => generateSeriesKeys(0)).toThrow()
  })
})
