import type { StockItem } from '@/types/tournament'
import { ColorChip } from './ColorChip'
import { LOT_LABEL } from '@/lib/lot-colors'

export function LotBadge({ item, count = 1 }: { item: StockItem; count?: number }) {
  const value = item.amount ?? item.unitValue ?? 0
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted text-sm" aria-label={`${LOT_LABEL[item.kind]} ${item.label}, valeur ${value} euros, quantité ${count}`}>
      <ColorChip kind={item.kind} />
      <span className="font-medium">{item.label}</span>
      {count > 1 && <span className="text-muted-foreground text-xs">×{count}</span>}
    </span>
  )
}
