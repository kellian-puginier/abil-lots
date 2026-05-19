'use client'
import { useStore } from '@/lib/store'
import { tournamentTotals } from '@/lib/derivations'
import { Gift, TrendingDown, Wallet, Users } from 'lucide-react'

function Row({ icon: Icon, label, value, sub, tone }: {
  icon: typeof Gift
  label: string
  value: string
  sub?: string
  tone?: 'default' | 'ok' | 'warn' | 'muted'
}) {
  const valueClass = {
    default: 'text-foreground',
    ok:      'text-emerald-700',
    warn:    'text-destructive',
    muted:   'text-muted-foreground',
  }[tone ?? 'default']

  return (
    <div className="flex items-start justify-between gap-2 py-2 border-b last:border-0">
      <div className="flex items-center gap-2 text-sm">
        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <div>
          <div className="font-medium">{label}</div>
          {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
        </div>
      </div>
      <div className={`text-sm font-semibold tabular-nums whitespace-nowrap ${valueClass}`}>{value}</div>
    </div>
  )
}

export function FinancialSummary() {
  const t      = useStore(s => s.tournament)
  const totals = tournamentTotals(t)

  const fmt = (v: number) => `${v.toLocaleString('fr-FR')} €`

  const hasDotation = totals.dotationEnvelope > 0

  return (
    <section className="rounded-lg border bg-card p-4 space-y-1">
      <h2 className="pb-2">Synthèse financière</h2>

      {/* Valeur joueurs */}
      <Row
        icon={Users}
        label="Valeur perçue par les joueurs"
        sub="Somme des prix publics des lots attribués"
        value={fmt(totals.playerValueTotal)}
      />

      {/* Coût club total */}
      <Row
        icon={Wallet}
        label="Coût total pour le club"
        sub={totals.playerValueTotal !== totals.clubCostTotal
          ? `Économie de ${fmt(totals.playerValueTotal - totals.clubCostTotal)} par rapport à la valeur publique`
          : 'Identique à la valeur perçue (aucun coût club renseigné)'}
        value={fmt(totals.clubCostTotal)}
        tone={totals.playerValueTotal > totals.clubCostTotal ? 'ok' : 'default'}
      />

      {/* Dotation */}
      {hasDotation && (
        <>
          <Row
            icon={Gift}
            label="Enveloppe de dotation"
            sub="Budget équipementier disponible"
            value={fmt(totals.dotationEnvelope)}
            tone="muted"
          />
          <Row
            icon={Gift}
            label="Dotation consommée"
            sub="Items cochés « Dotation » dans le Stock"
            value={fmt(totals.dotationConsumed)}
            tone={totals.dotationConsumed > totals.dotationEnvelope ? 'warn' : 'default'}
          />
          {totals.dotationConsumed > totals.dotationEnvelope && (
            <div className="text-xs text-destructive bg-destructive/10 rounded px-2 py-1">
              ⚠️ Dotation dépassée de {fmt(totals.dotationConsumed - totals.dotationEnvelope)}
            </div>
          )}
        </>
      )}

      {/* Cash réel */}
      <Row
        icon={TrendingDown}
        label="Dépense cash réelle du club"
        sub={hasDotation
          ? 'Coût club – dotation consommée'
          : 'Renseigne le coût club et la dotation pour affiner ce chiffre'}
        value={fmt(hasDotation ? totals.realCashSpend : totals.clubCostTotal)}
        tone="default"
      />
    </section>
  )
}
