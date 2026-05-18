export function SnapshotBanner({ savedAt }: { savedAt: string }) {
  let when = savedAt
  try { when = new Date(savedAt).toLocaleString('fr-FR') } catch {}
  return (
    <div className="bg-secondary text-secondary-foreground text-center text-sm py-2 px-4">
      📸 Snapshot du {when} — peut être obsolète. Lecture seule.
    </div>
  )
}
