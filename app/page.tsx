'use client'
import { useStore } from '@/lib/store'
import { overallProgress, totalRecipients, stockRemaining, stockItemValue } from '@/lib/derivations'
import { KPICard } from '@/components/dashboard/KPICard'
import { ValidationProgress } from '@/components/dashboard/ValidationProgress'
import { AlertsList } from '@/components/dashboard/AlertsList'
import { PerPlayerView } from '@/components/dashboard/PerPlayerView'

export default function Page() {
  const t = useStore(s => s.tournament)
  const p = overallProgress(t)
  const pct = p.total ? Math.round((p.validated / p.total) * 100) : 0
  const budget = t.stock.reduce((sum, item) => sum + stockItemValue(item) * item.quantity, 0)
  const allocated = Object.entries(t.attributions).reduce((sum, [, a]) => {
    const refs = [...a.winner, ...a.finalist]
    return sum + refs.reduce((s, r) => {
      const it = t.stock.find(x => x.id === r.stockItemId)
      return s + (it ? stockItemValue(it) * r.count : 0)
    }, 0)
  }, 0)
  const understocked = t.stock.filter(it => stockRemaining(t, it) < 0).length

  return (
    <div className="space-y-6">
      <header>
        <h1>{t.meta.name}</h1>
        <p className="text-muted-foreground">Vue d&apos;ensemble du tournoi.</p>
      </header>

      <section className="grid sm:grid-cols-4 gap-3">
        <KPICard label="Validation" value={`${pct}%`} hint={`${p.validated}/${p.total} séries`} tone={pct === 100 ? 'ok' : 'default'} />
        <KPICard label="Personnes à récompenser" value={totalRecipients(t)} />
        <KPICard label="Stock total (valorisé)" value={`${budget.toLocaleString('fr-FR')} €`} />
        <KPICard label="Lots déjà attribués" value={`${allocated.toLocaleString('fr-FR')} €`} tone={understocked > 0 ? 'error' : 'default'} hint={understocked > 0 ? `${understocked} lot(s) en rupture` : undefined} />
      </section>

      <ValidationProgress />
      <AlertsList />
      <PerPlayerView />
    </div>
  )
}
