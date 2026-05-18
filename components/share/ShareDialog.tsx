'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import { encodeSnapshot, MAX_URL_PAYLOAD } from '@/lib/share-codec'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Copy, Download } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'

export function ShareDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const t = useStore(s => s.tournament)
  const [base] = useState(() => typeof window !== 'undefined' ? window.location.origin : '')
  const encoded = encodeSnapshot(t)
  const url = `${base}/share/?s=${encoded}`
  const tooLong = encoded.length > MAX_URL_PAYLOAD

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); toast.success('Lien copié') }
    catch { toast.error('Copie impossible') }
  }
  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(t, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${t.meta.name.replace(/\s+/g, '-').toLowerCase()}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Partager le snapshot</DialogTitle>
          <DialogDescription>Lien en lecture seule. Repartage-le à chaque mise à jour majeure.</DialogDescription>
        </DialogHeader>
        {tooLong ? (
          <div className="space-y-3">
            <p className="text-sm text-destructive">Snapshot trop volumineux pour une URL ({encoded.length} caractères). Télécharge le JSON et envoie-le, les bénévoles l&apos;importeront via /import.</p>
            <Button onClick={downloadJson}><Download className="size-4 mr-1" /> Télécharger le JSON</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-center bg-card p-3 rounded-md border">
              <QRCodeSVG value={url} size={180} />
            </div>
            <Input readOnly value={url} aria-label="URL du snapshot" />
            <div className="flex gap-2">
              <Button onClick={copy}><Copy className="size-4 mr-1" /> Copier</Button>
              <Button variant="outline" onClick={downloadJson}><Download className="size-4 mr-1" /> JSON</Button>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
