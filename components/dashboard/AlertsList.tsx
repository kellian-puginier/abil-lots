'use client'
import { useStore } from '@/lib/store'
import { runValidators, type Alert } from '@/lib/validators'
import { AlertTriangle, AlertCircle, Info } from 'lucide-react'

const ICON = { warn: AlertTriangle, error: AlertCircle, info: Info } as const
const TONE = {
  warn:  'border-secondary bg-secondary/10 text-foreground',
  error: 'border-destructive bg-destructive/10 text-destructive',
  info:  'border bg-card text-muted-foreground',
} as const

export function AlertsList() {
  const t = useStore(s => s.tournament)
  const alerts = runValidators(t)

  const errs  = alerts.filter(a => a.severity === 'error')
  const warns = alerts.filter(a => a.severity === 'warn')
  const infos = alerts.filter(a => a.severity === 'info').slice(0, 10)

  if (alerts.length === 0) {
    return <p className="text-sm text-emerald-700">✅ Aucune alerte. Tout est cohérent.</p>
  }

  const render = (a: Alert, i: number) => {
    const Icon = ICON[a.severity]
    return (
      <li key={i} className={`flex items-start gap-2 rounded-md border p-2 text-sm ${TONE[a.severity]}`}>
        <Icon className="size-4 mt-0.5 shrink-0" aria-hidden />
        <div>
          <span className="font-medium mr-1">{a.code}</span>
          <span>{a.message}</span>
        </div>
      </li>
    )
  }

  return (
    <section className="rounded-lg border bg-card p-4 space-y-3">
      <h2>Alertes de cohérence</h2>
      {errs.length + warns.length > 0 && <ul className="space-y-1">{[...errs, ...warns].map(render)}</ul>}
      {infos.length > 0 && (
        <details>
          <summary className="text-xs text-muted-foreground cursor-pointer">+ {alerts.filter(a => a.severity === 'info').length} info (séries non dotées)</summary>
          <ul className="space-y-1 mt-2">{infos.map(render)}</ul>
        </details>
      )}
    </section>
  )
}
