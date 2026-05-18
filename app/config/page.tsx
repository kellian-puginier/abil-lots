'use client'
import { useStore } from '@/lib/store'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CategoryConfigRow } from '@/components/config/CategoryConfigRow'
import { totalRecipients, overallProgress } from '@/lib/derivations'
import type { CategoryCode } from '@/types/tournament'

const ORDER: CategoryCode[] = ['SH', 'SD', 'DH', 'DD', 'DMX']

export default function Page() {
  const t = useStore(s => s.tournament)
  const setName = useStore(s => s.setName)
  const setYear = useStore(s => s.setYear)
  const locked  = t.meta.locked

  const progress = overallProgress(t)
  const recipients = totalRecipients(t)

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1>Configuration du tournoi</h1>
        <p className="text-muted-foreground">Définis le nom, l&apos;année et le nombre de séries par catégorie.</p>
      </header>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="name">Nom du tournoi</Label>
          <Input id="name" value={t.meta.name} disabled={locked} onChange={e => setName(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="year">Année</Label>
          <Input id="year" type="number" value={t.meta.year} disabled={locked} onChange={e => setYear(Number(e.target.value) || t.meta.year)} />
        </div>
      </div>

      <section className="space-y-2">
        <h2>Catégories</h2>
        <div className="grid gap-2">
          {ORDER.map(code => <CategoryConfigRow key={code} cfg={t.categories[code]} />)}
        </div>
      </section>

      <section className="grid sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border bg-card"><div className="text-xs text-muted-foreground">Séries totales</div><div className="text-2xl font-display">{progress.total}</div></div>
        <div className="p-4 rounded-lg border bg-card"><div className="text-xs text-muted-foreground">Personnes à récompenser</div><div className="text-2xl font-display">{recipients}</div></div>
        <div className="p-4 rounded-lg border bg-card"><div className="text-xs text-muted-foreground">Catégories</div><div className="text-2xl font-display">5</div></div>
      </section>
    </div>
  )
}
