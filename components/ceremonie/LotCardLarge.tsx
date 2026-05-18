import type { StockItem } from '@/types/tournament'
import { ColorChip } from '@/components/shared/ColorChip'

export function LotCardLarge({ item, count }: { item: StockItem; count: number }) {
  const value = item.amount ?? item.unitValue ?? 0
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-card border-2 border-foreground/10">
      <ColorChip kind={item.kind} size="md" className="!size-8" />
      <div className="flex-1">
        <div className="font-display text-2xl md:text-3xl leading-tight">{item.label}</div>
        <div className="text-muted-foreground text-lg">{value.toLocaleString('fr-FR')} €</div>
      </div>
      {count > 1 && <div className="font-display text-3xl md:text-4xl text-primary">× {count}</div>}
    </div>
  )
}
