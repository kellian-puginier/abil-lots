'use client'
/**
 * Page /share/ — lecture seule d'un snapshot encodé dans le fragment URL.
 *
 * Pourquoi le fragment (#) et pas le query string (?s=) ?
 * Le fragment n'est JAMAIS envoyé au serveur : Vercel (ou tout CDN) reçoit
 * seulement GET /share/ → sert share/index.html. Le JS lit ensuite
 * window.location.hash côté client. Résultat : aucune limite de longueur URL
 * côté serveur, peu importe la taille du tournoi encodé.
 */
import { useEffect, useMemo, useState } from 'react'
import { decodeSnapshot } from '@/lib/share-codec'
import { useStore } from '@/lib/store'
import type { Tournament } from '@/types/tournament'
import { ReadOnlyContext } from '@/components/share/ReadOnlyContext'
import { SnapshotBanner } from '@/components/share/SnapshotBanner'

export default function Page() {
  const replace = useStore(s => s.replaceTournament)

  // null = pas encore lu le hash (SSR / premier render)
  const [encoded, setEncoded] = useState<string | null>(null)

  // Lire le fragment côté client uniquement
  useEffect(() => {
    const hash = window.location.hash // ex: "#s=N4IgZg..."
    if (hash.startsWith('#s=')) {
      setEncoded(hash.slice(3))       // retire le "#s="
    } else {
      setEncoded('')                  // hash absent ou mal formé
    }
  }, [])

  const decoded = useMemo<Tournament | null>(
    () => (encoded ? decodeSnapshot(encoded) : null),
    [encoded],
  )

  // Charger le snapshot dans le store dès qu'il est décodé
  useEffect(() => {
    if (decoded) {
      replace({ ...decoded, meta: { ...decoded.meta, locked: true } })
    }
  }, [decoded, replace])

  // Encore en cours de chargement (avant l'effect)
  if (encoded === null) {
    return <div className="p-8 text-muted-foreground">Chargement du snapshot…</div>
  }

  // Hash absent
  if (encoded === '') {
    return (
      <div className="p-8 space-y-2">
        <p className="text-destructive font-medium">Aucun snapshot dans ce lien.</p>
        <p className="text-sm text-muted-foreground">
          Vérifie que tu as bien copié l&apos;URL complète (elle doit contenir <code>#s=…</code>).
        </p>
      </div>
    )
  }

  // Hash présent mais décodage impossible
  if (!decoded) {
    return (
      <div className="p-8 space-y-2">
        <p className="text-destructive font-medium">Snapshot invalide ou corrompu.</p>
        <p className="text-sm text-muted-foreground">
          Le lien est peut-être tronqué ou provient d&apos;une version incompatible de l&apos;app.
          Demande à la personne qui partage d&apos;exporter le JSON via le bouton <strong>Partager → JSON</strong>.
        </p>
      </div>
    )
  }

  return (
    <ReadOnlyContext.Provider value={true}>
      <SnapshotBanner savedAt={decoded.meta.savedAt} />
      <div className="p-4 space-y-4">
        <h1>{decoded.meta.name}</h1>
        <p className="text-sm text-muted-foreground">
          Snapshot chargé en lecture seule. Navigue librement dans Dashboard, Répartition, Préparation et Cérémonie.
          L&apos;app est verrouillée — déverrouille via l&apos;interrupteur en haut à droite si tu veux éditer localement.
        </p>
      </div>
    </ReadOnlyContext.Provider>
  )
}
