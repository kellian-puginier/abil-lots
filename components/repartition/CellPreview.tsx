'use client'
import type { CategoryCode, StockItem, LotRef } from '@/types/tournament'
import { useStore } from '@/lib/store'
import { valuePerPlayer } from '@/lib/derivations'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LOT_COLOR_TOKEN } from '@/lib/lot-colors'

/** Abréviations courtes affichées dans la pastille */
const ABBREV: Record<string, string> = {
  cheque:     'Chq',
  bon:        'BA',
  biere:      'Bière',
  volants:    'Vol',
  hybride:    'Hyb',
  accessoire: 'Acc',
}

/** Pastille colorée avec abréviation du type + montant */
function LotPill({ item, count }: { item: StockItem; count: number }) {
  const value = item.amount ?? item.unitValue ?? 0
  const abbrev = ABBREV[item.kind] ?? item.kind
  const isLight = item.kind === 'biere' || item.kind === 'volants' || item.kind === 'hybride'
  const textColor = isLight ? 'text-foreground' : 'text-white'

  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold leading-tight border border-black/10 ${textColor}`}
      style={{ backgroundColor: `var(--${LOT_COLOR_TOKEN[item.kind]})` }}
    >
      <span>{abbrev}</span>
      <span className="opacity-90">{value > 0 ? `${value}€` : ''}</span>
      {count > 1 && <span className="opacity-70 ml-0.5">×{count}</span>}
    </span>
  )
}

/** Ligne vainqueur ou finaliste : icône + pills + €/joueur */
function RoleRow({
  emoji, refs, t, perPlayer,
}: {
  emoji: string
  refs: LotRef[]
  t: ReturnType<typeof useStore.getState>['tournament']
  perPlayer: number
}) {
  if (refs.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-1">
      <span className="text-[10px] shrink-0">{emoji}</span>
      {refs.map((ref, i) => {
        const item = t.stock.find(x => x.id === ref.stockItemId)
        return item ? <LotPill key={i} item={item} count={ref.count} /> : null
      })}
      <span className="ml-auto text-[10px] font-bold tabular-nums text-primary whitespace-nowrap">
        {perPlayer > 0 ? `${perPlayer.toLocaleString('fr-FR')} €/j` : ''}
      </span>
    </div>
  )
}

export function CellPreview({ code, sKey, onOpen }: { code: CategoryCode; sKey: string; onOpen: () => void }) {
  const t = useStore(s => s.tournament)
  const key = `${code}-${sKey}`
  const award = t.attributions[key]
  const status = award?.status ?? 'empty'
  const winnerPP   = valuePerPlayer(t, key, 'winner')
  const finalistPP = valuePerPlayer(t, key, 'finalist')

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full min-h-[96px] p-2 rounded-md border bg-card hover:border-primary text-left flex flex-col gap-1.5 transition-colors"
      aria-label={`Modifier ${code} ${sKey}`}
    >
      {/* En-tête : nom série + badge statut */}
      <div className="flex items-center justify-between gap-1">
        <span className="font-semibold text-sm leading-none">{sKey}</span>
        <StatusBadge status={status} />
      </div>

      {/* Lignes vainqueur / finaliste */}
      {award && (award.winner.length > 0 || award.finalist.length > 0) ? (
        <div className="flex flex-col gap-1 flex-1">
          <RoleRow emoji="🏆" refs={award.winner}   t={t} perPlayer={winnerPP} />
          <RoleRow emoji="🥈" refs={award.finalist} t={t} perPlayer={finalistPP} />
        </div>
      ) : (
        <span className="text-[11px] text-muted-foreground mt-auto">Non doté</span>
      )}
    </button>
  )
}
