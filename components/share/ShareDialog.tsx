'use client'
import { useMemo, useState } from 'react'
import { useStore } from '@/lib/store'
import { encodeSnapshot } from '@/lib/share-codec'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Copy, Download, AlertTriangle } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'

/**
 * Limite pratique d'encodage QR (niveau L ≈ 2 953 octets de data).
 * On prend une marge confortable pour le préfixe URL.
 * NB : la longueur de l'URL elle-même n'est plus limitée car on utilise
 * le fragment (#) qui n'est jamais envoyé au serveur → aucune limite CDN/Vercel.
 */
const MAX_QR_CHARS = 1_400

export function ShareDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const t = useStore(s => s.tournament)
  const [base] = useState(() => typeof window !== 'undefined' ? window.location.origin : '')
  const isLocalhost = base.includes('localhost') || base.includes('127.0.0.1')

  const encoded = useMemo(() => {
    try { return encodeSnapshot(t) } catch { return '' }
  }, [t])

  // ── Fragment URL : le "#" n'est JAMAIS envoyé au serveur → aucune limite ──
  const url = encoded ? `${base}/share/#s=${encoded}` : ''
  const canShowQr = !isLocalhost && encoded.length > 0 && encoded.length <= MAX_QR_CHARS

  const copy = async () => {
    if (!url) { toast.error('Impossible de générer le lien.'); return }
    try { await navigator.clipboard.writeText(url); toast.success('Lien copié !') }
    catch { toast.error('Copie impossible — colle l\'URL manuellement.') }
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
            Lien en lecture seule. Repartage-le à chaque mise à jour majeure.
          </DialogDescription>
        </DialogHeader>

        {/* Avertissement localhost */}
        {isLocalhost && (
          <div className="flex gap-2 rounded-md border border-secondary bg-secondary/10 p-3 text-sm">
            <AlertTriangle className="size-4 mt-0.5 shrink-0 text-secondary-foreground" />
            <div>
              <strong>Application locale (localhost)</strong><br />
              Ce lien ne fonctionnera <strong>pas</strong> depuis un autre appareil.
              Déploie sur Vercel, ou utilise le JSON ci-dessous (les bénévoles l&apos;importent via <code>/import</code>).
            </div>
          </div>
        )}

        {!encoded ? (
          <p className="text-sm text-destructive">Impossible d&apos;encoder le tournoi. Essaie de recharger la page.</p>
        ) : (
          <div className="space-y-3">
            {/* QR code — uniquement si les données sont assez petites */}
            {canShowQr ? (
              <div className="flex justify-center bg-card p-3 rounded-md border">
                <QRCodeSVG value={url} size={180} level="L" />
              </div>
            ) : !isLocalhost ? (
              <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
                📋 QR code non disponible (tournoi trop volumineux pour un QR).
                Utilise le bouton Copier ou le JSON.
              </div>
            ) : null}

            <Input readOnly value={url} aria-label="URL du snapshot" className="text-xs font-mono" />
            <p className="text-xs text-muted-foreground">
              Le lien encode l&apos;intégralité du tournoi dans l&apos;URL (fragment <code>#s=…</code>).
              Rien n&apos;est stocké sur un serveur.
            </p>
            <div className="flex gap-2">
              <Button onClick={copy} className="flex-1">
                <Copy className="size-4 mr-1" /> Copier le lien
              </Button>
              <Button variant="outline" onClick={downloadJson}>
                <Download className="size-4 mr-1" /> JSON
              </Button>
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
