'use client'
import { StockSection } from '@/components/stock/StockSection'
import type { StockItemKind } from '@/types/tournament'

const KINDS: StockItemKind[] = ['cheque', 'bon', 'biere', 'volants', 'hybride', 'accessoire']

export default function Page() {
  return (
    <div className="space-y-8 max-w-4xl">
      <header>
        <h1>Stock</h1>
        <p className="text-muted-foreground">Saisis les lots disponibles. Le stock se décrémente à mesure que tu attribues.</p>
      </header>
      {KINDS.map(k => <StockSection key={k} kind={k} />)}
    </div>
  )
}
