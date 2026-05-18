'use client'
import type { CategoryCode } from '@/types/tournament'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, ChevronsUp, ChevronsDown } from 'lucide-react'

interface Props {
  code: CategoryCode
  sKey: string
  categoryLabel: string
  onPrevSeries: () => void
  onNextSeries: () => void
  onPrevCategory: () => void
  onNextCategory: () => void
}

export function SeriesNavigator({ sKey, categoryLabel, onPrevSeries, onNextSeries, onPrevCategory, onNextCategory }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 no-print">
      <div className="flex items-center gap-2">
        <Button size="lg" variant="outline" onClick={onPrevCategory} aria-label="Catégorie précédente"><ChevronsUp /></Button>
        <div className="text-center min-w-[200px]">
          <div className="text-xs uppercase text-muted-foreground">Catégorie</div>
          <div className="font-display text-2xl">{categoryLabel}</div>
        </div>
        <Button size="lg" variant="outline" onClick={onNextCategory} aria-label="Catégorie suivante"><ChevronsDown /></Button>
      </div>
      <div className="flex items-center gap-2 w-full">
        <Button size="lg" className="flex-1 h-16 text-lg" variant="outline" onClick={onPrevSeries} aria-label="Série précédente"><ChevronLeft className="size-6 mr-2" /> Précédente</Button>
        <div className="text-center min-w-[100px]">
          <div className="text-xs uppercase text-muted-foreground">Série</div>
          <div className="font-display text-3xl">{sKey}</div>
        </div>
        <Button size="lg" className="flex-1 h-16 text-lg" variant="outline" onClick={onNextSeries} aria-label="Série suivante">Suivante <ChevronRight className="size-6 ml-2" /></Button>
      </div>
    </div>
  )
}
