'use client'
import { useStore } from '@/lib/store'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CategoryConfigRow } from '@/components/config/CategoryConfigRow'
import { totalRecipients, overallProgress } from '@/lib/derivations'
import type { CategoryCode } from '@/types/tournament'
import { Gift } from 'lucide-react'

const ORDER: CategoryCode[] = ['SH', 'SD', 'DH', 'DD', 'DMX']

export default function Page() {
  const t = useStore(s => s.tournament)
  const setName             = useStore(s => s.setName)
  const setYear             = useStore(s => s.setYear)
  const setDotationEnvelope = useStore(s => s.setDotationEnvelope)
  const locked              = t.meta.locked

  const progress   = overallProgress(t)
  const recipients = totalRecipients(t)

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1>Configuration du tournoi</h1>
        <p className="text-muted-foreground">Nom, année, catégories et budget de dotation.</p>
      </header>

      {/* Identité du tournoi */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="name">Nom du tournoi</Label>
          <Input id="name" value={t.meta.name} disabled={locked} onChange={e => setName(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="year">Année</Label>
          <Input id="year" type="number" value={t.meta.year} disabled={locked}
            onChange={e => setYear(Number(e.target.value) || t.meta.year)} />
        </div>
      </div>

      {/* Enveloppe de dotation équipementier */}
      <section className="rounded-lg border bg-card p-4 space-y-3">
        <h2 className="flex items-center gap-2">
          <Gift className="size-5 text-primary" />
          Enveloppe de dotation équipementier
        </h2>
        <p className="text-sm text-muted-foreground">
          Budget mis à disposition par l&apos;équipementier (bons d&apos;achat, accessoires…).
          Les items cochés « Dotation » dans la page Stock seront imputés ici plutôt que sur le cash du club.
        </p>
        <div className="flex items-end gap-3 max-w-xs">
          <div className="flex-1 space-y-1">
            <Label htmlFor="dotation">Enveloppe totale (€)</Label>
            <Input
              id="dotation"
              type="number" min={0} step={10} inputMode="numeric"
              value={t.meta.dotationEnvelope ?? ''}
              disabled={locked}
              placeholder="ex : 1 000"
              onChange={e => {
                const v = Number(e.target.value)
                setDotationEnvelope(v > 0 ? v : undefined)
              }}
            />
          </div>
        </div>
      </section>

      {/* Catégories */}
      <section className="space-y-2">
        <h2>Catégories</h2>
        <div className="grid gap-2">
          {ORDER.map(code => <CategoryConfigRow key={code} cfg={t.categories[code]} />)}
        </div>
      </section>

      {/* Récap */}
      <section className="grid sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border bg-card">
          <div className="text-xs text-muted-foreground">Séries totales</div>
          <div className="text-2xl font-display">{progress.total}</div>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <div className="text-xs text-muted-foreground">Personnes à récompenser</div>
          <div className="text-2xl font-display">{recipients}</div>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <div className="text-xs text-muted-foreground">Catégories</div>
          <div className="text-2xl font-display">5</div>
        </div>
      </section>
    </div>
  )
}
