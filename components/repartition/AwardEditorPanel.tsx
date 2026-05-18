'use client'
import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useStore } from '@/lib/store'
import type { CategoryCode, LotRef, SeriesAward } from '@/types/tournament'
import { LotPicker } from './LotPicker'
import { DuplicateMenu } from './DuplicateMenu'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Trophy, Medal, CheckCircle2, Copy, Trash2 } from 'lucide-react'
import { cellTotalValue, valuePerPlayer } from '@/lib/derivations'

export function AwardEditorPanel({ open, onOpenChange, code, sKey }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  code?: CategoryCode
  sKey?: string
}) {
  const t = useStore(s => s.tournament)
  const setLot = useStore(s => s.setLot)
  const setAwardStatus = useStore(s => s.setAwardStatus)
  const clearAward = useStore(s => s.clearAward)
  const locked = t.meta.locked

  const [showDuplicate, setShowDuplicate] = useState(false)
  const [showClear, setShowClear] = useState(false)

  if (!code || !sKey) {
    return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent /></Sheet>
  }

  const key = `${code}-${sKey}`
  const award: SeriesAward = t.attributions[key] ?? { winner: [], finalist: [], status: 'empty' }
  const isDouble = t.categories[code].isDouble
  const mult = isDouble ? 2 : 1
  const total = cellTotalValue(t, key)

  const updateRefs = (role: 'winner' | 'finalist', refs: LotRef[]) => setLot(key, role, refs)
  const toggleValidated = () => setAwardStatus(key, award.status === 'validated' ? 'draft' : 'validated')

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="sm:max-w-lg w-full overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t.categories[code].label} · {sKey}</SheetTitle>
            <SheetDescription>
              {isDouble ? 'Double : chaque lot sera attribué × 2 (un par joueur).' : 'Simple : un seul exemplaire par lot.'}
            </SheetDescription>
          </SheetHeader>

          <div className="p-4 space-y-6">
            <section className="space-y-2">
              <h3 className="flex items-center gap-2 text-lg font-semibold"><Trophy className="size-5 text-secondary" /> Vainqueur</h3>
              <LotPicker refs={award.winner} countMultiplier={mult} readOnly={locked} onChange={refs => updateRefs('winner', refs)} />
              <p className="text-xs text-muted-foreground">Valeur par joueur : {valuePerPlayer(t, key, 'winner').toLocaleString('fr-FR')} €</p>
            </section>

            <section className="space-y-2">
              <h3 className="flex items-center gap-2 text-lg font-semibold"><Medal className="size-5 text-muted-foreground" /> Finaliste</h3>
              <LotPicker refs={award.finalist} countMultiplier={mult} readOnly={locked} onChange={refs => updateRefs('finalist', refs)} />
              <p className="text-xs text-muted-foreground">Valeur par joueur : {valuePerPlayer(t, key, 'finalist').toLocaleString('fr-FR')} €</p>
            </section>

            <div className="rounded-md border bg-muted/30 p-3 text-sm">
              <div className="font-medium">Total de la cellule : {total.toLocaleString('fr-FR')} €</div>
              <div className="text-xs text-muted-foreground">Coût stock total (lots × quantité).</div>
            </div>
          </div>

          <SheetFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <div className="flex gap-2">
              <Button variant="outline" disabled={locked} onClick={() => setShowDuplicate(true)}><Copy className="size-4 mr-1" /> Dupliquer</Button>
              <Button variant="outline" disabled={locked} onClick={() => setShowClear(true)}><Trash2 className="size-4 mr-1" /> Vider</Button>
            </div>
            <Button onClick={toggleValidated} disabled={locked} variant={award.status === 'validated' ? 'secondary' : 'default'}>
              <CheckCircle2 className="size-4 mr-1" />
              {award.status === 'validated' ? 'Dévalider' : 'Valider la série'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <DuplicateMenu open={showDuplicate} onOpenChange={setShowDuplicate} sourceKey={key} />
      <ConfirmDialog
        open={showClear}
        onOpenChange={setShowClear}
        title="Vider cette série ?"
        description="Les lots du vainqueur et du finaliste seront supprimés."
        variant="destructive"
        confirmLabel="Vider"
        onConfirm={() => clearAward(key)}
      />
    </>
  )
}
