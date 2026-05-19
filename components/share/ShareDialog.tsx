'use client'
import { useMemo, useState } from 'react'
import { useStore } from '@/lib/store'
import { encodeSnapshot, MAX_URL_PAYLOAD } from '@/lib/share-codec'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Copy, Download, AlertTriangle } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'

export function ShareDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const t = useStore(s => s.tournament)
  const [base] = useState(() => typeof window !== 'undefined' ? window.location.origin : '')
  const isLocalhost = base.includes('localhost') || base.includes('127.0.0.1')

  // Encodage mémoïsé — évite de recalculer à chaque render
  const encoded = useMemo(() => {
    try { return encodeSnapshot(t) } catch { return '' }
  }, [t])

  const url = `${base}/share/?s=${encoded}`
  const tooLong = encoded.length > MAX_URL_PAYLOAD || encoded.length === 0

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
          <DialogDescription>
            Lien en lecture seule. Repartage-le à chaque mise à jour majeure pour que les bénévoles voient la dernière version.
          </DialogDescription>
        </DialogHeader>

        {/* ⚠️ Avertissement localhost — l'app n'est accessible qu'en local */}
        {isLocalhost && (
          <div className="flex gap-2 rounded-md border border-secondary bg-secondary/10 p-3 text-sm">
            <AlertTriangle className="size-4 mt-0.5 shrink-0 text-secondary-foreground" />
            <div>
              <strong>Application en mode local (localhost)</strong><br />
              Le lien généré contient <code>localhost</code> et ne fonctionnera <strong>pas</strong> depuis un autre appareil.
              Pour partager avec les bénévoles, deux options :<br />
              <span className="font-medium">① Déploie l&apos;app sur Vercel</span> (gratuit, même démarche que abil-survey) — le lien fonctionnera depuis n&apos;importe où.<br />
              <span className="font-medium">② Utilise le JSON</span> ci-dessous : télécharge-le, envoie-le par WhatsApp/mail, les bénévoles l&apos;importent via <code>/import</code>.
            </div>
          </div>
        )}

        {tooLong ? (
          <div className="space-y-3">
            <p className="text-sm text-destructive">
              Snapshot trop volumineux pour une URL ({encoded.length} caractères).
              Télécharge le JSON et transmets-le — les bénévoles l&apos;importent via la page <code>/import</code>.
            </p>
            <Button onClick={downloadJson}><Download className="size-4 mr-1" /> Télécharger le JSON</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* QR code — utile uniquement si l'app est déployée */}
            {!isLocalhost && (
              <div className="flex justify-center bg-card p-3 rounded-md border">
                <QRCodeSVG value={url} size={180} level="L" />
              </div>
            )}
            <Input readOnly value={url} aria-label="URL du snapshot" className="text-xs" />
            <div className="flex gap-2">
              <Button onClick={copy}><Copy className="size-4 mr-1" /> Copier l&apos;URL</Button>
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
