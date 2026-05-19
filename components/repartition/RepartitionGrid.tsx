'use client'
import { useState } from 'react'
import type { CategoryCode } from '@/types/tournament'
import { useStore } from '@/lib/store'
import { generateSeriesKeys } from '@/lib/series'
import { LOT_COLOR_TOKEN, LOT_LABEL } from '@/lib/lot-colors'
import type { StockItemKind } from '@/types/tournament'
import { CellPreview, type ViewMode } from './CellPreview'
import { AwardEditorPanel } from './AwardEditorPanel'
import { Button } from '@/components/ui/button'
import { AlignJustify, LayoutGrid } from 'lucide-react'

const ORDER: CategoryCode[] = ['SH', 'SD', 'DH', 'DD', 'DMX']

/* ─── Légende couleurs (mode compact) ─────────────────────── */
const ALL_KINDS: StockItemKind[] = ['cheque', 'bon', 'biere', 'volants', 'hybride', 'accessoire']

function textOnBg(kind: StockItemKind) {
  return kind === 'biere' || kind === 'volants' || kind === 'hybride'
    ? 'text-foreground' : 'text-white'
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      <span className="font-medium">Légende :</span>
      {ALL_KINDS.map(kind => (
        <span key={kind} className="inline-flex items-center gap-1">
          <span
            className={`inline-block size-3 rounded-sm border border-black/10 ${textOnBg(kind)}`}
            style={{ backgroundColor: `var(--${LOT_COLOR_TOKEN[kind]})` }}
            aria-hidden
          />
          {LOT_LABEL[kind]}
        </span>
      ))}
      <span className="ml-2 text-[10px]">
        🏆 Vainqueur · 🥈 Finaliste · <span className="font-bold text-primary">€/j</span> = euros par joueur
      </span>
    </div>
  )
}

/* ─── Grille principale ────────────────────────────────────── */
export function RepartitionGrid() {
  const categories = useStore(s => s.tournament.categories)
  const [editing, setEditing] = useState<{ code: CategoryCode; sKey: string } | null>(null)
  const [mode, setMode] = useState<ViewMode>('compact')

  const maxSeries = Math.max(...ORDER.map(c => categories[c].seriesCount))
  const headerKeys = generateSeriesKeys(maxSeries)

  /* Largeur de colonne selon le mode */
  const colClass = mode === 'compact' ? 'min-w-[120px]' : 'min-w-[210px]'

  return (
    <>
      {/* Barre d'outils */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-2 no-print">
        <Legend />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMode(m => m === 'compact' ? 'detail' : 'compact')}
          aria-label={mode === 'compact' ? 'Passer en mode détaillé' : 'Passer en mode compact'}
        >
          {mode === 'compact'
            ? <><LayoutGrid className="size-4 mr-1.5" /> Mode détaillé</>
            : <><AlignJustify className="size-4 mr-1.5" /> Mode compact</>}
        </Button>
      </div>

      {/* Grille */}
      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full border-separate border-spacing-2">
          <thead>
            <tr>
              <th className="sticky left-0 bg-background z-10 text-left text-xs uppercase tracking-wider text-muted-foreground min-w-[120px]">
                Catégorie
              </th>
              {headerKeys.map(k => (
                <th key={k} className={`text-xs uppercase tracking-wider text-muted-foreground ${colClass}`}>
                  {k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ORDER.map(code => {
              const cfg = categories[code]
              const keys = generateSeriesKeys(cfg.seriesCount)
              return (
                <tr key={code}>
                  <th className="sticky left-0 bg-background z-10 text-left align-middle font-medium pr-2">
                    <div className="text-sm">{cfg.label}</div>
                    <div className="text-xs text-muted-foreground font-normal">
                      {cfg.isDouble ? 'Double' : 'Simple'}
                    </div>
                  </th>
                  {headerKeys.map(k => (
                    <td key={k} className="align-top">
                      {keys.includes(k)
                        ? (
                          <CellPreview
                            code={code}
                            sKey={k}
                            mode={mode}
                            onOpen={() => setEditing({ code, sKey: k })}
                          />
                        ) : (
                          <div className="min-h-[80px] rounded-md border border-dashed opacity-30" aria-hidden />
                        )}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <AwardEditorPanel
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
        code={editing?.code}
        sKey={editing?.sKey}
      />
    </>
  )
}
