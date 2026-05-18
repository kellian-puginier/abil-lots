'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import type { LotRef } from '@/types/tournament'
import { LotBadge } from '@/components/shared/LotBadge'
import { Button } from '@/components/ui/button'
import { Plus, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { stockRemaining } from '@/lib/derivations'

interface Props {
  refs: LotRef[]
  countMultiplier: number
  readOnly?: boolean
  onChange: (refs: LotRef[]) => void
}

export function LotPicker({ refs, countMultiplier, readOnly, onChange }: Props) {
  const t = useStore(s => s.tournament)
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const filtered = t.stock.filter(s => s.label.toLowerCase().includes(filter.toLowerCase()))

  const add = (id: string) => {
    onChange([...refs, { stockItemId: id, count: countMultiplier }])
    setOpen(false)
  }
  const remove = (idx: number) => onChange(refs.filter((_, i) => i !== idx))

  return (
    <div className="space-y-2">
      <ul className="flex flex-wrap gap-2">
        {refs.map((ref, idx) => {
          const item = t.stock.find(x => x.id === ref.stockItemId)
          if (!item) return null
          return (
            <li key={idx} className="flex items-center gap-1">
              <LotBadge item={item} count={ref.count} />
              {!readOnly && (
                <button type="button" onClick={() => remove(idx)} aria-label="Retirer ce lot" className="text-muted-foreground hover:text-destructive">
                  <X className="size-4" />
                </button>
              )}
            </li>
          )
        })}
      </ul>
      {!readOnly && (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-4 mr-1" /> Ajouter un lot
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Choisir un lot</DialogTitle></DialogHeader>
          <Input placeholder="Filtrer…" value={filter} onChange={(e) => setFilter(e.target.value)} />
          <ul className="max-h-80 overflow-y-auto divide-y">
            {filtered.length === 0 && <li className="p-3 text-sm text-muted-foreground">Aucun lot en stock. Ajoute-en dans la page Stock.</li>}
            {filtered.map(item => {
              const remaining = stockRemaining(t, item)
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className="w-full text-left p-3 hover:bg-accent flex items-center justify-between"
                    onClick={() => add(item.id)}
                    aria-label={`Ajouter ${item.label}`}
                  >
                    <LotBadge item={item} />
                    <span className={`text-xs tabular-nums ${remaining < countMultiplier ? 'text-destructive' : 'text-muted-foreground'}`}>
                      reste {remaining}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  )
}
