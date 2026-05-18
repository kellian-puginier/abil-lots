# ABIL Prizes — Design Document

**Date** : 2026-05-18
**Projet** : Application de gestion des récompenses du Tour des Héraults (ABIL)
**Repo cible** : https://github.com/kellian-puginier/abil-lots.git
**Working directory** : `C:\Users\kelli\projects\abil-prizes`

---

## 1. Contexte et objectif

L'**Association Bad In Lez (ABIL)** organise chaque année le **Tour des Héraults**, étape nationale de badminton (juin 2026). La répartition des récompenses entre catégories et séries est aujourd'hui gérée sur un fichier Excel partagé, source d'erreurs (cellules écrasées, formules cassées, désynchro entre bénévoles).

L'application doit :
- Fiabiliser la saisie du stock de lots, leur attribution par série, et la traçabilité de la remise
- Conserver les **réflexes visuels** des bénévoles (code couleur identique à l'Excel)
- Fonctionner **mobile-first** (les bénévoles consultent depuis leur téléphone le jour J)
- Offrir un **mode présentation plein écran** pour la cérémonie de remise
- Permettre la **réutilisation d'une année sur l'autre**

L'app est **mono-éditeur** (un responsable saisit la répartition) avec **partage lecture seule multi-appareils** via lien (snapshot encodé).

---

## 2. Structure métier

### 2.1 Catégories ("tableaux")

| Code | Nom complet     | Type   | Nb de séries par défaut |
|------|-----------------|--------|-------------------------|
| SH   | Simple Homme    | simple | 6                       |
| SD   | Simple Dame     | simple | 4                       |
| DH   | Double Homme    | double | 7                       |
| DD   | Double Dame     | double | 6                       |
| DMX  | Double Mixte    | double | 7                       |

Le nombre de séries est **configurable** (ex : DMX peut passer de 6 à 7 d'un clic).

### 2.2 Séries

Chaque catégorie contient une **Série ELITE** + des séries numérotées `S1, S2, S3…`
Exemple pour 5 séries : `ELITE, S1, S2, S3, S4`.

### 2.3 Règles de récompense

- **Simple** : 1 vainqueur + 1 finaliste → chaque lot est compté `× 1`
- **Double** : 2 vainqueurs (la paire) + 2 finalistes (la paire) → **chaque joueur reçoit le même lot** → chaque lot est compté `× 2` automatiquement dans la donnée

### 2.4 Types de lots et code couleur (impératif)

| Type        | Couleur       | Token CSS        | Notes                                  |
|-------------|---------------|------------------|----------------------------------------|
| Chèque cash | Bleu          | `--lot-cash`     | Plusieurs dénominations (150€, 100€…)  |
| Bon d'achat | Orange        | `--lot-bon`      | Plusieurs dénominations (40€…15€)      |
| Bières      | Jaune         | `--lot-biere`    | Ex : "lot de 2 bières"                 |
| Volants     | Blanc + texte | `--lot-volants`  | "BA" sur fond clair, valeur unitaire   |
| Hybride     | Gris clair    | `--lot-hybride`  | Texte "Boîte Hybride", valeur unitaire |
| Accessoires | Violet        | `--lot-access`   | Personnalisable                        |
| Rien        | Noir / vide   | `--lot-none`     | Séries non dotées                      |

---

## 3. Stack technique

### 3.1 Décisions structurantes

- **Next.js 16 + React 19 + TypeScript 5** en mode `output: 'export'` (build statique, zéro serveur)
- **Tailwind CSS 4 + shadcn/ui 4** (cohérence visuelle avec abil-survey)
- **Zustand 5** pour le state (édition + sélecteurs purs)
- **localStorage** pour la persistance (clé `abil-prizes:v1`)
- **Pas de back-end**, pas d'authentification, pas de Supabase — partage par lien snapshot encodé

### 3.2 Dépendances complètes

```
next@16, react@19, typescript@5
tailwindcss@4, shadcn@4, tw-animate-css
zustand@5
lucide-react
sonner                    → toasts auto-save
lz-string                 → compression snapshot URL
qrcode.react              → QR code pour partage
@react-pdf/renderer       → export PDF préparation
clsx, tailwind-merge
framer-motion             → micro-animations
```

### 3.3 Config Next.js

```ts
// next.config.ts
export default {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
}
```

Déployable sur Vercel / Netlify / GitHub Pages.

### 3.4 Palette et typo

Copiées telles quelles depuis abil-survey :
- `--primary` : bleu royal ABIL `oklch(0.55 0.22 265)` (~ #2563EB)
- `--secondary` : jaune shuttlecock `oklch(0.78 0.17 83)` (~ #F59E0B)
- Fonts : **Barlow** (sans), **Barlow Condensed** (heading)
- Radius `0.75rem`

Variables additionnelles spécifiques aux lots :
```css
--lot-cash:    #2563EB;
--lot-bon:     #F59E0B;
--lot-biere:   #FACC15;
--lot-volants: #FFFFFF;   /* + bordure */
--lot-hybride: #E5E7EB;
--lot-access:  #A78BFA;
--lot-none:    #111827;
```

---

## 4. Modèle de données

### 4.1 Schéma TypeScript

```ts
type CategoryCode = 'SH' | 'SD' | 'DH' | 'DD' | 'DMX'

type StockItemKind =
  | 'cheque' | 'bon' | 'biere' | 'volants' | 'hybride' | 'accessoire'

interface StockItem {
  id: string                    // uuid
  kind: StockItemKind
  label: string                 // "Chèque 150€", "Lot de 2 bières"
  amount?: number               // pour cheque / bon : valeur faciale en EUR
  unitValue?: number            // pour biere / volants / hybride / accessoire
  quantity: number              // total disponible saisi
}

interface LotRef {
  stockItemId: string
  count: number                 // simple : 1 ; double : 2 (auto)
}

type AwardStatus = 'empty' | 'draft' | 'validated'

interface SeriesAward {
  winner: LotRef[]
  finalist: LotRef[]
  status: AwardStatus
  deliveredAt?: string          // ISO timestamp si "Lots remis"
}

interface CategoryConfig {
  code: CategoryCode
  label: string
  isDouble: boolean
  seriesCount: number           // ELITE + (seriesCount - 1) numérotées
}

interface Tournament {
  meta: {
    name: string                // "Tour des Héraults 2026"
    year: number
    savedAt: string             // ISO
    locked: boolean             // verrou global jour J
    schemaVersion: 1
  }
  categories: Record<CategoryCode, CategoryConfig>
  stock: StockItem[]
  attributions: Record<string, SeriesAward>   // clé : `${categoryCode}-${seriesKey}`
                                              // seriesKey : 'ELITE' | 'S1' | 'S2' | …
}
```

### 4.2 Règles invariantes

- `used` n'est **jamais stocké** : il est dérivé des `attributions` (évite désynchro)
- `LotRef.count` vaut `2` par défaut quand la catégorie a `isDouble: true`, `1` sinon — appliqué automatiquement à l'édition
- Les clés de séries sont générées : `['ELITE', 'S1', ..., 'S(seriesCount-1)']`
- Réduire `seriesCount` purge les attributions des séries supprimées (avec confirmation)

### 4.3 Persistance

- `localStorage` clé `abil-prizes:v1` — sérialisation JSON complète
- Auto-save debounce **500 ms** sur toute mutation Zustand
- Migration future : la clé `schemaVersion` permettra de gérer les évolutions

---

## 5. Architecture des écrans

### 5.1 Routes (toutes statiques, compatibles `output: 'export'`)

| Route                  | Rôle                                                       |
|------------------------|------------------------------------------------------------|
| `/`                    | Dashboard : KPI, % validation, alertes stock               |
| `/stock`               | Saisie du stock par type                                   |
| `/config`              | Nb de tableaux par catégorie + nom du tournoi              |
| `/repartition`         | Vue tableau Catégorie × Série (cœur édition)               |
| `/preparation`         | Check-list imprimable + export PDF                         |
| `/ceremonie`           | Mode présentation plein écran                              |
| `/share/[snapshot]`    | Vue lecture seule (snapshot encodé dans l'URL)             |
| `/import`              | Page d'import d'un snapshot JSON volumineux                |

### 5.2 Layout

- Header minimal avec **toggle "🔒 Verrouiller"** (read-only global jour J)
- Nav latérale sur desktop, **bottom-bar sur mobile** (5 icônes : Dashboard / Stock / Config / Répartition / Cérémonie)
- `/ceremonie` casse le layout : plein écran, fond contrasté, gros boutons tactiles

### 5.3 Écrans — détail fonctionnel

**`/stock`** — Saisie du stock
- Sections séparées par type de lot, code couleur respecté
- Chèques / Bons : système de **dénominations** (lignes `montant + quantité disponible`, ex : 4 × 150€, 6 × 100€)
- Bières / Volants / Hybrides / Accessoires : nom + valeur unitaire + quantité
- Affichage **stock restant** en temps réel (quantité − attribué) avec badge ⚠️ si insuffisant
- Total valorisé par type + total général

**`/config`** — Configuration du tournoi
- Nom du tournoi + année
- Pour chaque catégorie : stepper +/− pour `seriesCount` (1 à 10)
- Vue récap : nombre total de séries à doter, nombre total de personnes à récompenser (calculé `simple × 2 + double × 4`)

**`/repartition`** — Vue principale d'édition
- Tableau **catégories en lignes × séries en colonnes** (scroll horizontal sur mobile)
- Pour chaque cellule (catégorie × série) :
  - Code couleur dominant du lot principal (chips)
  - Valeur totale de la cellule
  - Badge statut : ⚪ Vide / 🟡 En cours / ✅ Validé
- Click sur cellule → **panneau latéral** (sheet) avec :
  - Section "🏆 Vainqueur" : liste des LotRef + ajouter depuis stock
  - Section "🥈 Finaliste" : idem
  - Mention "× 2 (par joueur)" auto pour double
  - Bouton "Valider la série" (passe à `validated`) — **réversible** : un nouveau clic repasse à `draft`
  - Bouton "Dupliquer vers…" → modale avec checkboxes des autres séries
  - Bouton "Vider" avec confirmation

**`/dashboard`** (`/`)
- % validation global (barre de progression) + par catégorie
- Budget total alloué (somme des valeurs attribuées) vs budget cible (saisissable)
- Stock restant par type avec ⚠️ si insuffisant pour finaliser
- Nombre total de personnes à récompenser
- Liste des alertes de cohérence (cf. section 6)

**`/preparation`** — Check-list bénévoles
- Organisée par catégorie puis par série
- Pour chaque série : liste des lots physiques à préparer + cases à cocher (état local non sauvegardé)
- Filtres : par catégorie / par type de lot
- Bouton **export PDF** (via `@react-pdf/renderer`) pour distribuer aux bénévoles
- Layout responsive, lisible mobile

**`/ceremonie`** — Mode présentation plein écran
- En haut : sélecteur grand format **Catégorie + Série** (boutons tactiles larges)
- Au centre, deux grands cadres côte à côte :
  - **🏆 VAINQUEUR** — gros visuels/icônes des lots à remettre
  - **🥈 FINALISTE** — idem
- Mention **"× 2 (par joueur)"** automatique en double
- Boutons **← Série précédente** / **Série suivante →** très larges
- Bouton ✅ **"Lots remis"** (clic = enregistre `deliveredAt: now`, badge vert)
- Annulation : clic long sur le badge ✅ → confirmation
- Raccourcis clavier :
  - `←/→` : série précédente/suivante
  - `↑/↓` : catégorie précédente/suivante
  - `Espace` : toggle "Lots remis"
  - `F` : mode **vidéoprojecteur** (cache UI, ne garde que les deux cadres + titre série)

**`/share/[snapshot]`** — Lecture seule
- Décode le snapshot LZ-string depuis l'URL → reconstruit le state
- Toutes les routes accessibles en read-only (tous les inputs désactivés, boutons d'édition cachés)
- Bandeau "📸 Snapshot du JJ/MM HH:MM — peut être obsolète"
- La cérémonie reste navigable mais "Lots remis" est désactivé

**`/import`** — Fallback gros snapshot
- Upload d'un fichier `.json` (quand l'URL serait trop longue, > 8 Ko)
- Charge en localStorage avec confirmation si écrase l'existant

### 5.4 Découpage des composants

```
app/                       (routes Next.js App Router)
  layout.tsx
  page.tsx                 → Dashboard
  stock/page.tsx
  config/page.tsx
  repartition/page.tsx
  preparation/page.tsx
  ceremonie/page.tsx
  share/[snapshot]/page.tsx
  import/page.tsx

components/
  layout/
    AppShell.tsx
    BottomNav.tsx
    SideNav.tsx
    LockToggle.tsx
    AutosaveIndicator.tsx
  stock/
    StockSection.tsx
    DenominationRow.tsx
    LotRow.tsx
  config/
    CategoryConfigRow.tsx
    SeriesCountStepper.tsx
  repartition/
    RepartitionGrid.tsx
    CellPreview.tsx
    AwardEditorPanel.tsx
    LotPicker.tsx
    DuplicateMenu.tsx
  dashboard/
    KPICard.tsx
    ValidationProgress.tsx
    AlertsList.tsx
    PerPlayerView.tsx
  preparation/
    ChecklistByCategory.tsx
    PrintablePDF.tsx
  ceremonie/
    PresentationStage.tsx
    LotCardLarge.tsx
    SeriesNavigator.tsx
    ProjectorMode.tsx
  share/
    SnapshotBanner.tsx
    ShareDialog.tsx          → bouton "Partager", QR code, fallback fichier
  shared/
    LotBadge.tsx
    ColorChip.tsx
    ValueChip.tsx
    StatusBadge.tsx
    ConfirmDialog.tsx

lib/
  store.ts                   → Zustand store + actions
  derivations.ts             → sélecteurs purs (stock restant, totaux, % validé)
  validators.ts              → règles de cohérence
  share-codec.ts             → encode/decode JSON ↔ URL (LZ-string)
  pdf-export.ts              → génération PDF de la prep
  defaults.ts                → config par défaut
  series.ts                  → utilitaires séries (génération clés ELITE/S1…)
  storage.ts                 → wrapper localStorage + auto-save debounce

types/
  tournament.ts              → types TS partagés

styles/
  globals.css                → tokens couleurs (palette ABIL + tokens lots)
```

**Principe** : un fichier = une responsabilité. Les fichiers > 200 lignes sont à découper.

---

## 6. Garde-fous et cohérence

### 6.1 Vérifications (non-bloquantes)

| Code | Règle                                                                     | Sévérité  |
|------|---------------------------------------------------------------------------|-----------|
| V1   | Finaliste > Vainqueur (valeur totale) dans la même série                  | ⚠️ orange |
| V2   | Série ELITE moins dotée qu'une série numérotée de la même catégorie       | ⚠️ orange |
| V3   | Écart > 30 % de "valeur par joueur" entre catégories au même rang         | ⚠️ orange |
| V4   | Stock attribué + 1 série restante > disponible                            | 🔴 rouge  |
| V5   | Aucune attribution sur une série existante (rappel)                       | ℹ️ info   |

Toutes les alertes :
- s'affichent sur le **Dashboard** dans une liste cliquable (mène à la cellule concernée)
- placent un badge sur la cellule incriminée dans `/repartition`
- n'empêchent jamais de sauvegarder ou valider

### 6.2 Vue "valeur par joueur" (Dashboard)

**Définition** : la valeur par joueur est la somme des valeurs unitaires des `LotRef`, indépendamment de `count`. Comme `count` = nb de joueurs récompensés (1 en simple, 2 en double) et que chaque joueur reçoit un exemplaire, cette formule donne bien ce qu'**un seul joueur** reçoit :
```
valueParPlayer(role) = Σ stockItem.value pour chaque LotRef du role
totalCellValue       = Σ stockItem.value × LotRef.count       (coût stock total)
```

Pour chaque catégorie / série / rôle (vainqueur ou finaliste), afficher :
```
catégorie | série | rôle      | valeur par joueur | nb joueurs récompensés
SH        | ELITE | vainqueur | 175 €             | 1
DH        | ELITE | vainqueur | 175 €             | 2
…
```
Permet de repérer un déséquilibre H/F ou Simple/Double d'un coup d'œil.

### 6.3 Frictions du jour J — fonctionnalités dédiées

| # | Friction anticipée                       | Solution intégrée                                           |
|---|------------------------------------------|-------------------------------------------------------------|
| 1 | Modif accidentelle pendant la cérémonie  | Toggle "🔒 Verrouiller" — bloque édition stock/répartition/config et reset, autorise navigation cérémonie + "Lots remis" + partage |
| 2 | Saisie répétitive (S5 SH ≈ S5 DH)        | Bouton "Dupliquer vers…" avec checkboxes pré-cochées        |
| 3 | Réutilisation d'une année sur l'autre    | Import JSON + reset des `deliveredAt` et `status`           |
| 4 | Tap accidentel sur "Lots remis"          | Annulation = clic long + confirmation                       |
| 5 | Navigation cérémonie sans souris         | Raccourcis ←/→/↑/↓/Espace/F                                 |
| 6 | Visibilité à 5 m sur vidéoprojecteur     | Mode `F` (UI cachée, gros visuels uniquement)               |
| 7 | Doute "ai-je bien sauvegardé ?"          | Toast `💾 Sauvegardé` à chaque modif                        |
| 8 | Reset accidentel                         | Modale + saisie du mot `RESET` pour confirmer               |

---

## 7. Partage multi-appareils

### 7.1 Mécanisme principal — URL snapshot

1. Le responsable clique sur **"Partager le snapshot"** dans le header
2. L'app sérialise `tournament` en JSON → compresse en LZ-string base64-URL
3. Une URL `https://<deploy>/share/<base64>` est générée
4. Affichage : URL + **QR code** + bouton copier
5. Le responsable colle le lien dans WhatsApp / scan QR par les bénévoles
6. Les bénévoles ouvrent → page lecture seule complète

### 7.2 Fallback gros snapshot

- Si l'URL encodée dépasse ~8 Ko : afficher un message + bouton "Télécharger le snapshot JSON"
- Les bénévoles importent le fichier sur leur appareil via `/import`

### 7.3 Indicateur de fraîcheur

- La page `/share/[snapshot]` affiche un bandeau persistant : `📸 Snapshot du JJ/MM HH:MM — peut être obsolète`
- Aucune synchro temps réel : chaque modif majeure → le responsable regénère et repartage le lien

---

## 8. Configuration par défaut

Chargée à la première ouverture (si `localStorage` vide) :

```ts
{
  meta: {
    name: 'Tour des Héraults 2026',
    year: 2026,
    locked: false,
    schemaVersion: 1,
  },
  categories: {
    SH:  { code: 'SH',  label: 'Simple Homme', isDouble: false, seriesCount: 6 },
    SD:  { code: 'SD',  label: 'Simple Dame',  isDouble: false, seriesCount: 4 },
    DH:  { code: 'DH',  label: 'Double Homme', isDouble: true,  seriesCount: 7 },
    DD:  { code: 'DD',  label: 'Double Dame',  isDouble: true,  seriesCount: 6 },
    DMX: { code: 'DMX', label: 'Double Mixte', isDouble: true,  seriesCount: 7 },
  },
  stock: [],                  // vide, l'utilisateur saisit dans /stock
  attributions: {},           // vide
}
```

**Suggestions de dénominations** affichées dans `/stock` au démarrage (en placeholder, l'utilisateur ajoute la quantité) :
- Chèques : 150 €, 100 €
- Bons d'achat : 40 €, 35 €, 30 €, 25 €, 20 €, 15 €
- Lots types : "Lot de 2 bières", "Boîte de volants", "Boîte hybride"

---

## 9. Accessibilité

- Contrastes vérifiés **WCAG AA** (notamment texte sur color chips lot)
- Navigation clavier complète (tabindex, focus visibles)
- Raccourcis cérémonie documentés et listés dans l'UI (touche `?`)
- `aria-label` sur tous les boutons icône, badges et color chips
- `prefers-reduced-motion` respecté (Framer Motion conditionne les animations)
- Touch targets ≥ 44 × 44 px sur mobile (notamment cérémonie)

---

## 10. Tests

- **Vitest** sur les fonctions pures :
  - `lib/derivations.ts` : stock restant, totaux, % validé
  - `lib/validators.ts` : V1 à V5
  - `lib/share-codec.ts` : round-trip encode/decode
  - `lib/series.ts` : génération des clés ELITE/S1/…
- Pas de tests E2E v1 (effort / valeur trop faible pour un usage 1×/an)

---

## 11. Livraison

- README en français : install, dev, build (`out/`), premier démarrage, format JSON, instructions partage et déploiement
- Repo Git initialisé + premier commit + push vers `https://github.com/kellian-puginier/abil-lots.git` (repo existant et vide)
- Branche par défaut : `main`

---

## 12. Hors scope v1

- Synchronisation temps réel multi-éditeurs (Supabase) — explicitement écarté
- Authentification (l'app est locale, partage explicite par lien)
- Saisie des noms des gagnants (traçabilité = horodatage seul)
- Photos / images des lots dans la cérémonie (texte + icônes suffisent v1)
- Internationalisation (FR uniquement)
- Mode sombre (à voir selon retours)

---

## 13. Glossaire

- **Tableau** : synonyme de "catégorie" dans le jargon FFBaD (SH, SD, DH, DD, DMX)
- **Série** : sous-division d'une catégorie par niveau (ELITE, S1, S2…)
- **Vainqueur** : 1ʳᵉ place (1 joueur en simple, 2 en double)
- **Finaliste** : 2ᵉ place (1 joueur en simple, 2 en double)
- **Doter (une série)** : lui attribuer des lots pour vainqueur et finaliste
