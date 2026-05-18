'use client'
import { useStore } from '@/lib/store'

export function AutosaveIndicator() {
  const savedAt = useStore(s => s.tournament.meta.savedAt)
  return (
    <span
      key={savedAt}
      role="status"
      className="text-xs text-muted-foreground animate-in fade-in duration-500"
    >
      💾 Sauvegardé
    </span>
  )
}
