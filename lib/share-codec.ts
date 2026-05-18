import LZString from 'lz-string'
import type { Tournament } from '@/types/tournament'

export const MAX_URL_PAYLOAD = 8000

export function encodeSnapshot(t: Tournament): string {
  const json = JSON.stringify(t)
  return LZString.compressToEncodedURIComponent(json)
}

export function decodeSnapshot(encoded: string): Tournament | null {
  if (!encoded) return null
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded)
    if (!json) return null
    const parsed = JSON.parse(json)
    if (!parsed?.meta || typeof parsed.meta.schemaVersion !== 'number') return null
    return parsed as Tournament
  } catch {
    return null
  }
}
