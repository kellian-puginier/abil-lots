'use client'
import { Button } from '@/components/ui/button'
import { Maximize, Minimize } from 'lucide-react'

export function ProjectorButton({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <Button variant="outline" size="sm" onClick={onToggle} aria-pressed={active} className="no-print">
      {active ? <><Minimize className="size-4 mr-1" /> Quitter projecteur</> : <><Maximize className="size-4 mr-1" /> Mode projecteur (F)</>}
    </Button>
  )
}
