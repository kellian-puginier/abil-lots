import { describe, it, expect } from 'vitest'
import { encodeSnapshot, decodeSnapshot, MAX_URL_PAYLOAD } from '@/lib/share-codec'
import { defaultTournament } from '@/lib/defaults'

describe('share-codec', () => {
  it('round-trips a default tournament', () => {
    const t = defaultTournament(2026)
    const encoded = encodeSnapshot(t)
    expect(typeof encoded).toBe('string')
    expect(encoded.length).toBeGreaterThan(0)
    const decoded = decodeSnapshot(encoded)
    expect(decoded).toEqual(t)
  })

  it('returns null on invalid input', () => {
    expect(decodeSnapshot('not-base64-lz')).toBeNull()
    expect(decodeSnapshot('')).toBeNull()
  })

  it('exposes a sane MAX_URL_PAYLOAD constant', () => {
    expect(MAX_URL_PAYLOAD).toBeGreaterThan(2000)
  })
})
