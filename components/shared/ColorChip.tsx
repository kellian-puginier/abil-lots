import type { StockItemKind } from '@/types/tournament'
import { LOT_COLOR_TOKEN } from '@/lib/lot-colors'

export function ColorChip({ kind, size = 'sm', className = '' }: { kind: StockItemKind; size?: 'sm' | 'md'; className?: string }) {
  const sz = size === 'md' ? 'size-4' : 'size-3'
  const borderClass = kind === 'volants' ? 'border border-foreground/40' : ''
  return (
    <span
      className={`inline-block rounded-sm ${sz} ${borderClass} ${className}`}
      style={{ backgroundColor: `var(--${LOT_COLOR_TOKEN[kind]})` }}
      aria-hidden
    />
  )
}
