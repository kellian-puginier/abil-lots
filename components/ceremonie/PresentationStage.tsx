'use client'
import { useState, useMemo, useCallback } from 'react'
import type { CategoryCode } from '@/types/tournament'
import { useStore } from '@/lib/store'
import { generateSeriesKeys } from '@/lib/series'
import { LotCardLarge } from './LotCardLarge'
import { SeriesNavigator } from './SeriesNavigator'
import { SeriesSelector, SeriesSelectorTrigger } from './SeriesSelector'
import { ProjectorButton } from './ProjectorMode'
import { Button } from '@/components/ui/button'
import { useKeyboard } from '@/hooks/useKeyboard'
import { CheckCircle2, Trophy, Medal } from 'lucide-react'

const ORDER: CategoryCode[] = ['SH', 'SD', 'DH', 'DD', 'DMX']

export function PresentationStage() {
  const t = useStore(s => s.tournament)
  const toggleDelivered = useStore(s => s.toggleDelivered)

  const [code, setCode]         = useState<CategoryCode>('SH')
  const [sIdx, setSIdx]         = useState(0)
  const [projector, setProjector] = useState(false)
  const [selectorOpen, setSelectorOpen] = useState(false)

  const cfg  = t.categories[code]
  const keys = useMemo(() => generateSeriesKeys(cfg.seriesCount), [cfg.seriesCount])
  const sKey = keys[Math.min(sIdx, keys.length - 1)]
  const key  = `${code}-${sKey}`
  const a    = t.attributions[key]
  const isDouble = cfg.isDouble
  const delivered = !!a?.deliveredAt

  /* Navigation prev/next */
  const nextSeries = useCallback(() => setSIdx(i => Math.min(i + 1, keys.length - 1)), [keys.length])
  const prevSeries = useCallback(() => setSIdx(i => Math.max(0, i - 1)), [])

  const cycleCategory = useCallback((delta: number) => {
    const idx  = ORDER.indexOf(code)
    const next = ORDER[(idx + delta + ORDER.length) % ORDER.length]
    setCode(next)
    setSIdx(0)
  }, [code])

  /* Sélection directe depuis la modale */
  const handleSelect = useCallback((newCode: CategoryCode, newSKey: string) => {
    const newKeys = generateSeriesKeys(t.categories[newCode].seriesCount)
    setCode(newCode)
    setSIdx(newKeys.indexOf(newSKey))
  }, [t.categories])

  /* Raccourcis clavier */
  useKeyboard({
    'ArrowLeft':  prevSeries,
    'ArrowRight': nextSeries,
    'ArrowUp':    () => cycleCategory(-1),
    'ArrowDown':  () => cycleCategory(1),
    ' ':          () => toggleDelivered(key),
    's':          () => setSelectorOpen(true),
    'S':          () => setSelectorOpen(true),
    'f':          () => setProjector(p => !p),
    'F':          () => setProjector(p => !p),
    'Escape':     () => { setProjector(false); setSelectorOpen(false) },
  })

  /* ─── Rendu d'un bloc de lots (normal ou H/F) ──────────── */
  const genderSplit = !!a?.genderSplit

  const renderLots = (refs: typeof a.winner, label: string | null = null) => {
    if (!refs?.length) return null
    return (
      <div className="space-y-2">
        {label && <div className="text-base font-semibold text-muted-foreground">{label}</div>}
        {refs.map((ref, i) => {
          const it = t.stock.find(x => x.id === ref.stockItemId)
          return it ? <LotCardLarge key={i} item={it} count={ref.count} /> : null
        })}
      </div>
    )
  }

  const roleSection = (
    role: 'winner' | 'finalist',
    Icon: typeof Trophy,
    iconClass: string,
    label: string,
  ) => {
    if (!a) return <p className="text-muted-foreground">Aucun lot attribué.</p>
    const fKey = role === 'winner' ? 'winnerF' : 'finalistF'

    if (genderSplit) {
      const hasM = (a[role]?.length ?? 0) > 0
      const hasF = ((a[fKey] as typeof a.winner | undefined)?.length ?? 0) > 0
      if (!hasM && !hasF) return <p className="text-muted-foreground">Aucun lot attribué.</p>
      return (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-lg font-semibold">👨 Homme</div>
            {hasM ? renderLots(a[role]) : <p className="text-muted-foreground text-sm">—</p>}
          </div>
          <div className="space-y-2">
            <div className="text-lg font-semibold">👩 Femme</div>
            {hasF ? renderLots(a[fKey] as typeof a.winner) : <p className="text-muted-foreground text-sm">—</p>}
          </div>
        </div>
      )
    }

    const refs = a[role]
    if (!refs?.length) return <p className="text-muted-foreground">Aucun lot attribué.</p>
    return (
      <div className="space-y-2">
        {renderLots(refs)}
        {isDouble && !genderSplit && (
          <p className="text-muted-foreground text-sm">× 2 (un par joueur)</p>
        )}
      </div>
    )
  }

  /* ─── Contenu principal (lots vainqueur / finaliste) ─── */
  const stage = (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-2xl">
            <Trophy className="size-7 text-secondary" /> Vainqueur
          </h2>
          {roleSection('winner', Trophy, 'text-secondary', 'Vainqueur')}
        </section>

        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-2xl">
            <Medal className="size-7 text-muted-foreground" /> Finaliste
          </h2>
          {roleSection('finalist', Medal, 'text-muted-foreground', 'Finaliste')}
        </section>
      </div>
    </div>
  )

  /* ─── Mode projecteur plein écran ───────────────────── */
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

  /* ─── Mode normal ────────────────────────────────────── */
  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Barre supérieure */}
      <header className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1>Cérémonie</h1>
          <p className="text-muted-foreground text-sm">
            ←/→ série · ↑/↓ catégorie · S sélecteur · Espace remis · F projecteur
          </p>
        </div>
        <ProjectorButton active={projector} onToggle={() => setProjector(p => !p)} />
      </header>

      {/* Bouton sélecteur direct — EN AVANT-PREMIÈRE */}
      <div className="flex justify-center">
        <SeriesSelectorTrigger
          categoryLabel={cfg.label}
          sKey={sKey}
          onClick={() => setSelectorOpen(true)}
        />
      </div>

      {/* Navigation prev/next (toujours disponible) */}
      <SeriesNavigator
        code={code}
        sKey={sKey}
        categoryLabel={cfg.label}
        onPrevSeries={prevSeries}
        onNextSeries={nextSeries}
        onPrevCategory={() => cycleCategory(-1)}
        onNextCategory={() => cycleCategory(1)}
      />

      {/* Lots */}
      {stage}

      {/* Bouton "Lots remis" */}
      <div className="flex justify-center">
        <Button
          size="lg"
          variant={delivered ? 'secondary' : 'default'}
          onClick={() => toggleDelivered(key)}
          className="h-16 text-lg"
        >
          <CheckCircle2 className="size-6 mr-2" />
          {delivered
            ? `Remis (${new Date(a!.deliveredAt!).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })})`
            : 'Lots remis'}
        </Button>
      </div>

      {/* Modale sélecteur */}
      <SeriesSelector
        open={selectorOpen}
        onOpenChange={setSelectorOpen}
        currentCode={code}
        currentSKey={sKey}
        onSelect={handleSelect}
      />
    </div>
  )
}
