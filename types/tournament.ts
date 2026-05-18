export type CategoryCode = 'SH' | 'SD' | 'DH' | 'DD' | 'DMX'

export type StockItemKind =
  | 'cheque' | 'bon' | 'biere' | 'volants' | 'hybride' | 'accessoire'

export interface StockItem {
  id: string
  kind: StockItemKind
  label: string
  amount?: number       // for cheque / bon: face value in EUR
  unitValue?: number    // for biere / volants / hybride / accessoire
  quantity: number      // total available
}

export interface LotRef {
  stockItemId: string
  count: number         // 1 for simple, 2 for double (auto)
}

export type AwardStatus = 'empty' | 'draft' | 'validated'

export interface SeriesAward {
  winner: LotRef[]
  finalist: LotRef[]
  status: AwardStatus
  deliveredAt?: string  // ISO timestamp
}

export interface CategoryConfig {
  code: CategoryCode
  label: string
  isDouble: boolean
  seriesCount: number   // includes ELITE
}

export interface Tournament {
  meta: {
    name: string
    year: number
    savedAt: string
    locked: boolean
    schemaVersion: 1
  }
  categories: Record<CategoryCode, CategoryConfig>
  stock: StockItem[]
  attributions: Record<string, SeriesAward>  // key: `${code}-${seriesKey}`
}

export const CATEGORY_CODES: readonly CategoryCode[] = ['SH', 'SD', 'DH', 'DD', 'DMX'] as const

export function seriesKey(code: CategoryCode, key: string): string {
  return `${code}-${key}`
}
