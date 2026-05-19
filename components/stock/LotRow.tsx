'use client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Trash2 } from 'lucide-react'
import type { StockItem } from '@/types/tournament'
import { useStore } from '@/lib/store'
import { stockRemaining, stockUsed, stockItemValue } from '@/lib/derivations'
import { ColorChip } from '@/components/shared/ColorChip'

export function LotRow({ item }: { item: StockItem }) {
  const upsert = useStore(s => s.upsertStockItem)
  const remove = useStore(s => s.removeStockItem)
  const t      = useStore(s => s.tournament)
  const locked = t.meta.locked
  const used = stockUsed(t, item.id)
  const remaining = stockRemaining(t, item)
  const insufficient = remaining < 0
  const perceivedValue = stockItemValue(item)

  return (
    <div className="rounded-md border bg-card p-2 space-y-2">
      {/* Ligne principale */}
      <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] sm:grid-cols-[auto_2fr_1fr_1fr_1fr_auto] items-center gap-2">
        <ColorChip kind={item.kind} size="md" />
        <Input
          value={item.label} disabled={locked}
          onChange={e => upsert({ ...item, label: e.target.value })}
          aria-label="Libellé" placeholder="Libellé"
        />
        <div className="flex flex-col gap-0.5">
          <Input
            type="number" min={0} step={0.01} inputMode="decimal"
            value={item.unitValue ?? ''} disabled={locked}
            onChange={e => upsert({ ...item, unitValue: Number(e.target.value) || 0 })}
            aria-label="Valeur perçue joueur (€)" placeholder="Valeur €"
            className="text-xs"
          />
          <span className="text-[10px] text-muted-foreground text-center leading-none">Valeur joueur</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <Input
            type="number" min={0} step={0.01} inputMode="decimal"
            value={item.clubCost ?? ''} disabled={locked}
            onChange={e => {
              const v = Number(e.target.value)
              upsert({ ...item, clubCost: v || undefined })
            }}
            aria-label="Coût réel pour le club (€)"
            placeholder={perceivedValue > 0 ? `${perceivedValue} (=val.)` : 'Coût club'}
            className="text-xs"
          />
          <span className="text-[10px] text-muted-foreground text-center leading-none">Coût club</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <Input
            type="number" min={0} step={1} inputMode="numeric"
            value={item.quantity} disabled={locked}
            onChange={e => upsert({ ...item, quantity: Number(e.target.value) || 0 })}
            aria-label="Quantité" placeholder="Qté"
            className="text-xs"
          />
          <span className={`text-[10px] tabular-nums ${insufficient ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
            {used}/{item.quantity}
          </span>
        </div>
        <Button size="icon" variant="ghost" onClick={() => remove(item.id)} disabled={locked} aria-label="Supprimer">
          <Trash2 className="size-4" />
        </Button>
      </div>

      {/* Case dotation */}
      <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none pl-6">
        <Checkbox
          checked={!!item.usesDotation}
          disabled={locked}
          onCheckedChange={v => upsert({ ...item, usesDotation: !!v })}
          aria-label="Couvert par l'enveloppe de dotation équipementier"
        />
        Couvert par la dotation équipementier
      </label>
    </div>
  )
}
