'use client'
import type { CategoryCode, StockItem, LotRef } from '@/types/tournament'
import { useStore } from '@/lib/store'
import { valuePerPlayer, valuePerGender } from '@/lib/derivations'
import { LOT_COLOR_TOKEN } from '@/lib/lot-colors'

export type ViewMode = 'compact' | 'detail'

const ABBREV: Record<string, string> = {
  cheque: 'Chq', bon: 'BA', biere: 'Bière',
  volants: 'Vol', hybride: 'Hyb', accessoire: 'Acc',
}

function textOnBg(kind: string) {
  return kind === 'biere' || kind === 'volants' || kind === 'hybride'
    ? 'text-foreground' : 'text-white'
}

function CompactDot({ item }: { item: StockItem }) {
  return (
    <span
      title={`${ABBREV[item.kind] ?? item.kind} — ${item.label}`}
      className="inline-block size-3 rounded-sm border border-black/10"
      style={{ backgroundColor: `var(--${LOT_COLOR_TOKEN[item.kind]})` }}
      aria-hidden
    />
  )
}

function DetailPill({ item, count }: { item: StockItem; count: number }) {
  const value = item.amount ?? item.unitValue ?? 0
  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-semibold border border-black/10 ${textOnBg(item.kind)}`}
      style={{ backgroundColor: `var(--${LOT_COLOR_TOKEN[item.kind]})` }}
    >
      {ABBREV[item.kind] ?? item.kind}
      {value > 0 && <span className="opacity-90 ml-0.5">{value}€</span>}
      {count > 1 && <span className="opacity-70 ml-0.5">×{count}</span>}
    </span>
  )
}

function StatusDot({ status }: { status: string }) {
  const cls = status === 'validated' ? 'bg-emerald-500'
    : status === 'draft'     ? 'bg-secondary'
    : 'bg-muted-foreground/30'
  return <span className={`inline-block size-2 rounded-full ${cls} shrink-0`} aria-hidden />
}

function PerPlayer({ value }: { value: number }) {
  if (value <= 0) return null
  return (
    <span className="ml-auto text-[10px] font-bold tabular-nums text-primary whitespace-nowrap">
      {value.toLocaleString('fr-FR')} €/j
    </span>
  )
}

/** Ligne de refs (mode normal ou mode H/F) */
function RefsLine({ refs, pp, mode, genderLabel }: {
  refs: LotRef[]
  pp: number
  mode: ViewMode
  genderLabel?: string
}) {
  const t = useStore(s => s.tournament)
  if (refs.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-1 w-full">
      {genderLabel && <span className="text-[9px] text-muted-foreground shrink-0">{genderLabel}</span>}
      {refs.map((ref, i) => {
        const item = t.stock.find(x => x.id === ref.stockItemId)
        if (!item) return null
        return mode === 'compact'
          ? <CompactDot key={i} item={item} />
          : <DetailPill key={i} item={item} count={ref.count} />
      })}
      <PerPlayer value={pp} />
    </div>
  )
}

export function CellPreview({
  code, sKey, onOpen, mode,
}: {
  code: CategoryCode
  sKey: string
  onOpen: () => void
  mode: ViewMode
}) {
  const t      = useStore(s => s.tournament)
  const key    = `${code}-${sKey}`
  const award  = t.attributions[key]
  const status = award?.status ?? 'empty'

  const gv       = valuePerGender(t, key, 'winner')
  const gvFin    = valuePerGender(t, key, 'finalist')
  const winnerPP   = valuePerPlayer(t, key, 'winner')
  const finalistPP = valuePerPlayer(t, key, 'finalist')

  const genderSplit = !!award?.genderSplit
  const hasLots = award && (
    award.winner.length > 0 || award.finalist.length > 0 ||
    (award.winnerF ?? []).length > 0 || (award.finalistF ?? []).length > 0
  )

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Modifier ${code} ${sKey}`}
      className={`
        w-full text-left flex flex-col gap-1 rounded-md border bg-card
        hover:border-primary transition-colors p-2
        ${mode === 'compact' ? 'min-h-[80px]' : 'min-h-[96px]'}
      `}
    >
      {/* En-tête */}
      <div className="flex items-center justify-between gap-1 w-full">
        <span className="font-semibold text-sm leading-none flex items-center gap-1">
          {sKey}
          {genderSplit && <span className="text-[9px] text-muted-foreground">H/F</span>}
        </span>
        <StatusDot status={status} />
      </div>

      {hasLots ? (
        <div className="flex flex-col gap-1 flex-1 w-full">
          {/* Vainqueur */}
          <div className="flex flex-col gap-0.5 w-full">
            <span className="text-[10px] shrink-0">🏆</span>
            {genderSplit ? (
              <>
                <RefsLine refs={award!.winner}          pp={gv?.m ?? 0}      mode={mode} genderLabel="👨" />
                <RefsLine refs={award!.winnerF ?? []}   pp={gv?.f ?? 0}      mode={mode} genderLabel="👩" />
              </>
            ) : (
              <RefsLine refs={award!.winner} pp={winnerPP} mode={mode} />
            )}
          </div>
          {/* Finaliste */}
          <div className="flex flex-col gap-0.5 w-full">
            <span className="text-[10px] shrink-0">🥈</span>
            {genderSplit ? (
              <>
                <RefsLine refs={award!.finalist}         pp={gvFin?.m ?? 0} mode={mode} genderLabel="👨" />
                <RefsLine refs={award!.finalistF ?? []}  pp={gvFin?.f ?? 0} mode={mode} genderLabel="👩" />
              </>
            ) : (
              <RefsLine refs={award!.finalist} pp={finalistPP} mode={mode} />
            )}
          </div>
        </div>
      ) : (
        <span className="text-[10px] text-muted-foreground mt-auto">—</span>
      )}
    </button>
  )
}
