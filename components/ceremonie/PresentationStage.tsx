'use client'
import { useState, useMemo, useCallback } from 'react'
import type { CategoryCode } from '@/types/tournament'
import { useStore } from '@/lib/store'
import { generateSeriesKeys } from '@/lib/series'
import { LotCardLarge } from './LotCardLarge'
import { SeriesNavigator } from './SeriesNavigator'
import { ProjectorButton } from './ProjectorMode'
import { Button } from '@/components/ui/button'
import { useKeyboard } from '@/hooks/useKeyboard'
import { CheckCircle2, Trophy, Medal } from 'lucide-react'

const ORDER: CategoryCode[] = ['SH', 'SD', 'DH', 'DD', 'DMX']

export function PresentationStage() {
  const t = useStore(s => s.tournament)
  const toggleDelivered = useStore(s => s.toggleDelivered)
  const [code, setCode] = useState<CategoryCode>('SH')
  const [sIdx, setSIdx] = useState(0)
  const [projector, setProjector] = useState(false)

  const cfg = t.categories[code]
  const keys = useMemo(() => generateSeriesKeys(cfg.seriesCount), [cfg.seriesCount])
  const sKey = keys[Math.min(sIdx, keys.length - 1)]
  const key = `${code}-${sKey}`
  const a = t.attributions[key]
  const isDouble = cfg.isDouble
  const delivered = !!a?.deliveredAt

  const nextSeries = useCallback(() => setSIdx(i => Math.min(i + 1, keys.length - 1)), [keys.length])
  const prevSeries = useCallback(() => setSIdx(i => Math.max(0, i - 1)), [])

  const cycleCategory = useCallback((delta: number) => {
    const idx = ORDER.indexOf(code)
    const next = ORDER[(idx + delta + ORDER.length) % ORDER.length]
    setCode(next)
    setSIdx(0)
  }, [code])

  useKeyboard({
    'ArrowLeft':  prevSeries,
    'ArrowRight': nextSeries,
    'ArrowUp':    () => cycleCategory(-1),
    'ArrowDown':  () => cycleCategory(1),
    ' ':          () => toggleDelivered(key),
    'f':          () => setProjector(p => !p),
    'F':          () => setProjector(p => !p),
    'Escape':     () => setProjector(false),
  })

  const stage = (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <section className="space-y-2">
          <h2 className="flex items-center gap-2 text-2xl"><Trophy className="size-7 text-secondary" /> Vainqueur</h2>
          {a?.winner.length ? (
            <div className="space-y-2">
              {a.winner.map((ref, i) => {
                const it = t.stock.find(x => x.id === ref.stockItemId)
                return it ? <LotCardLarge key={i} item={it} count={ref.count} /> : null
              })}
              {isDouble && <p className="text-muted-foreground text-sm">× 2 (un par joueur)</p>}
            </div>
          ) : <p className="text-muted-foreground">Aucun lot attribué.</p>}
        </section>
        <section className="space-y-2">
          <h2 className="flex items-center gap-2 text-2xl"><Medal className="size-7 text-muted-foreground" /> Finaliste</h2>
          {a?.finalist.length ? (
            <div className="space-y-2">
              {a.finalist.map((ref, i) => {
                const it = t.stock.find(x => x.id === ref.stockItemId)
                return it ? <LotCardLarge key={i} item={it} count={ref.count} /> : null
              })}
              {isDouble && <p className="text-muted-foreground text-sm">× 2 (un par joueur)</p>}
            </div>
          ) : <p className="text-muted-foreground">Aucun lot attribué.</p>}
        </section>
      </div>
    </div>
  )

  if (projector) {
    return (
      <div className="fixed inset-0 bg-background z-50 p-8 overflow-auto">
        <div className="max-w-5xl mx-auto space-y-8">
          <header className="flex items-center justify-between">
            <h1 className="font-display text-4xl">{cfg.label} · {sKey}</h1>
            <ProjectorButton active onToggle={() => setProjector(false)} />
          </header>
          {stage}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <header className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1>Cérémonie</h1>
          <p className="text-muted-foreground text-sm">←/→ série · ↑/↓ catégorie · Espace toggle remis · F projecteur</p>
        </div>
        <ProjectorButton active={projector} onToggle={() => setProjector(p => !p)} />
      </header>
      <SeriesNavigator
        code={code}
        sKey={sKey}
        categoryLabel={cfg.label}
        onPrevSeries={prevSeries}
        onNextSeries={nextSeries}
        onPrevCategory={() => cycleCategory(-1)}
        onNextCategory={() => cycleCategory(1)}
      />
      {stage}
      <div className="flex justify-center">
        <Button
          size="lg"
          variant={delivered ? 'secondary' : 'default'}
          onClick={() => toggleDelivered(key)}
          className="h-16 text-lg"
        >
          <CheckCircle2 className="size-6 mr-2" />
          {delivered ? `Remis (${new Date(a!.deliveredAt!).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })})` : 'Lots remis'}
        </Button>
      </div>
    </div>
  )
}
