'use client'
import { useStore } from '@/lib/store'
import { categoryProgress, overallProgress } from '@/lib/derivations'
import type { CategoryCode } from '@/types/tournament'
import { Progress } from '@/components/ui/progress'

const ORDER: CategoryCode[] = ['SH', 'SD', 'DH', 'DD', 'DMX']

export function ValidationProgress() {
  const t = useStore(s => s.tournament)
  const overall = overallProgress(t)
  const pct = overall.total ? Math.round((overall.validated / overall.total) * 100) : 0
  return (
    <section className="rounded-lg border bg-card p-4 space-y-3">
      <h2>Avancement de la validation</h2>
      <div>
        <div className="flex justify-between text-sm mb-1"><span>Global</span><span className="tabular-nums">{overall.validated}/{overall.total} ({pct}%)</span></div>
        <Progress value={pct} />
      </div>
      <ul className="grid sm:grid-cols-2 gap-2">
        {ORDER.map(code => {
          const p = categoryProgress(t, code)
          const cp = p.total ? Math.round((p.validated / p.total) * 100) : 0
          return (
            <li key={code} className="space-y-1">
              <div className="flex justify-between text-xs"><span>{t.categories[code].label}</span><span className="tabular-nums">{p.validated}/{p.total}</span></div>
              <Progress value={cp} />
            </li>
          )
        })}
      </ul>
    </section>
  )
}
