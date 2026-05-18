'use client'
import { useState } from 'react'
import type { CategoryConfig } from '@/types/tournament'
import { useStore } from '@/lib/store'
import { SeriesCountStepper } from './SeriesCountStepper'
import { generateSeriesKeys } from '@/lib/series'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'

export function CategoryConfigRow({ cfg }: { cfg: CategoryConfig }) {
  const setSeriesCount = useStore(s => s.setSeriesCount)
  const locked = useStore(s => s.tournament.meta.locked)
  const attributions = useStore(s => s.tournament.attributions)
  const [pending, setPending] = useState<number | null>(null)

  const requestChange = (next: number) => {
    if (next >= cfg.seriesCount) { setSeriesCount(cfg.code, next); return }
    const keptKeys = new Set(generateSeriesKeys(next))
    const lostKeys = generateSeriesKeys(cfg.seriesCount).filter(k => !keptKeys.has(k))
    const willLose = lostKeys.some(k => attributions[`${cfg.code}-${k}`])
    if (willLose) setPending(next)
    else setSeriesCount(cfg.code, next)
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4 p-4 rounded-lg border bg-card">
        <div>
          <div className="font-medium">{cfg.label}</div>
          <div className="text-xs text-muted-foreground">{cfg.isDouble ? 'Double' : 'Simple'} · ELITE + {cfg.seriesCount - 1} séries</div>
        </div>
        <SeriesCountStepper value={cfg.seriesCount} onChange={requestChange} disabled={locked} />
      </div>
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(o) => !o && setPending(null)}
        title="Supprimer des séries existantes ?"
        description="Certaines séries qui seront retirées contiennent déjà des attributions. Elles seront perdues."
        variant="destructive"
        confirmLabel="Supprimer"
        onConfirm={() => { if (pending !== null) setSeriesCount(cfg.code, pending) }}
      />
    </>
  )
}
