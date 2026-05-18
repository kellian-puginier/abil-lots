'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import { generateSeriesKeys } from '@/lib/series'
import type { CategoryCode } from '@/types/tournament'
import { LotBadge } from '@/components/shared/LotBadge'
import { Checkbox } from '@/components/ui/checkbox'

const ORDER: CategoryCode[] = ['SH', 'SD', 'DH', 'DD', 'DMX']

export function ChecklistByCategory() {
  const t = useStore(s => s.tournament)
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  return (
    <div className="space-y-6">
      {ORDER.map(code => {
        const cfg = t.categories[code]
        const keys = generateSeriesKeys(cfg.seriesCount)
        return (
          <section key={code} className="space-y-2">
            <h2>{cfg.label} <span className="text-sm text-muted-foreground font-normal">({cfg.isDouble ? 'Double' : 'Simple'})</span></h2>
            {keys.map(sKey => {
              const key = `${code}-${sKey}`
              const a = t.attributions[key]
              return (
                <div key={key} className="rounded-md border bg-card p-3">
                  <div className="font-medium">{sKey}</div>
                  {!a || (a.winner.length === 0 && a.finalist.length === 0) ? (
                    <p className="text-sm text-muted-foreground">Non doté.</p>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-3 mt-2">
                      {(['winner', 'finalist'] as const).map(role => {
                        const refs = a[role]
                        if (refs.length === 0) return <div key={role} />
                        return (
                          <div key={role} className="space-y-1">
                            <div className="text-xs uppercase text-muted-foreground">{role === 'winner' ? 'Vainqueur' : 'Finaliste'}</div>
                            <ul className="space-y-1">
                              {refs.map((ref, i) => {
                                const item = t.stock.find(x => x.id === ref.stockItemId)
                                if (!item) return null
                                const id = `${key}-${role}-${i}`
                                return (
                                  <li key={id} className="flex items-center gap-2">
                                    <Checkbox id={id} checked={!!checked[id]} onCheckedChange={() => setChecked(c => ({ ...c, [id]: !c[id] }))} />
                                    <label htmlFor={id} className="flex items-center gap-2 text-sm cursor-pointer"><LotBadge item={item} count={ref.count} /></label>
                                  </li>
                                )
                              })}
                            </ul>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </section>
        )
      })}
    </div>
  )
}
