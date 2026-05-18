'use client'
import { useStore } from '@/lib/store'
import type { StockItemKind, StockItem } from '@/types/tournament'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { LOT_LABEL } from '@/lib/lot-colors'
import { ColorChip } from '@/components/shared/ColorChip'
import { DenominationRow } from './DenominationRow'
import { LotRow } from './LotRow'

const DENOM_KINDS: StockItemKind[] = ['cheque', 'bon']

function uid(): string { return Math.random().toString(36).slice(2, 10) }

export function StockSection({ kind }: { kind: StockItemKind }) {
  const stock = useStore(s => s.tournament.stock).filter(x => x.kind === kind)
  const upsert = useStore(s => s.upsertStockItem)
  const locked = useStore(s => s.tournament.meta.locked)
  const isDenom = DENOM_KINDS.includes(kind)

  const add = () => {
    const base: StockItem = isDenom
      ? { id: uid(), kind, label: kind === 'cheque' ? 'Chèque' : "Bon d'achat", amount: 0, quantity: 0 }
      : { id: uid(), kind, label: '', unitValue: 0, quantity: 0 }
    upsert(base)
  }

  const total = stock.reduce((sum, x) => sum + ((x.amount ?? x.unitValue ?? 0) * x.quantity), 0)

  return (
    <section className="space-y-3">
      <header className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="flex items-center gap-2"><ColorChip kind={kind} size="md" /> {LOT_LABEL[kind]}</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground tabular-nums">Total : {total.toLocaleString('fr-FR')} €</span>
          <Button size="sm" onClick={add} disabled={locked}><Plus className="size-4 mr-1" /> Ajouter</Button>
        </div>
      </header>
      <div className="space-y-2">
        {stock.length === 0 && <p className="text-sm text-muted-foreground">Aucune entrée. Clique sur Ajouter pour commencer.</p>}
        {stock.map(item => isDenom ? <DenominationRow key={item.id} item={item} /> : <LotRow key={item.id} item={item} />)}
      </div>
    </section>
  )
}
