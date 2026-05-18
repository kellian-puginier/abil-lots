import type { Tournament, CategoryConfig, CategoryCode } from '@/types/tournament'

const CAT: Record<CategoryCode, CategoryConfig> = {
  SH:  { code: 'SH',  label: 'Simple Homme', isDouble: false, seriesCount: 6 },
  SD:  { code: 'SD',  label: 'Simple Dame',  isDouble: false, seriesCount: 4 },
  DH:  { code: 'DH',  label: 'Double Homme', isDouble: true,  seriesCount: 7 },
  DD:  { code: 'DD',  label: 'Double Dame',  isDouble: true,  seriesCount: 6 },
  DMX: { code: 'DMX', label: 'Double Mixte', isDouble: true,  seriesCount: 7 },
}

export function defaultTournament(year: number = new Date().getFullYear()): Tournament {
  return {
    meta: {
      name: `Tour des Héraults ${year}`,
      year,
      savedAt: new Date().toISOString(),
      locked: false,
      schemaVersion: 1,
    },
    categories: { ...CAT },
    stock: [],
    attributions: {},
  }
}
