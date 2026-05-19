import { create } from 'zustand'
import type {
  Tournament, CategoryCode, StockItem, SeriesAward, LotRef, CategoryConfig,
} from '@/types/tournament'
import { defaultTournament } from '@/lib/defaults'
import { generateSeriesKeys } from '@/lib/series'
import { loadTournament, saveTournament } from '@/lib/storage'

interface StoreState {
  tournament: Tournament
  hydrated: boolean

  hydrate: () => void
  resetToDefaults: () => void
  replaceTournament: (t: Tournament) => void

  setName: (name: string) => void
  setYear: (year: number) => void
  setLocked: (locked: boolean) => void
  setDotationEnvelope: (amount: number | undefined) => void

  setSeriesCount: (code: CategoryCode, count: number) => void

  upsertStockItem: (item: StockItem) => void
  removeStockItem: (id: string) => void

  setAward: (code: CategoryCode, seriesKey: string, award: SeriesAward) => void
  setLot: (key: string, role: 'winner' | 'finalist', refs: LotRef[]) => void
  setAwardStatus: (key: string, status: SeriesAward['status']) => void
  toggleDelivered: (key: string) => void
  duplicateAward: (sourceKey: string, targetKeys: string[]) => void
  clearAward: (key: string) => void
}

let saveTimer: ReturnType<typeof setTimeout> | null = null
function scheduleSave(t: Tournament) {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(
    () => saveTournament({ ...t, meta: { ...t.meta, savedAt: new Date().toISOString() } }),
    500,
  )
}

function withSave(t: Tournament): Tournament {
  scheduleSave(t)
  return { ...t, meta: { ...t.meta, savedAt: new Date().toISOString() } }
}

export const useStore = create<StoreState>((set) => ({
  tournament: defaultTournament(),
  hydrated: false,

  hydrate: () => {
    const loaded = loadTournament()
    set({ tournament: loaded ?? defaultTournament(), hydrated: true })
  },

  resetToDefaults: () => set({ tournament: defaultTournament() }),

  replaceTournament: (t) => set({ tournament: withSave(t) }),

  setName: (name) =>
    set(s => ({ tournament: withSave({ ...s.tournament, meta: { ...s.tournament.meta, name } }) })),

  setYear: (year) =>
    set(s => ({ tournament: withSave({ ...s.tournament, meta: { ...s.tournament.meta, year } }) })),

  setLocked: (locked) =>
    set(s => ({ tournament: withSave({ ...s.tournament, meta: { ...s.tournament.meta, locked } }) })),

  setDotationEnvelope: (amount) =>
    set(s => ({ tournament: withSave({ ...s.tournament, meta: { ...s.tournament.meta, dotationEnvelope: amount } }) })),

  setSeriesCount: (code, count) =>
    set(s => {
      const cfg: CategoryConfig = { ...s.tournament.categories[code], seriesCount: count }
      const keys = new Set(generateSeriesKeys(count))
      const attributions: Record<string, SeriesAward> = { ...s.tournament.attributions }
      for (const k of Object.keys(attributions)) {
        const dash = k.indexOf('-')
        const c = k.slice(0, dash)
        const sk = k.slice(dash + 1)
        if (c === code && !keys.has(sk)) delete attributions[k]
      }
      return { tournament: withSave({ ...s.tournament, categories: { ...s.tournament.categories, [code]: cfg }, attributions }) }
    }),

  upsertStockItem: (item) =>
    set(s => {
      const idx = s.tournament.stock.findIndex(x => x.id === item.id)
      const stock = idx >= 0
        ? s.tournament.stock.map((x, i) => i === idx ? item : x)
        : [...s.tournament.stock, item]
      return { tournament: withSave({ ...s.tournament, stock }) }
    }),

  removeStockItem: (id) =>
    set(s => ({ tournament: withSave({ ...s.tournament, stock: s.tournament.stock.filter(x => x.id !== id) }) })),

  setAward: (code, seriesKey, award) =>
    set(s => ({ tournament: withSave({ ...s.tournament, attributions: { ...s.tournament.attributions, [`${code}-${seriesKey}`]: award } }) })),

  setLot: (key, role, refs) =>
    set(s => {
      const prev: SeriesAward = s.tournament.attributions[key] ?? { winner: [], finalist: [], status: 'draft' }
      const next: SeriesAward = { ...prev, [role]: refs, status: prev.status === 'empty' ? 'draft' : prev.status }
      return { tournament: withSave({ ...s.tournament, attributions: { ...s.tournament.attributions, [key]: next } }) }
    }),

  setAwardStatus: (key, status) =>
    set(s => {
      const prev = s.tournament.attributions[key]
      if (!prev) return s
      const next: SeriesAward = { ...prev, status }
      return { tournament: withSave({ ...s.tournament, attributions: { ...s.tournament.attributions, [key]: next } }) }
    }),

  toggleDelivered: (key) =>
    set(s => {
      const prev = s.tournament.attributions[key]
      if (!prev) return s
      const next: SeriesAward = { ...prev, deliveredAt: prev.deliveredAt ? undefined : new Date().toISOString() }
      return { tournament: withSave({ ...s.tournament, attributions: { ...s.tournament.attributions, [key]: next } }) }
    }),

  duplicateAward: (sourceKey, targetKeys) =>
    set(s => {
      const src = s.tournament.attributions[sourceKey]
      if (!src) return s
      const attributions = { ...s.tournament.attributions }
      for (const k of targetKeys) {
        // Déduire la catégorie cible depuis la clé (ex: "DH-ELITE" → "DH")
        const targetCode = k.split('-')[0] as CategoryCode
        const isDouble = s.tournament.categories[targetCode]?.isDouble ?? false
        const mult = isDouble ? 2 : 1
        // Normaliser le count selon le type de la catégorie cible
        attributions[k] = {
          winner:   src.winner.map(r => ({ ...r, count: mult })),
          finalist: src.finalist.map(r => ({ ...r, count: mult })),
          status: 'draft',
        }
      }
      return { tournament: withSave({ ...s.tournament, attributions }) }
    }),

  clearAward: (key) =>
    set(s => {
      const attributions = { ...s.tournament.attributions }
      delete attributions[key]
      return { tournament: withSave({ ...s.tournament, attributions }) }
    }),
}))
