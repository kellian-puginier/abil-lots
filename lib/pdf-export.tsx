import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'
import type { Tournament, CategoryCode } from '@/types/tournament'
import { generateSeriesKeys } from '@/lib/series'

const styles = StyleSheet.create({
  page:    { padding: 32, fontSize: 10, fontFamily: 'Helvetica' },
  h1:      { fontSize: 18, marginBottom: 8, fontWeight: 700 },
  h2:      { fontSize: 13, marginTop: 12, marginBottom: 4, fontWeight: 700 },
  series:  { marginBottom: 4, paddingLeft: 6 },
  role:    { fontWeight: 700 },
  lot:     { marginLeft: 8 },
  empty:   { color: '#888888', fontStyle: 'italic' },
})

const ORDER: CategoryCode[] = ['SH', 'SD', 'DH', 'DD', 'DMX']

export function ChecklistDocument({ t }: { t: Tournament }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>{t.meta.name} — Checklist préparation</Text>
        {ORDER.map(code => {
          const cfg = t.categories[code]
          return (
            <View key={code}>
              <Text style={styles.h2}>{cfg.label} ({cfg.isDouble ? 'Double' : 'Simple'})</Text>
              {generateSeriesKeys(cfg.seriesCount).map(sKey => {
                const a = t.attributions[`${code}-${sKey}`]
                if (!a || (a.winner.length === 0 && a.finalist.length === 0)) {
                  return <Text key={sKey} style={[styles.series, styles.empty]}>{sKey} — non doté</Text>
                }
                return (
                  <View key={sKey} style={styles.series}>
                    <Text>{sKey}</Text>
                    {(['winner', 'finalist'] as const).map(role => (
                      <View key={role}>
                        {a[role].length > 0 && <Text style={styles.role}>  {role === 'winner' ? 'Vainqueur' : 'Finaliste'}</Text>}
                        {a[role].map((ref, i) => {
                          const item = t.stock.find(x => x.id === ref.stockItemId)
                          if (!item) return null
                          return <Text key={i} style={styles.lot}>  ☐ {item.label} × {ref.count}</Text>
                        })}
                      </View>
                    ))}
                  </View>
                )
              })}
            </View>
          )
        })}
      </Page>
    </Document>
  )
}

export async function downloadChecklistPdf(t: Tournament) {
  const blob = await pdf(<ChecklistDocument t={t} />).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `preparation-${t.meta.name.replace(/\s+/g, '-').toLowerCase()}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
