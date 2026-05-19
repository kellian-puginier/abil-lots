import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'
import type { Tournament, CategoryCode, LotRef, SeriesAward } from '@/types/tournament'
import { generateSeriesKeys } from '@/lib/series'

const styles = StyleSheet.create({
  page:      { padding: 32, fontSize: 10, fontFamily: 'Helvetica' },
  h1:        { fontSize: 18, marginBottom: 8, fontWeight: 700 },
  h2:        { fontSize: 13, marginTop: 12, marginBottom: 4, fontWeight: 700 },
  h3:        { fontSize: 11, marginTop: 6, marginBottom: 2, fontWeight: 700 },
  series:    { marginBottom: 4, paddingLeft: 6 },
  roleLabel: { fontWeight: 700 },
  gender:    { fontWeight: 700, marginTop: 4 },
  lot:       { marginLeft: 8 },
  empty:     { color: '#888888', fontStyle: 'italic' },
})

const ORDER: CategoryCode[] = ['SH', 'SD', 'DH', 'DD', 'DMX']

function RefsBlock({ refs, t }: { refs: LotRef[]; t: Tournament }) {
  return (
    <>
      {refs.map((ref, i) => {
        const item = t.stock.find(x => x.id === ref.stockItemId)
        if (!item) return null
        return (
          <Text key={i} style={styles.lot}>
            {'  '}☐ {item.label} × {ref.count}
          </Text>
        )
      })}
    </>
  )
}

function SeriesBlock({ aKey, award, t, sKey }: {
  aKey: string
  award: SeriesAward
  t: Tournament
  sKey: string
}) {
  const genderSplit = !!award.genderSplit
  const hasLots = award.winner.length > 0 || award.finalist.length > 0 ||
    (award.winnerF ?? []).length > 0 || (award.finalistF ?? []).length > 0

  if (!hasLots) {
    return <Text style={[styles.series, styles.empty]}>{sKey} — non doté</Text>
  }

  if (genderSplit) {
    return (
      <View style={styles.series}>
        <Text>{sKey} (Homme / Femme)</Text>
        {/* Homme */}
        <Text style={styles.gender}>{'  '}👨 Homme</Text>
        {award.winner.length > 0 && (
          <View>
            <Text style={styles.roleLabel}>{'    '}Vainqueur</Text>
            <RefsBlock refs={award.winner} t={t} />
          </View>
        )}
        {award.finalist.length > 0 && (
          <View>
            <Text style={styles.roleLabel}>{'    '}Finaliste</Text>
            <RefsBlock refs={award.finalist} t={t} />
          </View>
        )}
        {/* Femme */}
        <Text style={styles.gender}>{'  '}👩 Femme</Text>
        {(award.winnerF ?? []).length > 0 && (
          <View>
            <Text style={styles.roleLabel}>{'    '}Vainqueur</Text>
            <RefsBlock refs={award.winnerF!} t={t} />
          </View>
        )}
        {(award.finalistF ?? []).length > 0 && (
          <View>
            <Text style={styles.roleLabel}>{'    '}Finaliste</Text>
            <RefsBlock refs={award.finalistF!} t={t} />
          </View>
        )}
      </View>
    )
  }

  return (
    <View style={styles.series}>
      <Text>{sKey}</Text>
      {(['winner', 'finalist'] as const).map(role => (
        <View key={role}>
          {award[role].length > 0 && (
            <>
              <Text style={styles.roleLabel}>
                {'  '}{role === 'winner' ? 'Vainqueur' : 'Finaliste'}
              </Text>
              <RefsBlock refs={award[role]} t={t} />
            </>
          )}
        </View>
      ))}
    </View>
  )
}

export function ChecklistDocument({ t }: { t: Tournament }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>{t.meta.name} — Checklist préparation</Text>
        {ORDER.map(code => {
          const cfg = t.categories[code]
          return (
            <View key={code}>
              <Text style={styles.h2}>
                {cfg.label} ({cfg.isDouble ? 'Double' : 'Simple'})
              </Text>
              {generateSeriesKeys(cfg.seriesCount).map(sKey => {
                const aKey  = `${code}-${sKey}`
                const award = t.attributions[aKey]
                if (!award) {
                  return (
                    <Text key={aKey} style={[styles.series, styles.empty]}>
                      {sKey} — non doté
                    </Text>
                  )
                }
                return (
                  <SeriesBlock key={aKey} aKey={aKey} award={award} t={t} sKey={sKey} />
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
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `preparation-${t.meta.name.replace(/\s+/g, '-').toLowerCase()}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
