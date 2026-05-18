'use client'
import { RepartitionGrid } from '@/components/repartition/RepartitionGrid'

export default function Page() {
  return (
    <div className="space-y-4">
      <header>
        <h1>Répartition</h1>
        <p className="text-muted-foreground">Clique sur une cellule pour attribuer les lots.</p>
      </header>
      <RepartitionGrid />
    </div>
  )
}
