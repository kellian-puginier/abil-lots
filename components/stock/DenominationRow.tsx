'use client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import type { StockItem } from '@/types/tournament'
import { useStore } from '@/lib/store'
import { stockRemaining, stockUsed } from '@/lib/derivations'
import { ColorChip } from '@/components/shared/ColorChip'

export function DenominationRow({ item }: { item: StockItem }) {
  const upsert = useStore(s => s.upsertStockItem)
  const remove = useStore(s => s.removeStockItem)
  const t      = useStore(s => s.tournament)
  const locked = t.meta.locked
  const used = stockUsed(t, item.id)
  const remaining = stockRemaining(t, item)
  const insufficient = remaining < 0

  return (
    <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] sm:grid-cols-[auto_1.5fr_1fr_1fr_1fr_auto] items-center gap-2 p-2 rounded-md border bg-card">
      <ColorChip kind={item.kind} size="md" />
      <Input
        value={item.label}
        disabled={locked}
        onChange={e => upsert({ ...item, label: e.target.value })}
        aria-label="Libellé"
      />
      <Input
        type="number" min={0} step={1} inputMode="numeric"
        value={item.amount ?? ''} disabled={locked}
        onChange={e => upsert({ ...item, amount: Number(e.target.value) || 0 })}
        aria-label="Montant en euros"
        placeholder="€"
      />
      <Input
        type="number" min={0} step={1} inputMode="numeric"
        value={item.quantity} disabled={locked}
        onChange={e => upsert({ ...item, quantity: Number(e.target.value) || 0 })}
        aria-label="Quantité"
        placeholder="Qté"
      />
      <div className={`text-sm tabular-nums ${insufficient ? 'text-destructive font-medium' : 'text-muted-foreground'}`} aria-label={`Reste ${remaining}`}>
        {used} / {item.quantity}
      </div>
      <Button size="icon" variant="ghost" onClick={() => remove(item.id)} disabled={locked} aria-label="Supprimer cette ligne"><Trash2 className="size-4" /></Button>
    </div>
  )
}
