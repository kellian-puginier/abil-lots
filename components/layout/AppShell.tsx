'use client'
import { useState } from 'react'
import { useHydrated } from '@/hooks/useHydrated'
import { SideNav } from './SideNav'
import { BottomNav } from './BottomNav'
import { LockToggle } from './LockToggle'
import { AutosaveIndicator } from './AutosaveIndicator'
import { Button } from '@/components/ui/button'
import { Share2 } from 'lucide-react'
import { ShareDialog } from '@/components/share/ShareDialog'

export function AppShell({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated()
  const [shareOpen, setShareOpen] = useState(false)
  return (
    <div className="flex flex-1 min-h-screen">
      <SideNav />
      <div className="flex flex-col flex-1 min-w-0">
        <header className="flex items-center justify-between px-4 py-3 border-b bg-card no-print">
          <div className="md:hidden font-display text-lg leading-none">ABIL <span className="text-primary">Prizes</span></div>
          <div className="flex items-center gap-2 sm:gap-4 ml-auto">
            <AutosaveIndicator />
            <Button variant="outline" size="sm" onClick={() => setShareOpen(true)}><Share2 className="size-4 mr-1" /> Partager</Button>
            <LockToggle />
          </div>
        </header>
        <main className="flex-1 p-4 pb-24 md:pb-4">
          {hydrated ? children : <div className="p-8 text-muted-foreground">Chargement…</div>}
        </main>
        <BottomNav />
        <ShareDialog open={shareOpen} onOpenChange={setShareOpen} />
      </div>
    </div>
  )
}
