'use client'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo } from 'react'
import { decodeSnapshot } from '@/lib/share-codec'
import { useStore } from '@/lib/store'
import { ReadOnlyContext } from '@/components/share/ReadOnlyContext'
import { SnapshotBanner } from '@/components/share/SnapshotBanner'

function SharePageInner() {
  const params = useSearchParams()
  const encoded = params.get('s') ?? ''
  const replace = useStore(s => s.replaceTournament)

  const decoded = useMemo(() => (encoded ? decodeSnapshot(encoded) : null), [encoded])
  const err = !encoded
    ? 'Aucun snapshot dans l’URL.'
    : !decoded
      ? 'Snapshot invalide ou corrompu.'
      : null

  useEffect(() => {
    if (decoded) replace({ ...decoded, meta: { ...decoded.meta, locked: true } })
  }, [decoded, replace])

  if (err) return <div className="p-8 text-destructive">{err}</div>
  if (!decoded) return <div className="p-8 text-muted-foreground">Chargement du snapshot…</div>

  return (
    <ReadOnlyContext.Provider value={true}>
      <SnapshotBanner savedAt={decoded.meta.savedAt} />
      <div className="p-4 space-y-4">
        <h1>Snapshot chargé</h1>
        <p className="text-sm text-muted-foreground">
          Tu peux maintenant naviguer dans Dashboard / Stock / Configuration / Répartition / Préparation / Cérémonie depuis la navigation. L&apos;application est verrouillée : toute édition est désactivée tant que tu n&apos;as pas déverrouillé manuellement.
        </p>
      </div>
    </ReadOnlyContext.Provider>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Chargement…</div>}>
      <SharePageInner />
    </Suspense>
  )
}
