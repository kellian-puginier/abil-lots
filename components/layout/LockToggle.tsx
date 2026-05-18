'use client'
import { Switch } from '@/components/ui/switch'
import { Lock, LockOpen } from 'lucide-react'
import { useStore } from '@/lib/store'

export function LockToggle() {
  const locked = useStore(s => s.tournament.meta.locked)
  const setLocked = useStore(s => s.setLocked)
  return (
    <label className="flex items-center gap-2 text-sm font-medium select-none">
      {locked ? <Lock className="size-4" /> : <LockOpen className="size-4" />}
      <span className="hidden sm:inline">Verrouiller</span>
      <Switch checked={locked} onCheckedChange={setLocked} aria-label="Verrouiller le tournoi" />
    </label>
  )
}
