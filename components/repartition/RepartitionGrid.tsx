'use client'
import { useState } from 'react'
import type { CategoryCode } from '@/types/tournament'
import { useStore } from '@/lib/store'
import { generateSeriesKeys } from '@/lib/series'
import { CellPreview } from './CellPreview'
import { AwardEditorPanel } from './AwardEditorPanel'

const ORDER: CategoryCode[] = ['SH', 'SD', 'DH', 'DD', 'DMX']

export function RepartitionGrid() {
  const categories = useStore(s => s.tournament.categories)
  const maxSeries = Math.max(...ORDER.map(c => categories[c].seriesCount))
  const headerKeys = generateSeriesKeys(maxSeries)
  const [editing, setEditing] = useState<{ code: CategoryCode; sKey: string } | null>(null)

  return (
    <>
      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full border-separate border-spacing-2 min-w-[640px]">
          <thead>
            <tr>
              <th className="sticky left-0 bg-background z-10 text-left text-xs uppercase tracking-wider text-muted-foreground">Catégorie</th>
              {headerKeys.map(k => <th key={k} className="text-xs uppercase tracking-wider text-muted-foreground">{k}</th>)}
            </tr>
          </thead>
          <tbody>
            {ORDER.map(code => {
              const cfg = categories[code]
              const keys = generateSeriesKeys(cfg.seriesCount)
              return (
                <tr key={code}>
                  <th className="sticky left-0 bg-background z-10 text-left align-middle font-medium pr-2">
                    {cfg.label}<br/>
                    <span className="text-xs text-muted-foreground">{cfg.isDouble ? 'Double' : 'Simple'}</span>
                  </th>
                  {headerKeys.map(k => (
                    <td key={k} className="align-top">
                      {keys.includes(k)
                        ? <CellPreview code={code} sKey={k} onOpen={() => setEditing({ code, sKey: k })} />
                        : <div className="min-h-[88px] rounded-md border border-dashed opacity-40" aria-hidden />}
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
