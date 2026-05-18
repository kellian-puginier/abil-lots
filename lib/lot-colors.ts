import type { StockItemKind } from '@/types/tournament'

export const LOT_COLOR_TOKEN: Record<StockItemKind, string> = {
  cheque:     'lot-cash',
  bon:        'lot-bon',
  biere:      'lot-biere',
  volants:    'lot-volants',
  hybride:    'lot-hybride',
  accessoire: 'lot-access',
}

export const LOT_LABEL: Record<StockItemKind, string> = {
  cheque:     'Chèque',
  bon:        "Bon d'achat",
  biere:      'Bières',
  volants:    'Volants',
  hybride:    'Hybride',
  accessoire: 'Accessoires',
}
