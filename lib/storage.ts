import type { Tournament } from '@/types/tournament'

export const STORAGE_KEY = 'abil-prizes:v1'
const SUPPORTED_VERSION = 1

export function loadTournament(): Tournament | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.meta?.schemaVersion !== SUPPORTED_VERSION) return null
    return parsed as Tournament
  } catch {
    return null
  }
}

export function saveTournament(t: Tournament): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(t))
  } catch {
    // quota / private mode — ignore silently
  }
}
