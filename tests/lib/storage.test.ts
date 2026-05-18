import { describe, it, expect, beforeEach } from 'vitest'
import { loadTournament, saveTournament, STORAGE_KEY } from '@/lib/storage'
import { defaultTournament } from '@/lib/defaults'

describe('storage', () => {
  beforeEach(() => localStorage.clear())

  it('returns null when nothing stored', () => {
    expect(loadTournament()).toBeNull()
  })

  it('saves and loads a tournament', () => {
    const t = defaultTournament(2026)
    saveTournament(t)
    const loaded = loadTournament()
    expect(loaded).toEqual(t)
  })

  it('returns null on malformed JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    expect(loadTournament()).toBeNull()
  })

  it('returns null on wrong schema version', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ meta: { schemaVersion: 99 } }))
    expect(loadTournament()).toBeNull()
  })
})
