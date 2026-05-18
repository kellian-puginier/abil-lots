'use client'
import { useStore } from '@/lib/store'
import { valuePerPlayer } from '@/lib/derivations'
import { generateSeriesKeys } from '@/lib/series'
import type { CategoryCode } from '@/types/tournament'

const ORDER: CategoryCode[] = ['SH', 'SD', 'DH', 'DD', 'DMX']

export function PerPlayerView() {
  const t = useStore(s => s.tournament)
  const rows: { code: CategoryCode; sKey: string; winnerPerPlayer: number; finalistPerPlayer: number; recipients: number }[] = []
  for (const code of ORDER) {
    const cfg = t.categories[code]
    for (const sKey of generateSeriesKeys(cfg.seriesCount)) {
      rows.push({
        code,
        sKey,
        winnerPerPlayer:   valuePerPlayer(t, `${code}-${sKey}`, 'winner'),
        finalistPerPlayer: valuePerPlayer(t, `${code}-${sKey}`, 'finalist'),
        recipients: cfg.isDouble ? 4 : 2,
      })
    }
  }

  return (
    <section className="rounded-lg border bg-card p-4 space-y-3">
      <h2>Valeur par joueur</h2>
      <p className="text-xs text-muted-foreground">Permet de repérer un déséquilibre H/F ou Simple/Double à rang égal.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-muted-foreground">
            <tr><th className="text-left">Catégorie</th><th className="text-left">Série</th><th className="text-right">Vainqueur</th><th className="text-right">Finaliste</th><th className="text-right">Joueurs</th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t">
                <td>{t.categories[r.code].label}</td>
                <td>{r.sKey}</td>
                <td className="text-right tabular-nums">{r.winnerPerPlayer.toLocaleString('fr-FR')} €</td>
                <td className="text-right tabular-nums">{r.finalistPerPlayer.toLocaleString('fr-FR')} €</td>
                <td className="text-right tabular-nums">{r.recipients}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
