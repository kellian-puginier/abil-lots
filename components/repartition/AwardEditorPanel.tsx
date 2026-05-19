'use client'
import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useStore } from '@/lib/store'
import type { CategoryCode, LotRef, SeriesAward } from '@/types/tournament'
import { LotPicker } from './LotPicker'
import { DuplicateMenu } from './DuplicateMenu'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Trophy, Medal, CheckCircle2, Copy, Trash2, Users } from 'lucide-react'
import { cellTotalValue, valuePerPlayer, valuePerGender } from '@/lib/derivations'

export function AwardEditorPanel({ open, onOpenChange, code, sKey }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  code?: CategoryCode
  sKey?: string
}) {
  const t              = useStore(s => s.tournament)
  const setLot         = useStore(s => s.setLot)
  const setLotGender   = useStore(s => s.setLotGender)
  const setGenderSplit = useStore(s => s.setGenderSplit)
  const setAwardStatus = useStore(s => s.setAwardStatus)
  const clearAward     = useStore(s => s.clearAward)
  const locked         = t.meta.locked

  const [showDuplicate, setShowDuplicate] = useState(false)
  const [showClear, setShowClear]         = useState(false)
  const [confirmSplit, setConfirmSplit]   = useState<boolean | null>(null) // pending toggle value

  if (!code || !sKey) {
    return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent /></Sheet>
  }

  const key     = `${code}-${sKey}`
  const award: SeriesAward = t.attributions[key] ?? { winner: [], finalist: [], status: 'empty' }
  const isDouble     = t.categories[code].isDouble
  const genderSplit  = !!award.genderSplit
  const mult         = (isDouble && !genderSplit) ? 2 : 1
  const total        = cellTotalValue(t, key)

  const toggleValidated = () => setAwardStatus(key, award.status === 'validated' ? 'draft' : 'validated')

  // ─── Rendu d'un rôle (vainqueur ou finaliste) ─────────────
  const renderRole = (
    role: 'winner' | 'finalist',
    icon: React.ReactNode,
    label: string,
  ) => {
    const gv = valuePerGender(t, key, role)

    if (isDouble && genderSplit) {
      // Mode H/F distingués
      const fKey = role === 'winner' ? 'winnerF' : 'finalistF'
      return (
        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-lg font-semibold">{icon} {label}</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {/* Homme */}
            <div className="rounded-md border p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-sm font-medium">👨 Homme</div>
              <LotPicker
                refs={award[role]}
                countMultiplier={1}
                readOnly={locked}
                onChange={refs => setLotGender(key, role, 'm', refs)}
              />
              {gv && gv.m > 0 && (
                <p className="text-xs text-primary font-bold tabular-nums">{gv.m.toLocaleString('fr-FR')} €/joueur</p>
              )}
            </div>
            {/* Femme */}
            <div className="rounded-md border p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-sm font-medium">👩 Femme</div>
              <LotPicker
                refs={award[fKey] ?? []}
                countMultiplier={1}
                readOnly={locked}
                onChange={refs => setLotGender(key, role, 'f', refs)}
              />
              {gv && gv.f > 0 && (
                <p className="text-xs text-primary font-bold tabular-nums">{gv.f.toLocaleString('fr-FR')} €/joueur</p>
              )}
            </div>
          </div>
        </section>
      )
    }

    // Mode classique (simple ou double non-distingué)
    const ppValue = valuePerPlayer(t, key, role)
    return (
      <section className="space-y-2">
        <h3 className="flex items-center gap-2 text-lg font-semibold">{icon} {label}</h3>
        <LotPicker
          refs={award[role]}
          countMultiplier={mult}
          readOnly={locked}
          onChange={refs => setLot(key, role, refs)}
        />
        {ppValue > 0 && (
          <p className="text-xs text-muted-foreground">
            Valeur par joueur : <span className="font-bold text-primary">{ppValue.toLocaleString('fr-FR')} €</span>
            {isDouble && <span className="ml-1">(× 2, un par joueur)</span>}
          </p>
        )}
      </section>
    )
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="sm:max-w-2xl w-full overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t.categories[code].label} · {sKey}</SheetTitle>
            <SheetDescription>
              {isDouble
                ? genderSplit
                  ? 'Lots distincts par genre — saisir les lots Homme et Femme séparément.'
                  : 'Double : chaque lot sera attribué × 2 (un par joueur).'
                : 'Simple : un seul exemplaire par lot.'}
            </SheetDescription>
          </SheetHeader>

          <div className="p-4 space-y-6">
            {/* Toggle distinguer H/F (uniquement pour les doubles) */}
            {isDouble && (
              <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 p-3">
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Distinguer les lots Homme / Femme</div>
                    <div className="text-xs text-muted-foreground">Pour le double mixte ou tout double avec lots différents par genre</div>
                  </div>
                </div>
                <Switch
                  checked={genderSplit}
                  disabled={locked}
                  onCheckedChange={(val) => setConfirmSplit(val)}
                  aria-label="Distinguer les lots par genre"
                />
              </div>
            )}

            {/* Vainqueur */}
            {renderRole('winner', <Trophy className="size-5 text-secondary" />, 'Vainqueur')}

            {/* Finaliste */}
            {renderRole('finalist', <Medal className="size-5 text-muted-foreground" />, 'Finaliste')}

            {/* Total cellule */}
            <div className="rounded-md border bg-muted/30 p-3 text-sm">
              <div className="font-medium">Total de la cellule : {total.toLocaleString('fr-FR')} €</div>
              <div className="text-xs text-muted-foreground">Coût stock total (lots × quantité).</div>
            </div>
          </div>

          <SheetFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <div className="flex gap-2">
              <Button variant="outline" disabled={locked} onClick={() => setShowDuplicate(true)}>
                <Copy className="size-4 mr-1" /> Dupliquer
              </Button>
              <Button variant="outline" disabled={locked} onClick={() => setShowClear(true)}>
                <Trash2 className="size-4 mr-1" /> Vider
              </Button>
            </div>
            <Button
              onClick={toggleValidated}
              disabled={locked}
              variant={award.status === 'validated' ? 'secondary' : 'default'}
            >
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

      {/* Confirmation du changement de mode H/F */}
      <ConfirmDialog
        open={confirmSplit !== null}
        onOpenChange={(o) => !o && setConfirmSplit(null)}
        title={confirmSplit ? 'Activer le mode Homme / Femme ?' : 'Désactiver le mode Homme / Femme ?'}
        description={
          confirmSplit
            ? 'Les lots existants (vainqueur et finaliste) seront conservés comme lots de l\'Homme (× 1). Tu devras saisir les lots de la Femme séparément.'
            : 'Les lots de la Femme seront effacés. Les lots de l\'Homme passeront en mode "lot commun × 2".'
        }
        confirmLabel={confirmSplit ? 'Activer' : 'Désactiver'}
        onConfirm={() => {
          if (confirmSplit !== null) setGenderSplit(key, confirmSplit)
        }}
      />
    </>
  )
}
