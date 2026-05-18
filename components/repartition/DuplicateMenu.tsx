'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { generateSeriesKeys } from '@/lib/series'
import type { CategoryCode } from '@/types/tournament'

const ORDER: CategoryCode[] = ['SH', 'SD', 'DH', 'DD', 'DMX']

export function DuplicateMenu({ open, onOpenChange, sourceKey }: { open: boolean; onOpenChange: (o: boolean) => void; sourceKey: string }) {
  const t = useStore(s => s.tournament)
  const duplicate = useStore(s => s.duplicateAward)
  const [selected, setSelected] = useState<Record<string, boolean>>({})

  const allKeys: string[] = []
  for (const code of ORDER) {
    const cfg = t.categories[code]
    for (const k of generateSeriesKeys(cfg.seriesCount)) {
      const key = `${code}-${k}`
      if (key !== sourceKey) allKeys.push(key)
    }
  }

  const toggle = (k: string) => setSelected(s => ({ ...s, [k]: !s[k] }))
  const apply = () => {
    const targets = Object.keys(selected).filter(k => selected[k])
    if (targets.length) duplicate(sourceKey, targets)
    setSelected({})
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Dupliquer {sourceKey} vers…</DialogTitle></DialogHeader>
        <div className="max-h-80 overflow-y-auto grid grid-cols-2 gap-2 pr-2">
          {allKeys.map(k => (
            <Label key={k} className="flex items-center gap-2 px-2 py-1 rounded border hover:bg-accent cursor-pointer">
              <Checkbox checked={!!selected[k]} onCheckedChange={() => toggle(k)} />
              <span className="text-sm">{k}</span>
            </Label>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={apply}>Dupliquer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
