'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useStore } from '@/lib/store'
import { generateSeriesKeys } from '@/lib/series'
import type { CategoryCode } from '@/types/tournament'
import { CheckCircle2, Grid2x2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const ORDER: CategoryCode[] = ['SH', 'SD', 'DH', 'DD', 'DMX']

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  currentCode: CategoryCode
  currentSKey: string
  onSelect: (code: CategoryCode, sKey: string) => void
}

/** Couleur de fond du bouton selon le statut */
function seriesButtonClass(status: 'delivered' | 'validated' | 'draft' | 'empty', isActive: boolean) {
  if (isActive) return 'ring-2 ring-primary bg-primary/10 font-bold'
  if (status === 'delivered') return 'bg-emerald-500 text-white hover:bg-emerald-600'
  if (status === 'validated') return 'border-2 border-emerald-500 text-emerald-700 hover:bg-emerald-50'
  if (status === 'draft')    return 'bg-secondary/40 text-secondary-foreground hover:bg-secondary/60'
  return 'bg-muted text-muted-foreground hover:bg-muted/80'
}

export function SeriesSelector({ open, onOpenChange, currentCode, currentSKey, onSelect }: Props) {
  const t = useStore(s => s.tournament)

  const handleSelect = (code: CategoryCode, sKey: string) => {
    onSelect(code, sKey)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Choisir une série</DialogTitle>
        </DialogHeader>

        {/* Légende */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pb-1 border-b">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded bg-emerald-500" /> Remis
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded border-2 border-emerald-500" /> Validé
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded bg-secondary/40" /> En cours
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded bg-muted" /> Non doté
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded ring-2 ring-primary bg-primary/10" /> Série active
          </span>
        </div>

        {/* Grille des catégories */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {ORDER.map(code => {
            const cfg = t.categories[code]
            const keys = generateSeriesKeys(cfg.seriesCount)
            return (
              <div key={code} className="flex flex-col gap-1.5">
                {/* En-tête catégorie */}
                <div className="text-center">
                  <div className="font-semibold text-sm leading-tight">{cfg.label}</div>
                  <div className="text-[10px] text-muted-foreground">{cfg.isDouble ? 'Double' : 'Simple'}</div>
                </div>

                {/* Boutons des séries */}
                {keys.map(sKey => {
                  const aKey = `${code}-${sKey}`
                  const award = t.attributions[aKey]
                  const isActive = code === currentCode && sKey === currentSKey

                  let status: 'delivered' | 'validated' | 'draft' | 'empty' = 'empty'
                  if (award?.deliveredAt)            status = 'delivered'
                  else if (award?.status === 'validated') status = 'validated'
                  else if (award?.status === 'draft')     status = 'draft'

                  return (
                    <button
                      key={sKey}
                      type="button"
                      onClick={() => handleSelect(code, sKey)}
                      aria-label={`${cfg.label} · ${sKey}${status === 'delivered' ? ' (remis)' : ''}`}
                      aria-pressed={isActive}
                      className={cn(
                        'w-full rounded-md px-2 py-2.5 text-sm transition-colors',
                        'flex items-center justify-between gap-1',
                        seriesButtonClass(status, isActive),
                      )}
                    >
                      <span className="font-medium">{sKey}</span>
                      {status === 'delivered' && <CheckCircle2 className="size-3.5 shrink-0" aria-hidden />}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** Bouton déclencheur à placer dans la barre de cérémonie */
export function SeriesSelectorTrigger({
  categoryLabel, sKey, onClick,
}: { categoryLabel: string; sKey: string; onClick: () => void }) {
  return (
    <Button
      variant="outline"
      size="lg"
      onClick={onClick}
      className="h-14 gap-2 font-display text-lg"
      aria-label="Ouvrir le sélecteur de série"
    >
      <Grid2x2 className="size-5" />
      <span>{categoryLabel}</span>
      <span className="text-muted-foreground">·</span>
      <span>{sKey}</span>
    </Button>
  )
}
