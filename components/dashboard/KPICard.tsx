export function KPICard({ label, value, hint, tone = 'default' }: { label: string; value: string | number; hint?: string; tone?: 'default' | 'warn' | 'error' | 'ok' }) {
  const toneClass = {
    default: 'border bg-card',
    ok:      'border-emerald-300 bg-emerald-50',
    warn:    'border-secondary bg-secondary/10',
    error:   'border-destructive bg-destructive/10',
  }[tone]
  return (
    <div className={`rounded-lg p-4 ${toneClass}`}>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-3xl font-display tabular-nums">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  )
}
