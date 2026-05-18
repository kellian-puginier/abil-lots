export function generateSeriesKeys(seriesCount: number): string[] {
  if (seriesCount < 1) throw new Error('seriesCount must be >= 1')
  const keys = ['ELITE']
  for (let i = 1; i < seriesCount; i++) keys.push(`S${i}`)
  return keys
}
