'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Upload, RotateCcw } from 'lucide-react'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { toast } from 'sonner'
import type { Tournament } from '@/types/tournament'

export default function Page() {
  const replace = useStore(s => s.replaceTournament)
  const resetToDefaults = useStore(s => s.resetToDefaults)
  const [pending, setPending] = useState<Tournament | null>(null)
  const [resetOpen, setResetOpen] = useState(false)

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const obj = JSON.parse(String(reader.result))
        if (obj?.meta?.schemaVersion !== 1) throw new Error('schemaVersion')
        setPending(obj)
      } catch {
        toast.error('Fichier invalide (JSON ou schemaVersion).')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-6 max-w-xl">
      <header>
        <h1>Importer / Réinitialiser</h1>
        <p className="text-muted-foreground">Charge un snapshot JSON ou réinitialise l&apos;application.</p>
      </header>

      <section className="rounded-lg border bg-card p-4 space-y-3">
        <h2 className="flex items-center gap-2"><Upload className="size-5" /> Importer un fichier JSON</h2>
        <p className="text-sm text-muted-foreground">Écrasera l&apos;état actuel après confirmation.</p>
        <input type="file" accept="application/json,.json" onChange={onFile} className="block text-sm" />
      </section>

      <section className="rounded-lg border bg-card p-4 space-y-3">
        <h2 className="flex items-center gap-2"><RotateCcw className="size-5" /> Réinitialiser</h2>
        <p className="text-sm text-muted-foreground">Repart d&apos;une configuration vierge (catégories par défaut, stock vide).</p>
        <Button variant="destructive" onClick={() => setResetOpen(true)}>Reset complet</Button>
      </section>

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(o) => !o && setPending(null)}
        title="Remplacer l'état actuel ?"
        description="Le tournoi en cours sera remplacé par le contenu du fichier."
        variant="destructive"
        confirmLabel="Remplacer"
        onConfirm={() => { if (pending) { replace(pending); toast.success('Snapshot importé.') } }}
      />
      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Réinitialiser complètement ?"
        description="Toutes les données seront effacées. Tape RESET pour confirmer."
        variant="destructive"
        confirmLabel="Réinitialiser"
        requireText="RESET"
        onConfirm={() => { resetToDefaults(); toast.success('Tournoi réinitialisé.') }}
      />
    </div>
  )
}
