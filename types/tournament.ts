export type CategoryCode = 'SH' | 'SD' | 'DH' | 'DD' | 'DMX'

export type StockItemKind =
  | 'cheque' | 'bon' | 'biere' | 'volants' | 'hybride' | 'accessoire'

export interface StockItem {
  id: string
  kind: StockItemKind
  label: string
  amount?: number       // valeur perçue joueur : cheque / bon (face value)
  unitValue?: number    // valeur perçue joueur : biere / volants / hybride / accessoire
  clubCost?: number     // coût réel pour le club (optionnel — défaut = valeur perçue)
  usesDotation?: boolean // ce lot est couvert par l'enveloppe de dotation équipementier
  quantity: number      // total available
}

export interface LotRef {
  stockItemId: string
  count: number         // 1 for simple, 2 for double (auto)
}

export type AwardStatus = 'empty' | 'draft' | 'validated'

export interface SeriesAward {
  winner: LotRef[]      // lots communs (simple) ou lots de l'HOMME (si genderSplit=true)
  finalist: LotRef[]    // idem
  winnerF?: LotRef[]    // lots de la FEMME — uniquement si genderSplit=true
  finalistF?: LotRef[]  // idem
  genderSplit?: boolean // distinguer les lots H/F dans la paire (double mixte)
  status: AwardStatus
  deliveredAt?: string
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
    dotationEnvelope?: number   // enveloppe de dotation équipementier (€ total disponible)
  }
  categories: Record<CategoryCode, CategoryConfig>
  stock: StockItem[]
  attributions: Record<string, SeriesAward>  // key: `${code}-${seriesKey}`
}

export const CATEGORY_CODES: readonly CategoryCode[] = ['SH', 'SD', 'DH', 'DD', 'DMX'] as const

export function seriesKey(code: CategoryCode, key: string): string {
  return `${code}-${key}`
}
