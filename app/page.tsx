'use client'
import { useStore } from '@/lib/store'
import { overallProgress, totalRecipients, stockRemaining, tournamentTotals } from '@/lib/derivations'
import { KPICard } from '@/components/dashboard/KPICard'
import { ValidationProgress } from '@/components/dashboard/ValidationProgress'
import { AlertsList } from '@/components/dashboard/AlertsList'
import { PerPlayerView } from '@/components/dashboard/PerPlayerView'
import { FinancialSummary } from '@/components/dashboard/FinancialSummary'

export default function Page() {
  const t          = useStore(s => s.tournament)
  const p          = overallProgress(t)
  const pct        = p.total ? Math.round((p.validated / p.total) * 100) : 0
  const totals     = tournamentTotals(t)
  const understocked = t.stock.filter(it => stockRemaining(t, it) < 0).length
  const fmt = (v: number) => `${v.toLocaleString('fr-FR')} €`

  return (
    <div className="space-y-6">
      <header>
        <h1>{t.meta.name}</h1>
        <p className="text-muted-foreground">Vue d&apos;ensemble du tournoi.</p>
      </header>

      {/* KPIs rapides */}
      <section className="grid sm:grid-cols-4 gap-3">
        <KPICard
          label="Validation"
          value={`${pct}%`}
          hint={`${p.validated}/${p.total} séries`}
          tone={pct === 100 ? 'ok' : 'default'}
        />
        <KPICard label="Personnes à récompenser" value={totalRecipients(t)} />
        <KPICard
          label="Valeur perçue joueurs"
          value={fmt(totals.playerValueTotal)}
          hint="Prix publics des lots attribués"
        />
        <KPICard
          label="Cash club estimé"
          value={fmt(totals.dotationEnvelope > 0 ? totals.realCashSpend : totals.clubCostTotal)}
          hint={understocked > 0 ? `⚠️ ${understocked} lot(s) en rupture` : undefined}
          tone={understocked > 0 ? 'error' : 'default'}
        />
      </section>

      <ValidationProgress />
      <FinancialSummary />
      <AlertsList />
      <PerPlayerView />
    </div>
  )
}
