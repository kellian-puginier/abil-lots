'use client'
import { Button } from '@/components/ui/button'
import { Minus, Plus } from 'lucide-react'

export function SeriesCountStepper({ value, onChange, min = 1, max = 10, disabled }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; disabled?: boolean
}) {
  return (
    <div className="inline-flex items-center gap-2">
      <Button size="icon" variant="outline" onClick={() => onChange(Math.max(min, value - 1))} disabled={disabled || value <= min} aria-label="Diminuer le nombre de tableaux"><Minus className="size-4" /></Button>
      <span className="w-8 text-center tabular-nums font-medium">{value}</span>
      <Button size="icon" variant="outline" onClick={() => onChange(Math.min(max, value + 1))} disabled={disabled || value >= max} aria-label="Augmenter le nombre de tableaux"><Plus className="size-4" /></Button>
    </div>
  )
}
