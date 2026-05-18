# ABIL Prizes — Tour des Héraults

Application web statique de gestion des récompenses pour le tournoi **Tour des Héraults** organisé par l'Association Bad In Lez (ABIL).

Elle remplace le fichier Excel historique par une UX mobile-first, un mode présentation pour la cérémonie de remise, des garde-fous de cohérence, et un partage en lecture seule par lien.

## Démarrage

```bash
npm install
npm run dev
# http://localhost:3000
```

## Build statique (production)

```bash
npm run build
# génère le dossier out/ déployable n'importe où (Vercel, Netlify, GitHub Pages…)
```

## Tests

```bash
npm test
```

Couvre les fonctions pures (`lib/series`, `lib/defaults`, `lib/derivations`, `lib/validators`, `lib/share-codec`, `lib/storage`, `lib/store`).

## Persistance & sauvegarde

- Auto-sauvegarde locale dans `localStorage` (clé `abil-prizes:v1`)
- Export JSON via le bouton **Partager → Télécharger le JSON**
- Import JSON via la page `/import`
- Reset complet avec double confirmation (`/import` → Reset complet)

## Partage multi-appareils

- Bouton **Partager** dans l'en-tête → URL avec snapshot compressé (`/share?s=…`) + QR code
- Les bénévoles ouvrent le lien → vue en **lecture seule** (verrouillage automatique)
- Si le tournoi est trop volumineux pour une URL : télécharge le JSON, partage-le par WhatsApp, les bénévoles importent via `/import`

## Raccourcis cérémonie (`/ceremonie`)

| Touche      | Action                          |
|-------------|---------------------------------|
| `←` / `→`   | Série précédente / suivante     |
| `↑` / `↓`   | Catégorie précédente / suivante |
| `Espace`    | Marquer les lots comme remis    |
| `F`         | Mode projecteur plein écran     |
| `Échap`     | Quitter le mode projecteur      |

## Garde-fous de cohérence

Le dashboard liste automatiquement :

- **V1** : finaliste plus doté que le vainqueur dans une même série
- **V2** : ELITE moins dotée qu'une série numérotée
- **V3** : écart > 30 % entre catégories au même rang (équité H/F & Simple/Double)
- **V4** : stock insuffisant pour finaliser
- **V5** : séries non dotées (informatif)

## Stack

Next.js 16 (`output: 'export'`) · React 19 · TypeScript · Tailwind 4 · shadcn/ui · Zustand · LZ-string · @react-pdf/renderer · Framer Motion · Sonner.

## Documents

- Spec design : [`docs/superpowers/specs/2026-05-18-abil-prizes-design.md`](docs/superpowers/specs/2026-05-18-abil-prizes-design.md)
- Plan d'implémentation : [`docs/superpowers/plans/2026-05-18-abil-prizes.md`](docs/superpowers/plans/2026-05-18-abil-prizes.md)
