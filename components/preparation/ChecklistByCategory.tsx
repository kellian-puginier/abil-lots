'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import { generateSeriesKeys } from '@/lib/series'
import type { CategoryCode, LotRef, SeriesAward } from '@/types/tournament'
import { LotBadge } from '@/components/shared/LotBadge'
import { Checkbox } from '@/components/ui/checkbox'

const ORDER: CategoryCode[] = ['SH', 'SD', 'DH', 'DD', 'DMX']

/** Ligne de lots cochables pour un rôle ou un genre */
function RefsBlock({
  refs, t, baseId, checked, onCheck,
}: {
  refs: LotRef[]
  t: ReturnType<typeof useStore.getState>['tournament']
  baseId: string
  checked: Record<string, boolean>
  onCheck: (id: string) => void
}) {
  if (refs.length === 0) return null
  return (
    <ul className="space-y-1">
      {refs.map((ref, i) => {
        const item = t.stock.find(x => x.id === ref.stockItemId)
        if (!item) return null
        const id = `${baseId}-${i}`
        return (
          <li key={id} className="flex items-center gap-2">
            <Checkbox
              id={id}
              checked={!!checked[id]}
              onCheckedChange={() => onCheck(id)}
            />
            <label htmlFor={id} className="flex items-center gap-2 text-sm cursor-pointer">
              <LotBadge item={item} count={ref.count} />
            </label>
          </li>
        )
      })}
    </ul>
  )
}

/** Affiche vainqueur + finaliste pour une série, avec support H/F */
function SeriesCard({
  aKey, award, t, checked, onCheck,
  sKey,
}: {
  aKey: string
  award: SeriesAward
  t: ReturnType<typeof useStore.getState>['tournament']
  checked: Record<string, boolean>
  onCheck: (id: string) => void
  sKey: string
}) {
  const genderSplit = !!award.genderSplit
  const hasLots = award.winner.length > 0 || award.finalist.length > 0 ||
    (award.winnerF ?? []).length > 0 || (award.finalistF ?? []).length > 0

  return (
    <div className="rounded-md border bg-card p-3">
      <div className="font-medium">{sKey}</div>
      {!hasLots ? (
        <p className="text-sm text-muted-foreground">Non doté.</p>
      ) : genderSplit ? (
        /* ── Mode H/F ── */
        <div className="grid sm:grid-cols-2 gap-4 mt-2">
          {/* Homme */}
          <div className="space-y-2">
            <div className="text-xs uppercase text-muted-foreground font-semibold">👨 Homme</div>
            {award.winner.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Vainqueur</div>
                <RefsBlock refs={award.winner} t={t} baseId={`${aKey}-wm`} checked={checked} onCheck={onCheck} />
              </div>
            )}
            {award.finalist.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Finaliste</div>
                <RefsBlock refs={award.finalist} t={t} baseId={`${aKey}-fm`} checked={checked} onCheck={onCheck} />
              </div>
            )}
          </div>
          {/* Femme */}
          <div className="space-y-2">
            <div className="text-xs uppercase text-muted-foreground font-semibold">👩 Femme</div>
            {(award.winnerF ?? []).length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Vainqueur</div>
                <RefsBlock refs={award.winnerF!} t={t} baseId={`${aKey}-wf`} checked={checked} onCheck={onCheck} />
              </div>
            )}
            {(award.finalistF ?? []).length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Finaliste</div>
                <RefsBlock refs={award.finalistF!} t={t} baseId={`${aKey}-ff`} checked={checked} onCheck={onCheck} />
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── Mode classique ── */
        <div className="grid sm:grid-cols-2 gap-3 mt-2">
          {(['winner', 'finalist'] as const).map(role => {
            const refs = award[role]
            if (refs.length === 0) return <div key={role} />
            return (
              <div key={role} className="space-y-1">
                <div className="text-xs uppercase text-muted-foreground">
                  {role === 'winner' ? 'Vainqueur' : 'Finaliste'}
                </div>
                <RefsBlock refs={refs} t={t} baseId={`${aKey}-${role}`} checked={checked} onCheck={onCheck} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function ChecklistByCategory() {
  const t = useStore(s => s.tournament)
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const toggle = (id: string) => setChecked(c => ({ ...c, [id]: !c[id] }))

  return (
    <div className="space-y-6">
      {ORDER.map(code => {
        const cfg  = t.categories[code]
        const keys = generateSeriesKeys(cfg.seriesCount)
        return (
          <section key={code} className="space-y-2">
            <h2>
              {cfg.label}{' '}
              <span className="text-sm text-muted-foreground font-normal">
                ({cfg.isDouble ? 'Double' : 'Simple'})
              </span>
            </h2>
            {keys.map(sKey => {
              const aKey  = `${code}-${sKey}`
              const award = t.attributions[aKey]
              if (!award) return (
                <div key={aKey} className="rounded-md border bg-card p-3">
                  <div className="font-medium">{sKey}</div>
                  <p className="text-sm text-muted-foreground">Non doté.</p>
                </div>
              )
              return (
                <SeriesCard
                  key={aKey}
                  aKey={aKey}
                  award={award}
                  t={t}
                  checked={checked}
                  onCheck={toggle}
                  sKey={sKey}
                />
              )
            })}
          </section>
        )
      })}
    </div>
  )
}
