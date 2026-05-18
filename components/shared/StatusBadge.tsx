import type { AwardStatus } from '@/types/tournament'
import { CircleDashed, CircleEllipsis, CircleCheck } from 'lucide-react'

const META: Record<AwardStatus, { label: string; classes: string; Icon: typeof CircleDashed }> = {
  empty:     { label: 'Vide',     classes: 'text-muted-foreground bg-muted',  Icon: CircleDashed },
  draft:     { label: 'En cours', classes: 'text-secondary-foreground bg-secondary', Icon: CircleEllipsis },
  validated: { label: 'Validé',   classes: 'text-emerald-700 bg-emerald-100', Icon: CircleCheck },
}

export function StatusBadge({ status }: { status: AwardStatus }) {
  const { label, classes, Icon } = META[status]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${classes}`} aria-label={`Statut : ${label}`}>
      <Icon className="size-3" aria-hidden /> {label}
    </span>
  )
}
