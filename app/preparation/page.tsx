'use client'
import { useStore } from '@/lib/store'
import { ChecklistByCategory } from '@/components/preparation/ChecklistByCategory'
import { Button } from '@/components/ui/button'
import { Download, Printer } from 'lucide-react'
import { downloadChecklistPdf } from '@/lib/pdf-export'
import { toast } from 'sonner'

export default function Page() {
  const t = useStore(s => s.tournament)
  const exportPdf = async () => {
    try {
      await downloadChecklistPdf(t)
    } catch {
      toast.error('Échec de l\'export PDF.')
    }
  }
  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-2 flex-wrap no-print">
        <div>
          <h1>Préparation</h1>
          <p className="text-muted-foreground">Check-list des lots à préparer, par catégorie puis par série.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}><Printer className="size-4 mr-1" /> Imprimer</Button>
          <Button onClick={exportPdf}><Download className="size-4 mr-1" /> Export PDF</Button>
        </div>
      </header>
      <ChecklistByCategory />
    </div>
  )
}
