'use client'
import type { CategoryCode, StockItemKind } from '@/types/tournament'
import { useStore } from '@/lib/store'
import { cellTotalValue } from '@/lib/derivations'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ColorChip } from '@/components/shared/ColorChip'

export function CellPreview({ code, sKey, onOpen }: { code: CategoryCode; sKey: string; onOpen: () => void }) {
  const t = useStore(s => s.tournament)
  const key = `${code}-${sKey}`
  const award = t.attributions[key]
  const status = award?.status ?? 'empty'
  const total = cellTotalValue(t, key)

  const kinds = new Set<StockItemKind>()
  for (const r of [...(award?.winner ?? []), ...(award?.finalist ?? [])]) {
    const it = t.stock.find(x => x.id === r.stockItemId)
    if (it) kinds.add(it.kind)
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full min-h-[88px] p-2 rounded-md border bg-card hover:border-primary text-left flex flex-col gap-1 transition-colors"
      aria-label={`Modifier ${code} ${sKey}`}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{sKey}</span>
        <StatusBadge status={status} />
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        {[...kinds].map(k => <ColorChip key={k} kind={k} />)}
      </div>
      <div className="text-xs text-muted-foreground tabular-nums mt-auto">{total > 0 ? `${total.toLocaleString('fr-FR')} €` : '—'}</div>
    </button>
  )
}
