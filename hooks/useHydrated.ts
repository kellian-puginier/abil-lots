'use client'
import { useEffect } from 'react'
import { useStore } from '@/lib/store'

const FIRST_RUN_KEY = 'abil-prizes:first-run-seeded'

type Suggestion =
  | { kind: 'cheque' | 'bon'; label: string; amount: number }
  | { kind: 'biere' | 'volants' | 'hybride'; label: string; unitValue: number }

const SUGGESTIONS: Suggestion[] = [
  { kind: 'cheque',  label: 'Chèque 150€',       amount: 150 },
  { kind: 'cheque',  label: 'Chèque 100€',       amount: 100 },
  { kind: 'bon',     label: "Bon d'achat 40€",   amount: 40 },
  { kind: 'bon',     label: "Bon d'achat 35€",   amount: 35 },
  { kind: 'bon',     label: "Bon d'achat 30€",   amount: 30 },
  { kind: 'bon',     label: "Bon d'achat 25€",   amount: 25 },
  { kind: 'bon',     label: "Bon d'achat 20€",   amount: 20 },
  { kind: 'bon',     label: "Bon d'achat 15€",   amount: 15 },
  { kind: 'biere',   label: 'Lot de 2 bières',   unitValue: 0 },
  { kind: 'volants', label: 'Boîte de volants',  unitValue: 0 },
  { kind: 'hybride', label: 'Boîte hybride',     unitValue: 0 },
]

function uid(): string { return Math.random().toString(36).slice(2, 10) }

export function useHydrated(): boolean {
  const hydrated = useStore(s => s.hydrated)
  const hydrate  = useStore(s => s.hydrate)
  const stock    = useStore(s => s.tournament.stock)
  const upsert   = useStore(s => s.upsertStockItem)

  useEffect(() => { if (!hydrated) hydrate() }, [hydrated, hydrate])

  useEffect(() => {
    if (!hydrated) return
    if (typeof window === 'undefined') return
    if (localStorage.getItem(FIRST_RUN_KEY)) return
    if (stock.length > 0) { localStorage.setItem(FIRST_RUN_KEY, '1'); return }
    for (const s of SUGGESTIONS) {
      upsert({ id: uid(), quantity: 0, ...s })
    }
    localStorage.setItem(FIRST_RUN_KEY, '1')
  }, [hydrated, stock.length, upsert])

  return hydrated
}
