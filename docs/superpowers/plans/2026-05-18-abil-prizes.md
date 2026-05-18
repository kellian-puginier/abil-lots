# ABIL Prizes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static-export Next.js web app that lets the ABIL badminton club manage prize allocation for the Tour des Héraults tournament — stock entry, prize attribution per series, validation rules, ceremony presentation mode, and read-only sharing by snapshot URL.

**Architecture:** Next.js 16 App Router in `output: 'export'` mode (static SPA, deployable on Vercel/Netlify/GH Pages). Single Zustand store mirroring a `Tournament` aggregate, persisted to `localStorage` with debounced auto-save. Pure derivation/validation functions in `lib/*` (TDD). Read-only sharing via LZ-string-compressed snapshot in URL.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui 4, Zustand 5, lucide-react, sonner, lz-string, qrcode.react, @react-pdf/renderer, framer-motion, clsx, tailwind-merge. Tests via Vitest.

**Working directory:** `C:\Users\kelli\projects\abil-prizes` (currently empty, to scaffold).
**Repo cible:** `https://github.com/kellian-puginier/abil-lots.git` (existant, vide).
**Spec source:** `docs/superpowers/specs/2026-05-18-abil-prizes-design.md`.

---

## File Structure

```
abil-prizes/
├── app/                           # Next.js App Router routes
│   ├── layout.tsx                 # Root layout, fonts, Toaster, AppShell
│   ├── page.tsx                   # /  — Dashboard
│   ├── globals.css                # Tailwind + tokens (palette ABIL + lot colors)
│   ├── stock/page.tsx             # /stock
│   ├── config/page.tsx            # /config
│   ├── repartition/page.tsx       # /repartition
│   ├── preparation/page.tsx       # /preparation
│   ├── ceremonie/page.tsx         # /ceremonie
│   ├── share/[snapshot]/page.tsx  # /share/[snapshot] (read-only)
│   └── import/page.tsx            # /import (fallback for large JSON)
├── components/
│   ├── layout/                    # AppShell, BottomNav, SideNav, LockToggle, AutosaveIndicator
│   ├── stock/                     # StockSection, DenominationRow, LotRow
│   ├── config/                    # CategoryConfigRow, SeriesCountStepper
│   ├── repartition/               # RepartitionGrid, CellPreview, AwardEditorPanel, LotPicker, DuplicateMenu
│   ├── dashboard/                 # KPICard, ValidationProgress, AlertsList, PerPlayerView
│   ├── preparation/               # ChecklistByCategory, PrintablePDF
│   ├── ceremonie/                 # PresentationStage, LotCardLarge, SeriesNavigator, ProjectorMode
│   ├── share/                     # ShareDialog, SnapshotBanner
│   ├── shared/                    # LotBadge, ColorChip, ValueChip, StatusBadge, ConfirmDialog
│   └── ui/                        # shadcn primitives (button, card, sheet, dialog, etc.)
├── lib/
│   ├── store.ts                   # Zustand store + actions
│   ├── storage.ts                 # localStorage wrapper, hydration, debounced auto-save
│   ├── derivations.ts             # Pure selectors (stock used, totals, % validated)
│   ├── validators.ts              # V1–V5 rules
│   ├── share-codec.ts             # JSON ↔ URL (LZ-string)
│   ├── pdf-export.ts              # @react-pdf/renderer for /preparation export
│   ├── defaults.ts                # Default Tournament (SH6, SD4, DH7, DD6, DMX7)
│   ├── series.ts                  # Series key generation, helpers
│   └── utils.ts                   # cn() (clsx + tailwind-merge)
├── types/
│   └── tournament.ts              # Tournament, CategoryConfig, StockItem, SeriesAward, LotRef, …
├── tests/
│   └── lib/                       # Vitest tests mirroring lib/*
├── docs/superpowers/
│   ├── specs/2026-05-18-abil-prizes-design.md
│   └── plans/2026-05-18-abil-prizes.md   # this file
├── public/                        # static assets (favicon, og-image)
├── components.json                # shadcn config
├── next.config.ts                 # output: 'export'
├── tsconfig.json
├── eslint.config.mjs
├── postcss.config.mjs
├── vitest.config.ts
├── package.json
├── .gitignore
└── README.md
```

**Boundaries:**
- `types/` — pure type declarations, no runtime code.
- `lib/` — pure functions + Zustand store. No React imports except hooks built on top.
- `components/` — UI only. Reads/writes via the store or via props.
- `app/` — thin pages that compose `components/*`.

**Files that must stay focused:**
- `lib/store.ts` should remain ≤ 200 lines: pure actions, no derivations. Selectors live in `lib/derivations.ts`.
- `components/repartition/AwardEditorPanel.tsx` — ≤ 200 lines: split if it grows (separate `WinnerSection` / `FinalistSection`).

---

## Phase 0 — Foundation

### Task 1: Scaffold Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `next-env.d.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `.gitignore`, `public/.gitkeep`

- [ ] **Step 1: Run `create-next-app`**

Run from `C:\Users\kelli\projects\`:
```bash
npx --yes create-next-app@latest abil-prizes \
  --typescript --eslint --app --src-dir=false \
  --tailwind --import-alias "@/*" --no-turbopack --no-git
```

Expected: project scaffolded into `abil-prizes/`. If `abil-prizes/` already exists and is empty, the CLI may refuse; in that case run it as `npx create-next-app@latest .` from inside the directory. Choose "Yes" to all prompts that ask about Tailwind/App Router/TypeScript.

- [ ] **Step 2: Verify scaffold builds**

Run from project root:
```bash
npm run dev
```

Expected: Next dev server starts on `http://localhost:3000` and the default home page renders. Stop with Ctrl+C.

- [ ] **Step 3: Replace `next.config.ts` with static export config**

```ts
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
  reactStrictMode: true,
}

export default nextConfig
```

- [ ] **Step 4: Run build to confirm export works**

```bash
npm run build
```

Expected: build succeeds and `out/` directory is created.

- [ ] **Step 5: Add `out/` to `.gitignore`**

Append to `.gitignore`:
```
out/
```

- [ ] **Step 6: Commit**

```bash
git init -b main
git add -A
git commit -m "chore: scaffold Next.js 16 static export"
```

---

### Task 2: Install runtime dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install production deps**

```bash
npm install zustand@5 lucide-react sonner lz-string qrcode.react @react-pdf/renderer framer-motion clsx tailwind-merge class-variance-authority tw-animate-css
```

- [ ] **Step 2: Install dev deps**

```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom @types/lz-string
```

- [ ] **Step 3: Verify package.json contains all entries**

Open `package.json`, confirm the `dependencies` and `devDependencies` sections include every package above. No version mismatches expected.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install runtime + test dependencies"
```

---

### Task 3: Initialize shadcn/ui

**Files:**
- Create: `components.json`, `lib/utils.ts`, `components/ui/*` (shadcn primitives)

- [ ] **Step 1: Run shadcn init**

```bash
npx --yes shadcn@latest init
```

Answer prompts:
- Style → "base-nova"
- Base color → "neutral"
- CSS variables → yes
- App Router → yes

This writes `components.json`, `lib/utils.ts` (with `cn()`), and updates `app/globals.css` with shadcn base layer.

- [ ] **Step 2: Verify `components.json` matches abil-survey**

Ensure the file looks like:
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "base-nova",
  "rsc": true,
  "tsx": true,
  "tailwind": { "config": "", "css": "app/globals.css", "baseColor": "neutral", "cssVariables": true, "prefix": "" },
  "iconLibrary": "lucide",
  "rtl": false,
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "menuColor": "default",
  "menuAccent": "subtle",
  "registries": {}
}
```

Edit if needed to exactly match.

- [ ] **Step 3: Add the shadcn primitives we'll need**

```bash
npx --yes shadcn@latest add button card sheet dialog input label checkbox switch separator progress badge tabs tooltip toast sonner table dropdown-menu
```

- [ ] **Step 4: Build to confirm nothing broke**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: init shadcn/ui (base-nova) and add primitives"
```

---

### Task 4: Apply ABIL palette + fonts + lot color tokens

**Files:**
- Modify: `app/globals.css`, `app/layout.tsx`

- [ ] **Step 1: Replace `app/globals.css` entirely**

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  /* ── Fonts ─────────────────────────────────────────── */
  --font-sans:    var(--font-barlow), system-ui, sans-serif;
  --font-heading: var(--font-barlow-condensed), system-ui, sans-serif;
  --font-mono:    ui-monospace, monospace;

  /* ── Color tokens → CSS vars ───────────────────────── */
  --color-background:         var(--background);
  --color-foreground:         var(--foreground);
  --color-card:               var(--card);
  --color-card-foreground:    var(--card-foreground);
  --color-popover:            var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary:            var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary:          var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted:              var(--muted);
  --color-muted-foreground:   var(--muted-foreground);
  --color-accent:             var(--accent);
  --color-accent-foreground:  var(--accent-foreground);
  --color-destructive:        var(--destructive);
  --color-border:             var(--border);
  --color-input:              var(--input);
  --color-ring:               var(--ring);

  /* ── Lot color tokens (impératif — code couleur Excel) ── */
  --color-lot-cash:    var(--lot-cash);
  --color-lot-bon:     var(--lot-bon);
  --color-lot-biere:   var(--lot-biere);
  --color-lot-volants: var(--lot-volants);
  --color-lot-hybride: var(--lot-hybride);
  --color-lot-access:  var(--lot-access);
  --color-lot-none:    var(--lot-none);

  /* ── Radius ─────────────────────────────────────────── */
  --radius-sm:  calc(var(--radius) * 0.6);
  --radius-md:  calc(var(--radius) * 0.8);
  --radius-lg:  var(--radius);
  --radius-xl:  calc(var(--radius) * 1.4);
  --radius-2xl: calc(var(--radius) * 1.8);
  --radius-3xl: calc(var(--radius) * 2.4);
}

/* ══════════════════════════════════════════════════════
   PALETTE ABIL — Bleu royal + Jaune shuttlecock
   ══════════════════════════════════════════════════════ */
:root {
  --primary:            oklch(0.55 0.22 265);
  --primary-foreground: oklch(1 0 0);

  --secondary:            oklch(0.78 0.17 83);
  --secondary-foreground: oklch(0.13 0.02 265);

  --background:         oklch(0.98 0.005 245);
  --foreground:         oklch(0.13 0.02 265);
  --card:               oklch(1 0 0);
  --card-foreground:    oklch(0.13 0.02 265);
  --popover:            oklch(1 0 0);
  --popover-foreground: oklch(0.13 0.02 265);

  --muted:              oklch(0.96 0.015 245);
  --muted-foreground:   oklch(0.50 0.04 245);

  --accent:             oklch(0.93 0.03 265);
  --accent-foreground:  oklch(0.25 0.05 265);

  --destructive:  oklch(0.57 0.24 27);
  --border:       oklch(0.91 0.02 245);
  --input:        oklch(0.91 0.02 245);
  --ring:         oklch(0.55 0.22 265);
  --radius:       0.75rem;

  /* Lots — code couleur Excel */
  --lot-cash:    #2563EB;
  --lot-bon:     #F59E0B;
  --lot-biere:   #FACC15;
  --lot-volants: #FFFFFF;
  --lot-hybride: #E5E7EB;
  --lot-access:  #A78BFA;
  --lot-none:    #111827;
}

@layer base {
  * { @apply border-border outline-ring/50; }

  body {
    @apply bg-background text-foreground;
    font-family: var(--font-barlow), system-ui, sans-serif;
    font-size: 1rem;
    line-height: 1.6;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-barlow-condensed), system-ui, sans-serif;
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: -0.01em;
  }
  h1 { font-size: clamp(1.75rem, 5vw, 2.5rem); }
  h2 { font-size: clamp(1.4rem, 4vw, 2rem); }
  h3 { font-size: clamp(1.1rem, 3vw, 1.5rem); }
}

@layer utilities {
  .font-display {
    font-family: var(--font-barlow-condensed), system-ui, sans-serif;
    font-weight: 800;
    letter-spacing: -0.02em;
  }
  .glass {
    background: oklch(1 0 0 / 0.75);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid oklch(0.91 0.02 245 / 0.6);
  }

  /* Print: hide app shell, show only printable content */
  @media print {
    .no-print { display: none !important; }
    .print-only { display: block !important; }
  }
}
```

- [ ] **Step 2: Replace `app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import { Barlow, Barlow_Condensed } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

const barlow = Barlow({
  variable: '--font-barlow',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

const barlowCondensed = Barlow_Condensed({
  variable: '--font-barlow-condensed',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ABIL Prizes — Tour des Héraults',
  description: "Gestion des récompenses du tournoi Tour des Héraults (ABIL)",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${barlow.variable} ${barlowCondensed.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Build to confirm**

```bash
npm run build
```

Expected: build succeeds (the home page from scaffold still renders).

- [ ] **Step 4: Commit**

```bash
git add app/globals.css app/layout.tsx
git commit -m "feat(ui): apply ABIL palette, Barlow fonts, lot color tokens"
```

---

### Task 5: Configure Vitest

**Files:**
- Create: `vitest.config.ts`, `tests/setup.ts`
- Modify: `package.json` (scripts), `tsconfig.json`

- [ ] **Step 1: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

- [ ] **Step 2: Create `tests/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 3: Add scripts to `package.json`**

Edit the `scripts` section to add:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:ui": "vitest --ui"
```

- [ ] **Step 4: Add `vitest/globals` to tsconfig types**

In `tsconfig.json`, ensure `compilerOptions.types` includes `"vitest/globals"`. If `types` doesn't exist, add:
```json
"types": ["vitest/globals", "@testing-library/jest-dom"]
```

- [ ] **Step 5: Create a smoke test and run it**

Create `tests/smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest'

describe('smoke', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })
})
```

Run:
```bash
npm test
```

Expected: 1 test passes.

- [ ] **Step 6: Delete the smoke test and commit**

```bash
rm tests/smoke.test.ts
git add -A
git commit -m "chore: configure Vitest with jsdom + RTL"
```

---

## Phase 1 — Domain types and pure utilities (TDD)

### Task 6: Define domain types

**Files:**
- Create: `types/tournament.ts`

- [ ] **Step 1: Write the types**

```ts
// types/tournament.ts

export type CategoryCode = 'SH' | 'SD' | 'DH' | 'DD' | 'DMX'

export type StockItemKind =
  | 'cheque' | 'bon' | 'biere' | 'volants' | 'hybride' | 'accessoire'

export interface StockItem {
  id: string
  kind: StockItemKind
  label: string
  amount?: number       // for cheque / bon: face value in EUR
  unitValue?: number    // for biere / volants / hybride / accessoire
  quantity: number      // total available
}

export interface LotRef {
  stockItemId: string
  count: number         // 1 for simple, 2 for double (auto)
}

export type AwardStatus = 'empty' | 'draft' | 'validated'

export interface SeriesAward {
  winner: LotRef[]
  finalist: LotRef[]
  status: AwardStatus
  deliveredAt?: string  // ISO timestamp
}

export interface CategoryConfig {
  code: CategoryCode
  label: string
  isDouble: boolean
  seriesCount: number   // includes ELITE
}

export interface Tournament {
  meta: {
    name: string
    year: number
    savedAt: string
    locked: boolean
    schemaVersion: 1
  }
  categories: Record<CategoryCode, CategoryConfig>
  stock: StockItem[]
  attributions: Record<string, SeriesAward>  // key: `${code}-${seriesKey}`
}

export const CATEGORY_CODES: readonly CategoryCode[] = ['SH', 'SD', 'DH', 'DD', 'DMX'] as const

export function seriesKey(code: CategoryCode, key: string): string {
  return `${code}-${key}`
}
```

- [ ] **Step 2: Confirm it compiles**

```bash
npx tsc --noEmit
```

Expected: no type errors.

- [ ] **Step 3: Commit**

```bash
git add types/tournament.ts
git commit -m "feat(types): add Tournament domain types"
```

---

### Task 7: `lib/series.ts` — series key generation (TDD)

**Files:**
- Create: `lib/series.ts`
- Test: `tests/lib/series.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/series.test.ts
import { describe, it, expect } from 'vitest'
import { generateSeriesKeys } from '@/lib/series'

describe('generateSeriesKeys', () => {
  it('returns [ELITE] for seriesCount=1', () => {
    expect(generateSeriesKeys(1)).toEqual(['ELITE'])
  })

  it('returns [ELITE, S1] for seriesCount=2', () => {
    expect(generateSeriesKeys(2)).toEqual(['ELITE', 'S1'])
  })

  it('returns [ELITE, S1, ..., S5] for seriesCount=6', () => {
    expect(generateSeriesKeys(6)).toEqual(['ELITE', 'S1', 'S2', 'S3', 'S4', 'S5'])
  })

  it('throws for seriesCount < 1', () => {
    expect(() => generateSeriesKeys(0)).toThrow()
  })
})
```

- [ ] **Step 2: Run test, confirm it fails**

```bash
npm test
```

Expected: ALL tests fail with `Cannot find module '@/lib/series'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/series.ts
export function generateSeriesKeys(seriesCount: number): string[] {
  if (seriesCount < 1) throw new Error('seriesCount must be >= 1')
  const keys = ['ELITE']
  for (let i = 1; i < seriesCount; i++) keys.push(`S${i}`)
  return keys
}
```

- [ ] **Step 4: Run tests, confirm they pass**

```bash
npm test
```

Expected: 4/4 pass.

- [ ] **Step 5: Commit**

```bash
git add lib/series.ts tests/lib/series.test.ts
git commit -m "feat(lib): generateSeriesKeys"
```

---

### Task 8: `lib/defaults.ts` — default Tournament (TDD)

**Files:**
- Create: `lib/defaults.ts`
- Test: `tests/lib/defaults.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/defaults.test.ts
import { describe, it, expect } from 'vitest'
import { defaultTournament } from '@/lib/defaults'

describe('defaultTournament', () => {
  it('has 5 categories with expected seriesCount', () => {
    const t = defaultTournament()
    expect(t.categories.SH.seriesCount).toBe(6)
    expect(t.categories.SD.seriesCount).toBe(4)
    expect(t.categories.DH.seriesCount).toBe(7)
    expect(t.categories.DD.seriesCount).toBe(6)
    expect(t.categories.DMX.seriesCount).toBe(7)
  })

  it('marks doubles correctly', () => {
    const t = defaultTournament()
    expect(t.categories.SH.isDouble).toBe(false)
    expect(t.categories.SD.isDouble).toBe(false)
    expect(t.categories.DH.isDouble).toBe(true)
    expect(t.categories.DD.isDouble).toBe(true)
    expect(t.categories.DMX.isDouble).toBe(true)
  })

  it('has empty stock and attributions', () => {
    const t = defaultTournament()
    expect(t.stock).toEqual([])
    expect(t.attributions).toEqual({})
  })

  it('has schemaVersion 1 and locked false', () => {
    const t = defaultTournament()
    expect(t.meta.schemaVersion).toBe(1)
    expect(t.meta.locked).toBe(false)
  })

  it('name defaults to "Tour des Héraults <year>"', () => {
    const t = defaultTournament(2026)
    expect(t.meta.year).toBe(2026)
    expect(t.meta.name).toBe('Tour des Héraults 2026')
  })
})
```

- [ ] **Step 2: Run test, confirm it fails**

```bash
npm test
```

Expected: tests fail with `Cannot find module '@/lib/defaults'`.

- [ ] **Step 3: Write implementation**

```ts
// lib/defaults.ts
import type { Tournament, CategoryConfig, CategoryCode } from '@/types/tournament'

const CAT: Record<CategoryCode, Omit<CategoryConfig, 'seriesCount'> & { seriesCount: number }> = {
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
```

- [ ] **Step 4: Run tests, confirm they pass**

```bash
npm test
```

Expected: 5/5 pass (plus prior series tests = 9 total).

- [ ] **Step 5: Commit**

```bash
git add lib/defaults.ts tests/lib/defaults.test.ts
git commit -m "feat(lib): defaultTournament with ABIL categories"
```

---

### Task 9: `lib/derivations.ts` — pure selectors (TDD)

**Files:**
- Create: `lib/derivations.ts`
- Test: `tests/lib/derivations.test.ts`

Provides:
- `stockUsed(t, stockItemId): number` — sum of `count` across all attributions
- `stockRemaining(t, stockItem): number` — `quantity - stockUsed`
- `cellTotalValue(t, key): number` — Σ `value × count` for both roles
- `valuePerPlayer(t, key, role): number` — Σ `value` (no `× count`)
- `categoryProgress(t, code): { validated: number, total: number }`
- `overallProgress(t): { validated: number, total: number }`
- `totalRecipients(t): number` — simple × 2 + double × 4 per series
- `stockItemValue(item): number` — `amount ?? unitValue ?? 0`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/lib/derivations.test.ts
import { describe, it, expect } from 'vitest'
import {
  stockItemValue,
  stockUsed,
  stockRemaining,
  cellTotalValue,
  valuePerPlayer,
  categoryProgress,
  overallProgress,
  totalRecipients,
} from '@/lib/derivations'
import { defaultTournament } from '@/lib/defaults'
import type { Tournament, StockItem } from '@/types/tournament'

function makeT(): Tournament {
  const t = defaultTournament(2026)
  t.stock = [
    { id: 'chq150', kind: 'cheque', label: 'Chèque 150€', amount: 150, quantity: 4 },
    { id: 'chq100', kind: 'cheque', label: 'Chèque 100€', amount: 100, quantity: 6 },
    { id: 'biere2', kind: 'biere',  label: 'Lot de 2 bières', unitValue: 10, quantity: 20 },
  ]
  t.attributions = {
    'SH-ELITE':  { winner: [{ stockItemId: 'chq150', count: 1 }], finalist: [{ stockItemId: 'chq100', count: 1 }], status: 'validated' },
    'DH-ELITE':  { winner: [{ stockItemId: 'chq150', count: 2 }], finalist: [{ stockItemId: 'chq100', count: 2 }], status: 'validated' },
    'SH-S1':     { winner: [{ stockItemId: 'biere2', count: 1 }], finalist: [],                                     status: 'draft' },
  }
  return t
}

describe('stockItemValue', () => {
  it('returns amount for cheque', () => {
    expect(stockItemValue({ id: 'x', kind: 'cheque', label: '', amount: 150, quantity: 1 })).toBe(150)
  })
  it('returns unitValue for biere', () => {
    expect(stockItemValue({ id: 'x', kind: 'biere', label: '', unitValue: 10, quantity: 1 })).toBe(10)
  })
  it('returns 0 if both missing', () => {
    expect(stockItemValue({ id: 'x', kind: 'cheque', label: '', quantity: 1 })).toBe(0)
  })
})

describe('stockUsed', () => {
  it('sums counts across attributions', () => {
    const t = makeT()
    // chq150: SH-ELITE winner(1) + DH-ELITE winner(2) = 3
    expect(stockUsed(t, 'chq150')).toBe(3)
    // chq100: SH-ELITE finalist(1) + DH-ELITE finalist(2) = 3
    expect(stockUsed(t, 'chq100')).toBe(3)
    expect(stockUsed(t, 'biere2')).toBe(1)
  })
})

describe('stockRemaining', () => {
  it('returns quantity minus used', () => {
    const t = makeT()
    expect(stockRemaining(t, t.stock[0])).toBe(1)   // 4 - 3
    expect(stockRemaining(t, t.stock[1])).toBe(3)   // 6 - 3
    expect(stockRemaining(t, t.stock[2])).toBe(19)  // 20 - 1
  })
})

describe('cellTotalValue', () => {
  it('sums value × count for both roles', () => {
    const t = makeT()
    // SH-ELITE: 150*1 + 100*1 = 250
    expect(cellTotalValue(t, 'SH-ELITE')).toBe(250)
    // DH-ELITE: 150*2 + 100*2 = 500
    expect(cellTotalValue(t, 'DH-ELITE')).toBe(500)
  })
})

describe('valuePerPlayer', () => {
  it('sums values regardless of count for simple', () => {
    const t = makeT()
    expect(valuePerPlayer(t, 'SH-ELITE', 'winner')).toBe(150)
    expect(valuePerPlayer(t, 'SH-ELITE', 'finalist')).toBe(100)
  })
  it('sums values regardless of count for double', () => {
    const t = makeT()
    expect(valuePerPlayer(t, 'DH-ELITE', 'winner')).toBe(150)
    expect(valuePerPlayer(t, 'DH-ELITE', 'finalist')).toBe(100)
  })
})

describe('categoryProgress', () => {
  it('counts validated series', () => {
    const t = makeT()
    const sh = categoryProgress(t, 'SH')
    expect(sh.validated).toBe(1)
    expect(sh.total).toBe(6)
  })
})

describe('overallProgress', () => {
  it('sums across categories', () => {
    const t = makeT()
    const p = overallProgress(t)
    expect(p.validated).toBe(2)
    expect(p.total).toBe(6 + 4 + 7 + 6 + 7)
  })
})

describe('totalRecipients', () => {
  it('simple series count as 2 (1 win + 1 fin), double as 4', () => {
    const t = makeT()
    // SH:6 * 2 + SD:4 * 2 + DH:7 * 4 + DD:6 * 4 + DMX:7 * 4 = 12 + 8 + 28 + 24 + 28 = 100
    expect(totalRecipients(t)).toBe(100)
  })
})
```

- [ ] **Step 2: Run, confirm failure**

```bash
npm test
```

- [ ] **Step 3: Implement `lib/derivations.ts`**

```ts
// lib/derivations.ts
import type { Tournament, StockItem, CategoryCode, SeriesAward } from '@/types/tournament'
import { generateSeriesKeys } from '@/lib/series'

export function stockItemValue(item: StockItem): number {
  return item.amount ?? item.unitValue ?? 0
}

export function stockUsed(t: Tournament, stockItemId: string): number {
  let total = 0
  for (const award of Object.values(t.attributions)) {
    for (const ref of [...award.winner, ...award.finalist]) {
      if (ref.stockItemId === stockItemId) total += ref.count
    }
  }
  return total
}

export function stockRemaining(t: Tournament, item: StockItem): number {
  return item.quantity - stockUsed(t, item.id)
}

function awardValue(t: Tournament, refs: SeriesAward['winner']): { perPlayer: number; total: number } {
  let perPlayer = 0
  let total = 0
  for (const ref of refs) {
    const item = t.stock.find(s => s.id === ref.stockItemId)
    if (!item) continue
    const v = stockItemValue(item)
    perPlayer += v
    total += v * ref.count
  }
  return { perPlayer, total }
}

export function cellTotalValue(t: Tournament, key: string): number {
  const a = t.attributions[key]
  if (!a) return 0
  return awardValue(t, a.winner).total + awardValue(t, a.finalist).total
}

export function valuePerPlayer(t: Tournament, key: string, role: 'winner' | 'finalist'): number {
  const a = t.attributions[key]
  if (!a) return 0
  return awardValue(t, a[role]).perPlayer
}

export function categoryProgress(t: Tournament, code: CategoryCode): { validated: number; total: number } {
  const cfg = t.categories[code]
  const keys = generateSeriesKeys(cfg.seriesCount)
  let validated = 0
  for (const k of keys) {
    const a = t.attributions[`${code}-${k}`]
    if (a?.status === 'validated') validated++
  }
  return { validated, total: cfg.seriesCount }
}

export function overallProgress(t: Tournament): { validated: number; total: number } {
  let validated = 0
  let total = 0
  for (const code of Object.keys(t.categories) as CategoryCode[]) {
    const p = categoryProgress(t, code)
    validated += p.validated
    total += p.total
  }
  return { validated, total }
}

export function totalRecipients(t: Tournament): number {
  let total = 0
  for (const code of Object.keys(t.categories) as CategoryCode[]) {
    const cfg = t.categories[code]
    total += cfg.seriesCount * (cfg.isDouble ? 4 : 2)
  }
  return total
}
```

- [ ] **Step 4: Run, confirm pass**

```bash
npm test
```

Expected: all derivation tests + prior tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/derivations.ts tests/lib/derivations.test.ts
git commit -m "feat(lib): pure selectors for stock, totals, progress"
```

---

### Task 10: `lib/validators.ts` — V1–V5 (TDD)

**Files:**
- Create: `lib/validators.ts`
- Test: `tests/lib/validators.test.ts`

`runValidators(t)` returns an array of `Alert { code: 'V1'|'V2'|'V3'|'V4'|'V5'; severity: 'info'|'warn'|'error'; key?: string; message: string }`.

- [ ] **Step 1: Write the failing tests**

```ts
// tests/lib/validators.test.ts
import { describe, it, expect } from 'vitest'
import { runValidators } from '@/lib/validators'
import { defaultTournament } from '@/lib/defaults'
import type { Tournament } from '@/types/tournament'

function setupT(): Tournament {
  const t = defaultTournament(2026)
  t.stock = [
    { id: 'chq150', kind: 'cheque', label: '150€', amount: 150, quantity: 4 },
    { id: 'chq100', kind: 'cheque', label: '100€', amount: 100, quantity: 2 },
  ]
  return t
}

describe('V1 — finalist > winner', () => {
  it('flags when finalist value exceeds winner', () => {
    const t = setupT()
    t.attributions = {
      'SH-ELITE': {
        winner:   [{ stockItemId: 'chq100', count: 1 }],
        finalist: [{ stockItemId: 'chq150', count: 1 }],
        status: 'draft',
      },
    }
    const alerts = runValidators(t)
    expect(alerts.some(a => a.code === 'V1' && a.key === 'SH-ELITE')).toBe(true)
  })

  it('does not flag when equal', () => {
    const t = setupT()
    t.attributions = {
      'SH-ELITE': {
        winner:   [{ stockItemId: 'chq150', count: 1 }],
        finalist: [{ stockItemId: 'chq150', count: 1 }],
        status: 'draft',
      },
    }
    const alerts = runValidators(t)
    expect(alerts.some(a => a.code === 'V1')).toBe(false)
  })
})

describe('V2 — ELITE less than a numbered series', () => {
  it('flags when ELITE per-player < S1 per-player', () => {
    const t = setupT()
    t.attributions = {
      'SH-ELITE': { winner: [{ stockItemId: 'chq100', count: 1 }], finalist: [], status: 'draft' },
      'SH-S1':    { winner: [{ stockItemId: 'chq150', count: 1 }], finalist: [], status: 'draft' },
    }
    const alerts = runValidators(t)
    expect(alerts.some(a => a.code === 'V2' && a.key === 'SH-ELITE')).toBe(true)
  })
})

describe('V4 — stock insufficient', () => {
  it('flags when used > quantity', () => {
    const t = setupT()
    // chq100 has quantity=2 but we attribute 3
    t.attributions = {
      'SH-ELITE': { winner: [{ stockItemId: 'chq100', count: 1 }], finalist: [], status: 'draft' },
      'SH-S1':    { winner: [{ stockItemId: 'chq100', count: 2 }], finalist: [], status: 'draft' },
    }
    const alerts = runValidators(t)
    expect(alerts.some(a => a.code === 'V4' && a.severity === 'error')).toBe(true)
  })
})

describe('V5 — empty series (informational)', () => {
  it('emits info for empty existing series', () => {
    const t = setupT()
    // no attributions at all → all 30 series are "empty"
    const alerts = runValidators(t)
    const infos = alerts.filter(a => a.code === 'V5' && a.severity === 'info')
    expect(infos.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run, confirm failure**

- [ ] **Step 3: Implement `lib/validators.ts`**

```ts
// lib/validators.ts
import type { Tournament, CategoryCode } from '@/types/tournament'
import { generateSeriesKeys } from '@/lib/series'
import {
  cellTotalValue,
  valuePerPlayer,
  stockRemaining,
  stockUsed,
} from '@/lib/derivations'

export type AlertCode = 'V1' | 'V2' | 'V3' | 'V4' | 'V5'
export type AlertSeverity = 'info' | 'warn' | 'error'

export interface Alert {
  code: AlertCode
  severity: AlertSeverity
  key?: string           // attribution key e.g. "SH-ELITE"
  stockItemId?: string
  message: string
}

const CODES: readonly CategoryCode[] = ['SH', 'SD', 'DH', 'DD', 'DMX']

export function runValidators(t: Tournament): Alert[] {
  const alerts: Alert[] = []

  // V1 — finalist > winner
  for (const [key, a] of Object.entries(t.attributions)) {
    const winnerTotal   = sumRoleTotal(t, a.winner)
    const finalistTotal = sumRoleTotal(t, a.finalist)
    if (winnerTotal > 0 && finalistTotal > winnerTotal) {
      alerts.push({ code: 'V1', severity: 'warn', key, message: `Le finaliste de ${key} est plus doté que le vainqueur.` })
    }
  }

  // V2 — ELITE per-player < a numbered series in the same category
  for (const code of CODES) {
    const cfg = t.categories[code]
    const keys = generateSeriesKeys(cfg.seriesCount)
    const eliteKey = `${code}-ELITE`
    const eliteVal = valuePerPlayer(t, eliteKey, 'winner')
    for (const k of keys.slice(1)) {
      const v = valuePerPlayer(t, `${code}-${k}`, 'winner')
      if (eliteVal > 0 && v > eliteVal) {
        alerts.push({ code: 'V2', severity: 'warn', key: eliteKey, message: `ELITE ${code} est moins dotée que ${k} (vainqueur).` })
        break
      }
    }
  }

  // V3 — > 30% gap between categories at same rank (per-player winner)
  const ranks = new Set<string>()
  for (const code of CODES) for (const k of generateSeriesKeys(t.categories[code].seriesCount)) ranks.add(k)
  for (const rank of ranks) {
    const values: number[] = []
    for (const code of CODES) {
      const k = `${code}-${rank}`
      if (t.attributions[k]) values.push(valuePerPlayer(t, k, 'winner'))
    }
    if (values.length >= 2) {
      const max = Math.max(...values)
      const min = Math.min(...values.filter(v => v > 0))
      if (max > 0 && (max - min) / max > 0.30) {
        alerts.push({ code: 'V3', severity: 'warn', message: `Écart > 30 % entre catégories au rang ${rank} (vainqueur).` })
      }
    }
  }

  // V4 — stock used > quantity
  for (const item of t.stock) {
    const remaining = stockRemaining(t, item)
    if (remaining < 0) {
      alerts.push({ code: 'V4', severity: 'error', stockItemId: item.id, message: `Stock insuffisant pour ${item.label} (manque ${-remaining}).` })
    }
  }

  // V5 — series exists but no attribution at all
  for (const code of CODES) {
    const cfg = t.categories[code]
    for (const k of generateSeriesKeys(cfg.seriesCount)) {
      const key = `${code}-${k}`
      const a = t.attributions[key]
      if (!a || (a.winner.length === 0 && a.finalist.length === 0)) {
        alerts.push({ code: 'V5', severity: 'info', key, message: `Série ${key} non dotée.` })
      }
    }
  }

  return alerts
}

function sumRoleTotal(t: Tournament, refs: { stockItemId: string; count: number }[]): number {
  let s = 0
  for (const ref of refs) {
    const item = t.stock.find(x => x.id === ref.stockItemId)
    if (!item) continue
    const v = item.amount ?? item.unitValue ?? 0
    s += v * ref.count
  }
  return s
}
```

- [ ] **Step 4: Run, confirm pass**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add lib/validators.ts tests/lib/validators.test.ts
git commit -m "feat(lib): validators V1–V5"
```

---

### Task 11: `lib/share-codec.ts` — JSON ↔ URL round-trip (TDD)

**Files:**
- Create: `lib/share-codec.ts`
- Test: `tests/lib/share-codec.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/lib/share-codec.test.ts
import { describe, it, expect } from 'vitest'
import { encodeSnapshot, decodeSnapshot, MAX_URL_PAYLOAD } from '@/lib/share-codec'
import { defaultTournament } from '@/lib/defaults'

describe('share-codec', () => {
  it('round-trips a default tournament', () => {
    const t = defaultTournament(2026)
    const encoded = encodeSnapshot(t)
    expect(typeof encoded).toBe('string')
    expect(encoded.length).toBeGreaterThan(0)
    const decoded = decodeSnapshot(encoded)
    expect(decoded).toEqual(t)
  })

  it('returns null on invalid input', () => {
    expect(decodeSnapshot('not-base64-lz')).toBeNull()
    expect(decodeSnapshot('')).toBeNull()
  })

  it('exposes a sane MAX_URL_PAYLOAD constant', () => {
    expect(MAX_URL_PAYLOAD).toBeGreaterThan(2000)
  })
})
```

- [ ] **Step 2: Confirm failure**

- [ ] **Step 3: Implement**

```ts
// lib/share-codec.ts
import LZString from 'lz-string'
import type { Tournament } from '@/types/tournament'

export const MAX_URL_PAYLOAD = 8000

export function encodeSnapshot(t: Tournament): string {
  const json = JSON.stringify(t)
  return LZString.compressToEncodedURIComponent(json)
}

export function decodeSnapshot(encoded: string): Tournament | null {
  if (!encoded) return null
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded)
    if (!json) return null
    const parsed = JSON.parse(json)
    if (!parsed?.meta || typeof parsed.meta.schemaVersion !== 'number') return null
    return parsed as Tournament
  } catch {
    return null
  }
}
```

- [ ] **Step 4: Run, confirm pass**

- [ ] **Step 5: Commit**

```bash
git add lib/share-codec.ts tests/lib/share-codec.test.ts
git commit -m "feat(lib): share-codec encode/decode via LZ-string"
```

---

## Phase 2 — Storage + Zustand store

### Task 12: `lib/storage.ts` — localStorage wrapper (TDD)

**Files:**
- Create: `lib/storage.ts`
- Test: `tests/lib/storage.test.ts`

Provides:
- `STORAGE_KEY = 'abil-prizes:v1'`
- `loadTournament(): Tournament | null`
- `saveTournament(t: Tournament): void` (synchronous; debouncing is the store's job)

- [ ] **Step 1: Write failing tests**

```ts
// tests/lib/storage.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { loadTournament, saveTournament, STORAGE_KEY } from '@/lib/storage'
import { defaultTournament } from '@/lib/defaults'

describe('storage', () => {
  beforeEach(() => localStorage.clear())

  it('returns null when nothing stored', () => {
    expect(loadTournament()).toBeNull()
  })

  it('saves and loads a tournament', () => {
    const t = defaultTournament(2026)
    saveTournament(t)
    const loaded = loadTournament()
    expect(loaded).toEqual(t)
  })

  it('returns null on malformed JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    expect(loadTournament()).toBeNull()
  })

  it('returns null on wrong schema version', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ meta: { schemaVersion: 99 } }))
    expect(loadTournament()).toBeNull()
  })
})
```

- [ ] **Step 2: Confirm failure**

- [ ] **Step 3: Implement**

```ts
// lib/storage.ts
import type { Tournament } from '@/types/tournament'

export const STORAGE_KEY = 'abil-prizes:v1'
const SUPPORTED_VERSION = 1

export function loadTournament(): Tournament | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.meta?.schemaVersion !== SUPPORTED_VERSION) return null
    return parsed as Tournament
  } catch {
    return null
  }
}

export function saveTournament(t: Tournament): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(t))
  } catch {
    // quota / private mode — ignore silently; the store keeps in-memory state
  }
}
```

- [ ] **Step 4: Run, confirm pass**

- [ ] **Step 5: Commit**

```bash
git add lib/storage.ts tests/lib/storage.test.ts
git commit -m "feat(lib): localStorage wrapper with schema check"
```

---

### Task 13: `lib/store.ts` — Zustand store + actions

**Files:**
- Create: `lib/store.ts`
- Test: `tests/lib/store.test.ts`

The store exposes the `Tournament` state plus pure actions. Hydration from `localStorage` happens via an explicit `hydrate()` method (called once on client mount), and an effect subscribes to debounced auto-save.

- [ ] **Step 1: Write the failing tests**

```ts
// tests/lib/store.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useStore } from '@/lib/store'
import { defaultTournament } from '@/lib/defaults'

describe('store actions', () => {
  beforeEach(() => {
    localStorage.clear()
    useStore.getState().resetToDefaults()
  })

  it('initializes with default tournament', () => {
    const t = useStore.getState().tournament
    expect(t.categories.SH.seriesCount).toBe(6)
  })

  it('setSeriesCount mutates and purges removed series', () => {
    const { setSeriesCount, setAward } = useStore.getState()
    setAward('SH', 'S5', { winner: [], finalist: [], status: 'validated' })
    setSeriesCount('SH', 3) // 3 means ELITE, S1, S2 — S5 must be purged
    const t = useStore.getState().tournament
    expect(t.categories.SH.seriesCount).toBe(3)
    expect(t.attributions['SH-S5']).toBeUndefined()
  })

  it('upsertStockItem adds and updates by id', () => {
    const { upsertStockItem } = useStore.getState()
    upsertStockItem({ id: 'a', kind: 'cheque', label: '150€', amount: 150, quantity: 4 })
    upsertStockItem({ id: 'a', kind: 'cheque', label: '150€', amount: 150, quantity: 7 })
    expect(useStore.getState().tournament.stock.length).toBe(1)
    expect(useStore.getState().tournament.stock[0].quantity).toBe(7)
  })

  it('setLocked toggles meta.locked', () => {
    useStore.getState().setLocked(true)
    expect(useStore.getState().tournament.meta.locked).toBe(true)
  })

  it('toggleDelivered sets and clears deliveredAt', () => {
    const { setAward, toggleDelivered } = useStore.getState()
    setAward('SH', 'ELITE', { winner: [], finalist: [], status: 'validated' })
    toggleDelivered('SH-ELITE')
    expect(useStore.getState().tournament.attributions['SH-ELITE'].deliveredAt).toBeDefined()
    toggleDelivered('SH-ELITE')
    expect(useStore.getState().tournament.attributions['SH-ELITE'].deliveredAt).toBeUndefined()
  })
})
```

- [ ] **Step 2: Confirm failure**

- [ ] **Step 3: Implement `lib/store.ts`**

```ts
// lib/store.ts
import { create } from 'zustand'
import type {
  Tournament, CategoryCode, StockItem, SeriesAward, LotRef, CategoryConfig,
} from '@/types/tournament'
import { defaultTournament } from '@/lib/defaults'
import { generateSeriesKeys } from '@/lib/series'
import { loadTournament, saveTournament } from '@/lib/storage'

interface StoreState {
  tournament: Tournament
  hydrated: boolean

  hydrate: () => void
  resetToDefaults: () => void
  replaceTournament: (t: Tournament) => void

  setName: (name: string) => void
  setYear: (year: number) => void
  setLocked: (locked: boolean) => void

  setSeriesCount: (code: CategoryCode, count: number) => void

  upsertStockItem: (item: StockItem) => void
  removeStockItem: (id: string) => void

  setAward: (code: CategoryCode, seriesKey: string, award: SeriesAward) => void
  setLot: (key: string, role: 'winner' | 'finalist', refs: LotRef[]) => void
  setAwardStatus: (key: string, status: SeriesAward['status']) => void
  toggleDelivered: (key: string) => void
  duplicateAward: (sourceKey: string, targetKeys: string[]) => void
  clearAward: (key: string) => void
}

let saveTimer: ReturnType<typeof setTimeout> | null = null
function scheduleSave(t: Tournament) {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => saveTournament({ ...t, meta: { ...t.meta, savedAt: new Date().toISOString() } }), 500)
}

function withSave(t: Tournament): Tournament {
  scheduleSave(t)
  return t
}

export const useStore = create<StoreState>((set, get) => ({
  tournament: defaultTournament(),
  hydrated: false,

  hydrate: () => {
    const loaded = loadTournament()
    set({ tournament: loaded ?? defaultTournament(), hydrated: true })
  },

  resetToDefaults: () => set({ tournament: defaultTournament() }),

  replaceTournament: (t) => set({ tournament: withSave(t) }),

  setName: (name) =>
    set(s => ({ tournament: withSave({ ...s.tournament, meta: { ...s.tournament.meta, name } }) })),

  setYear: (year) =>
    set(s => ({ tournament: withSave({ ...s.tournament, meta: { ...s.tournament.meta, year } }) })),

  setLocked: (locked) =>
    set(s => ({ tournament: withSave({ ...s.tournament, meta: { ...s.tournament.meta, locked } }) })),

  setSeriesCount: (code, count) =>
    set(s => {
      const cfg: CategoryConfig = { ...s.tournament.categories[code], seriesCount: count }
      const keys = new Set(generateSeriesKeys(count))
      const attributions = { ...s.tournament.attributions }
      for (const k of Object.keys(attributions)) {
        const [c, sk] = k.split('-')
        if (c === code && !keys.has(sk)) delete attributions[k]
      }
      return { tournament: withSave({ ...s.tournament, categories: { ...s.tournament.categories, [code]: cfg }, attributions }) }
    }),

  upsertStockItem: (item) =>
    set(s => {
      const idx = s.tournament.stock.findIndex(x => x.id === item.id)
      const stock = idx >= 0
        ? s.tournament.stock.map((x, i) => i === idx ? item : x)
        : [...s.tournament.stock, item]
      return { tournament: withSave({ ...s.tournament, stock }) }
    }),

  removeStockItem: (id) =>
    set(s => ({ tournament: withSave({ ...s.tournament, stock: s.tournament.stock.filter(x => x.id !== id) }) })),

  setAward: (code, seriesKey, award) =>
    set(s => ({ tournament: withSave({ ...s.tournament, attributions: { ...s.tournament.attributions, [`${code}-${seriesKey}`]: award } }) })),

  setLot: (key, role, refs) =>
    set(s => {
      const prev = s.tournament.attributions[key] ?? { winner: [], finalist: [], status: 'draft' as const }
      const next: SeriesAward = { ...prev, [role]: refs, status: prev.status === 'empty' ? 'draft' : prev.status }
      return { tournament: withSave({ ...s.tournament, attributions: { ...s.tournament.attributions, [key]: next } }) }
    }),

  setAwardStatus: (key, status) =>
    set(s => {
      const prev = s.tournament.attributions[key]
      if (!prev) return s
      const next: SeriesAward = { ...prev, status }
      return { tournament: withSave({ ...s.tournament, attributions: { ...s.tournament.attributions, [key]: next } }) }
    }),

  toggleDelivered: (key) =>
    set(s => {
      const prev = s.tournament.attributions[key]
      if (!prev) return s
      const next: SeriesAward = { ...prev, deliveredAt: prev.deliveredAt ? undefined : new Date().toISOString() }
      return { tournament: withSave({ ...s.tournament, attributions: { ...s.tournament.attributions, [key]: next } }) }
    }),

  duplicateAward: (sourceKey, targetKeys) =>
    set(s => {
      const src = s.tournament.attributions[sourceKey]
      if (!src) return s
      const attributions = { ...s.tournament.attributions }
      for (const k of targetKeys) {
        attributions[k] = { winner: [...src.winner], finalist: [...src.finalist], status: 'draft' }
      }
      return { tournament: withSave({ ...s.tournament, attributions }) }
    }),

  clearAward: (key) =>
    set(s => {
      const attributions = { ...s.tournament.attributions }
      delete attributions[key]
      return { tournament: withSave({ ...s.tournament, attributions }) }
    }),
}))
```

- [ ] **Step 4: Run, confirm pass**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add lib/store.ts tests/lib/store.test.ts
git commit -m "feat(lib): Zustand store with actions + debounced auto-save"
```

---

## Phase 3 — Layout and shared UI

### Task 14: AppShell + Bottom/SideNav + LockToggle + Autosave indicator

**Files:**
- Create: `components/layout/AppShell.tsx`, `components/layout/BottomNav.tsx`, `components/layout/SideNav.tsx`, `components/layout/LockToggle.tsx`, `components/layout/AutosaveIndicator.tsx`, `hooks/useHydrated.ts`

- [ ] **Step 1: Create the hydration hook**

```tsx
// hooks/useHydrated.ts
'use client'
import { useEffect } from 'react'
import { useStore } from '@/lib/store'

export function useHydrated(): boolean {
  const hydrated = useStore(s => s.hydrated)
  const hydrate  = useStore(s => s.hydrate)
  useEffect(() => { if (!hydrated) hydrate() }, [hydrated, hydrate])
  return hydrated
}
```

- [ ] **Step 2: Create `LockToggle.tsx`**

```tsx
// components/layout/LockToggle.tsx
'use client'
import { Switch } from '@/components/ui/switch'
import { Lock, LockOpen } from 'lucide-react'
import { useStore } from '@/lib/store'

export function LockToggle() {
  const locked = useStore(s => s.tournament.meta.locked)
  const setLocked = useStore(s => s.setLocked)
  return (
    <label className="flex items-center gap-2 text-sm font-medium select-none">
      {locked ? <Lock className="size-4" /> : <LockOpen className="size-4" />}
      <span className="hidden sm:inline">Verrouiller</span>
      <Switch checked={locked} onCheckedChange={setLocked} aria-label="Verrouiller le tournoi" />
    </label>
  )
}
```

- [ ] **Step 3: Create `AutosaveIndicator.tsx`**

```tsx
// components/layout/AutosaveIndicator.tsx
'use client'
import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'

export function AutosaveIndicator() {
  const savedAt = useStore(s => s.tournament.meta.savedAt)
  const [flash, setFlash] = useState(false)
  useEffect(() => {
    setFlash(true)
    const t = setTimeout(() => setFlash(false), 800)
    return () => clearTimeout(t)
  }, [savedAt])
  return (
    <span
      role="status"
      className={`text-xs text-muted-foreground transition-opacity duration-500 ${flash ? 'opacity-100' : 'opacity-40'}`}
    >
      💾 Sauvegardé
    </span>
  )
}
```

- [ ] **Step 4: Create `BottomNav.tsx` and `SideNav.tsx`**

```tsx
// components/layout/BottomNav.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, Settings, Grid3x3, Trophy } from 'lucide-react'

const ITEMS = [
  { href: '/',            label: 'Dashboard',   Icon: LayoutDashboard },
  { href: '/stock/',      label: 'Stock',       Icon: Package },
  { href: '/config/',     label: 'Config',      Icon: Settings },
  { href: '/repartition/',label: 'Répartition', Icon: Grid3x3 },
  { href: '/ceremonie/',  label: 'Cérémonie',   Icon: Trophy },
]

export function BottomNav() {
  const path = usePathname()
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-card border-t z-40 no-print">
      <ul className="grid grid-cols-5">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = path === href
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center justify-center py-2 text-xs ${active ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <Icon className="size-5 mb-1" aria-hidden />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
```

```tsx
// components/layout/SideNav.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, Settings, Grid3x3, Trophy, ListChecks } from 'lucide-react'

const ITEMS = [
  { href: '/',             label: 'Dashboard',   Icon: LayoutDashboard },
  { href: '/stock/',       label: 'Stock',       Icon: Package },
  { href: '/config/',      label: 'Config',      Icon: Settings },
  { href: '/repartition/', label: 'Répartition', Icon: Grid3x3 },
  { href: '/preparation/', label: 'Préparation', Icon: ListChecks },
  { href: '/ceremonie/',   label: 'Cérémonie',   Icon: Trophy },
]

export function SideNav() {
  const path = usePathname()
  return (
    <aside className="hidden md:flex md:w-56 shrink-0 flex-col gap-1 p-4 border-r bg-card no-print">
      <h1 className="font-display text-2xl mb-4 leading-none">ABIL <span className="text-primary">Prizes</span></h1>
      {ITEMS.map(({ href, label, Icon }) => {
        const active = path === href
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors
              ${active ? 'bg-primary text-primary-foreground' : 'hover:bg-accent hover:text-accent-foreground'}`}
          >
            <Icon className="size-4" aria-hidden /> {label}
          </Link>
        )
      })}
    </aside>
  )
}
```

- [ ] **Step 5: Create `AppShell.tsx`**

```tsx
// components/layout/AppShell.tsx
'use client'
import { useHydrated } from '@/hooks/useHydrated'
import { SideNav } from './SideNav'
import { BottomNav } from './BottomNav'
import { LockToggle } from './LockToggle'
import { AutosaveIndicator } from './AutosaveIndicator'

export function AppShell({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated()
  return (
    <div className="flex flex-1 min-h-screen">
      <SideNav />
      <div className="flex flex-col flex-1 min-w-0">
        <header className="flex items-center justify-between px-4 py-3 border-b bg-card no-print">
          <div className="md:hidden font-display text-lg leading-none">ABIL <span className="text-primary">Prizes</span></div>
          <div className="flex items-center gap-4">
            <AutosaveIndicator />
            <LockToggle />
          </div>
        </header>
        <main className="flex-1 p-4 pb-24 md:pb-4">
          {hydrated ? children : <div className="p-8 text-muted-foreground">Chargement…</div>}
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Wire AppShell into the root layout**

Modify `app/layout.tsx` body section to wrap children:

```tsx
<body className="min-h-full flex flex-col">
  <AppShell>{children}</AppShell>
  <Toaster richColors position="top-center" />
</body>
```

Add the import:
```tsx
import { AppShell } from '@/components/layout/AppShell'
```

- [ ] **Step 7: Replace home page with placeholder**

```tsx
// app/page.tsx
export default function Page() {
  return (
    <div className="space-y-4">
      <h1>Dashboard</h1>
      <p className="text-muted-foreground">À venir.</p>
    </div>
  )
}
```

- [ ] **Step 8: Build and run dev to verify**

```bash
npm run build
npm run dev
```

Open `http://localhost:3000/`. Expected: ABIL palette visible, side nav on desktop, bottom nav on mobile, lock toggle and autosave indicator in header.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(layout): AppShell, SideNav, BottomNav, LockToggle, autosave indicator"
```

---

### Task 15: Shared UI primitives (LotBadge, ColorChip, ValueChip, StatusBadge, ConfirmDialog)

**Files:**
- Create: `components/shared/LotBadge.tsx`, `components/shared/ColorChip.tsx`, `components/shared/ValueChip.tsx`, `components/shared/StatusBadge.tsx`, `components/shared/ConfirmDialog.tsx`, `lib/lot-colors.ts`

- [ ] **Step 1: Create `lib/lot-colors.ts`**

```ts
// lib/lot-colors.ts
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
```

- [ ] **Step 2: Create `ColorChip.tsx`**

```tsx
// components/shared/ColorChip.tsx
import type { StockItemKind } from '@/types/tournament'
import { LOT_COLOR_TOKEN } from '@/lib/lot-colors'

export function ColorChip({ kind, size = 'sm', className = '' }: { kind: StockItemKind; size?: 'sm' | 'md'; className?: string }) {
  const sz = size === 'md' ? 'size-4' : 'size-3'
  const borderClass = kind === 'volants' ? 'border border-foreground/40' : ''
  return (
    <span
      className={`inline-block rounded-sm ${sz} ${borderClass} ${className}`}
      style={{ backgroundColor: `var(--${LOT_COLOR_TOKEN[kind]})` }}
      aria-hidden
    />
  )
}
```

- [ ] **Step 3: Create `LotBadge.tsx`**

```tsx
// components/shared/LotBadge.tsx
import type { StockItem } from '@/types/tournament'
import { ColorChip } from './ColorChip'
import { LOT_LABEL } from '@/lib/lot-colors'

export function LotBadge({ item, count = 1 }: { item: StockItem; count?: number }) {
  const value = item.amount ?? item.unitValue ?? 0
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted text-sm" aria-label={`${LOT_LABEL[item.kind]} ${item.label}, valeur ${value} euros, quantité ${count}`}>
      <ColorChip kind={item.kind} />
      <span className="font-medium">{item.label}</span>
      {count > 1 && <span className="text-muted-foreground text-xs">×{count}</span>}
    </span>
  )
}
```

- [ ] **Step 4: Create `ValueChip.tsx`**

```tsx
// components/shared/ValueChip.tsx
export function ValueChip({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium text-xs tabular-nums">
      {value.toLocaleString('fr-FR')} €
    </span>
  )
}
```

- [ ] **Step 5: Create `StatusBadge.tsx`**

```tsx
// components/shared/StatusBadge.tsx
import type { AwardStatus } from '@/types/tournament'
import { CircleDashed, CircleEllipsis, CircleCheck } from 'lucide-react'

const META: Record<AwardStatus, { label: string; classes: string; Icon: typeof CircleDashed }> = {
  empty:     { label: 'Vide',     classes: 'text-muted-foreground bg-muted',  Icon: CircleDashed },
  draft:     { label: 'En cours', classes: 'text-secondary-foreground bg-secondary', Icon: CircleEllipsis },
  validated: { label: 'Validé',   classes: 'text-emerald-700 bg-emerald-100', Icon: CircleCheck },
}

export function StatusBadge({ status }: { status: AwardStatus }) {
  const { label, classes, Icon } = META[status]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${classes}`} aria-label={`Statut : ${label}`}>
      <Icon className="size-3" aria-hidden /> {label}
    </span>
  )
}
```

- [ ] **Step 6: Create `ConfirmDialog.tsx`**

```tsx
// components/shared/ConfirmDialog.tsx
'use client'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  requireText?: string                // si défini, l'utilisateur doit le retaper
  variant?: 'default' | 'destructive'
  onConfirm: () => void
}

export function ConfirmDialog({
  open, onOpenChange, title, description, confirmLabel = 'Confirmer', cancelLabel = 'Annuler',
  requireText, variant = 'default', onConfirm,
}: Props) {
  const [typed, setTyped] = useState('')
  const canConfirm = !requireText || typed === requireText
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setTyped(''); onOpenChange(o) }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {requireText && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Tape <code className="px-1 rounded bg-muted">{requireText}</code> pour confirmer :</p>
            <Input value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{cancelLabel}</Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            disabled={!canConfirm}
            onClick={() => { onConfirm(); setTyped(''); onOpenChange(false) }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 7: Build and commit**

```bash
npm run build
git add -A
git commit -m "feat(shared): LotBadge, ColorChip, ValueChip, StatusBadge, ConfirmDialog"
```

---

## Phase 4 — Screens

### Task 16: `/config` page — categories and series count

**Files:**
- Create: `app/config/page.tsx`, `components/config/CategoryConfigRow.tsx`, `components/config/SeriesCountStepper.tsx`

- [ ] **Step 1: Create `SeriesCountStepper.tsx`**

```tsx
// components/config/SeriesCountStepper.tsx
'use client'
import { Button } from '@/components/ui/button'
import { Minus, Plus } from 'lucide-react'

export function SeriesCountStepper({ value, onChange, min = 1, max = 10, disabled }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; disabled?: boolean
}) {
  return (
    <div className="inline-flex items-center gap-2">
      <Button size="icon" variant="outline" onClick={() => onChange(Math.max(min, value - 1))} disabled={disabled || value <= min} aria-label="Diminuer le nombre de tableaux"><Minus className="size-4" /></Button>
      <span className="w-8 text-center tabular-nums font-medium">{value}</span>
      <Button size="icon" variant="outline" onClick={() => onChange(Math.min(max, value + 1))} disabled={disabled || value >= max} aria-label="Augmenter le nombre de tableaux"><Plus className="size-4" /></Button>
    </div>
  )
}
```

- [ ] **Step 2: Create `CategoryConfigRow.tsx`**

```tsx
// components/config/CategoryConfigRow.tsx
'use client'
import { useState } from 'react'
import type { CategoryConfig, CategoryCode } from '@/types/tournament'
import { useStore } from '@/lib/store'
import { SeriesCountStepper } from './SeriesCountStepper'
import { generateSeriesKeys } from '@/lib/series'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'

export function CategoryConfigRow({ cfg }: { cfg: CategoryConfig }) {
  const setSeriesCount = useStore(s => s.setSeriesCount)
  const locked = useStore(s => s.tournament.meta.locked)
  const attributions = useStore(s => s.tournament.attributions)
  const [pending, setPending] = useState<number | null>(null)

  const requestChange = (next: number) => {
    if (next >= cfg.seriesCount) { setSeriesCount(cfg.code, next); return }
    // shrinking: warn if any removed series has data
    const keptKeys = new Set(generateSeriesKeys(next))
    const lostKeys = generateSeriesKeys(cfg.seriesCount).filter(k => !keptKeys.has(k))
    const willLose = lostKeys.some(k => attributions[`${cfg.code}-${k}`])
    if (willLose) setPending(next)
    else setSeriesCount(cfg.code, next)
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4 p-4 rounded-lg border bg-card">
        <div>
          <div className="font-medium">{cfg.label}</div>
          <div className="text-xs text-muted-foreground">{cfg.isDouble ? 'Double' : 'Simple'} · ELITE + {cfg.seriesCount - 1} séries</div>
        </div>
        <SeriesCountStepper value={cfg.seriesCount} onChange={requestChange} disabled={locked} />
      </div>
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(o) => !o && setPending(null)}
        title="Supprimer des séries existantes ?"
        description="Certaines séries qui seront retirées contiennent déjà des attributions. Elles seront perdues."
        variant="destructive"
        confirmLabel="Supprimer"
        onConfirm={() => { if (pending !== null) setSeriesCount(cfg.code, pending) }}
      />
    </>
  )
}
```

- [ ] **Step 3: Create `app/config/page.tsx`**

```tsx
// app/config/page.tsx
'use client'
import { useStore } from '@/lib/store'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CategoryConfigRow } from '@/components/config/CategoryConfigRow'
import { totalRecipients, overallProgress } from '@/lib/derivations'
import type { CategoryCode } from '@/types/tournament'

const ORDER: CategoryCode[] = ['SH', 'SD', 'DH', 'DD', 'DMX']

export default function Page() {
  const t = useStore(s => s.tournament)
  const setName = useStore(s => s.setName)
  const setYear = useStore(s => s.setYear)
  const locked  = t.meta.locked

  const progress = overallProgress(t)
  const recipients = totalRecipients(t)

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1>Configuration du tournoi</h1>
        <p className="text-muted-foreground">Définis le nom, l'année et le nombre de séries par catégorie.</p>
      </header>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nom du tournoi</Label>
          <Input id="name" value={t.meta.name} disabled={locked} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="year">Année</Label>
          <Input id="year" type="number" value={t.meta.year} disabled={locked} onChange={e => setYear(Number(e.target.value) || t.meta.year)} />
        </div>
      </div>

      <section className="space-y-2">
        <h2>Catégories</h2>
        <div className="grid gap-2">
          {ORDER.map(code => <CategoryConfigRow key={code} cfg={t.categories[code]} />)}
        </div>
      </section>

      <section className="grid sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border bg-card"><div className="text-xs text-muted-foreground">Séries totales</div><div className="text-2xl font-display">{progress.total}</div></div>
        <div className="p-4 rounded-lg border bg-card"><div className="text-xs text-muted-foreground">Personnes à récompenser</div><div className="text-2xl font-display">{recipients}</div></div>
        <div className="p-4 rounded-lg border bg-card"><div className="text-xs text-muted-foreground">Catégories</div><div className="text-2xl font-display">5</div></div>
      </section>
    </div>
  )
}
```

- [ ] **Step 4: Verify in dev**

```bash
npm run dev
```

Open `/config/`. Verify steppers, default values, that lock disables fields, and that shrinking with attributions opens a confirm dialog (you can't actually trigger it yet but the path is wired).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(config): /config page with category steppers"
```

---

### Task 17: `/stock` page — stock entry with denominations

**Files:**
- Create: `app/stock/page.tsx`, `components/stock/StockSection.tsx`, `components/stock/DenominationRow.tsx`, `components/stock/LotRow.tsx`

- [ ] **Step 1: Create `DenominationRow.tsx` (for cheque / bon)**

```tsx
// components/stock/DenominationRow.tsx
'use client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import type { StockItem } from '@/types/tournament'
import { useStore } from '@/lib/store'
import { stockRemaining, stockUsed } from '@/lib/derivations'
import { ColorChip } from '@/components/shared/ColorChip'

export function DenominationRow({ item }: { item: StockItem }) {
  const upsert = useStore(s => s.upsertStockItem)
  const remove = useStore(s => s.removeStockItem)
  const t      = useStore(s => s.tournament)
  const locked = t.meta.locked
  const used = stockUsed(t, item.id)
  const remaining = stockRemaining(t, item)
  const insufficient = remaining < 0

  return (
    <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] sm:grid-cols-[auto_1.5fr_1fr_1fr_1fr_auto] items-center gap-2 p-2 rounded-md border bg-card">
      <ColorChip kind={item.kind} size="md" />
      <Input
        value={item.label}
        disabled={locked}
        onChange={e => upsert({ ...item, label: e.target.value })}
        aria-label="Libellé"
      />
      <Input
        type="number" min={0} step={1} inputMode="numeric"
        value={item.amount ?? ''} disabled={locked}
        onChange={e => upsert({ ...item, amount: Number(e.target.value) || 0 })}
        aria-label="Montant en euros"
        placeholder="€"
      />
      <Input
        type="number" min={0} step={1} inputMode="numeric"
        value={item.quantity} disabled={locked}
        onChange={e => upsert({ ...item, quantity: Number(e.target.value) || 0 })}
        aria-label="Quantité"
        placeholder="Qté"
      />
      <div className={`text-sm tabular-nums ${insufficient ? 'text-destructive font-medium' : 'text-muted-foreground'}`} aria-label={`Reste ${remaining}`}>
        {used} / {item.quantity}
      </div>
      <Button size="icon" variant="ghost" onClick={() => remove(item.id)} disabled={locked} aria-label="Supprimer cette ligne"><Trash2 className="size-4" /></Button>
    </div>
  )
}
```

- [ ] **Step 2: Create `LotRow.tsx` (for biere / volants / hybride / accessoire)**

```tsx
// components/stock/LotRow.tsx
'use client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import type { StockItem } from '@/types/tournament'
import { useStore } from '@/lib/store'
import { stockRemaining, stockUsed } from '@/lib/derivations'
import { ColorChip } from '@/components/shared/ColorChip'

export function LotRow({ item }: { item: StockItem }) {
  const upsert = useStore(s => s.upsertStockItem)
  const remove = useStore(s => s.removeStockItem)
  const t      = useStore(s => s.tournament)
  const locked = t.meta.locked
  const used = stockUsed(t, item.id)
  const remaining = stockRemaining(t, item)
  const insufficient = remaining < 0

  return (
    <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] sm:grid-cols-[auto_2fr_1fr_1fr_1fr_auto] items-center gap-2 p-2 rounded-md border bg-card">
      <ColorChip kind={item.kind} size="md" />
      <Input value={item.label} disabled={locked} onChange={e => upsert({ ...item, label: e.target.value })} aria-label="Libellé" />
      <Input type="number" min={0} step={0.01} inputMode="decimal" value={item.unitValue ?? ''} disabled={locked} onChange={e => upsert({ ...item, unitValue: Number(e.target.value) || 0 })} aria-label="Valeur unitaire" placeholder="€/u" />
      <Input type="number" min={0} step={1} inputMode="numeric" value={item.quantity} disabled={locked} onChange={e => upsert({ ...item, quantity: Number(e.target.value) || 0 })} aria-label="Quantité" placeholder="Qté" />
      <div className={`text-sm tabular-nums ${insufficient ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>{used} / {item.quantity}</div>
      <Button size="icon" variant="ghost" onClick={() => remove(item.id)} disabled={locked} aria-label="Supprimer"><Trash2 className="size-4" /></Button>
    </div>
  )
}
```

- [ ] **Step 3: Create `StockSection.tsx`**

```tsx
// components/stock/StockSection.tsx
'use client'
import { useStore } from '@/lib/store'
import type { StockItemKind, StockItem } from '@/types/tournament'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { LOT_LABEL } from '@/lib/lot-colors'
import { ColorChip } from '@/components/shared/ColorChip'
import { DenominationRow } from './DenominationRow'
import { LotRow } from './LotRow'

const DENOM_KINDS: StockItemKind[] = ['cheque', 'bon']

function uid(): string { return Math.random().toString(36).slice(2, 10) }

export function StockSection({ kind }: { kind: StockItemKind }) {
  const stock = useStore(s => s.tournament.stock).filter(x => x.kind === kind)
  const upsert = useStore(s => s.upsertStockItem)
  const locked = useStore(s => s.tournament.meta.locked)
  const isDenom = DENOM_KINDS.includes(kind)

  const add = () => {
    const base: StockItem = isDenom
      ? { id: uid(), kind, label: kind === 'cheque' ? 'Chèque' : "Bon d'achat", amount: 0, quantity: 0 }
      : { id: uid(), kind, label: '', unitValue: 0, quantity: 0 }
    upsert(base)
  }

  const total = stock.reduce((sum, x) => sum + ((x.amount ?? x.unitValue ?? 0) * x.quantity), 0)

  return (
    <section className="space-y-3">
      <header className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="flex items-center gap-2"><ColorChip kind={kind} size="md" /> {LOT_LABEL[kind]}</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground tabular-nums">Total : {total.toLocaleString('fr-FR')} €</span>
          <Button size="sm" onClick={add} disabled={locked}><Plus className="size-4 mr-1" /> Ajouter</Button>
        </div>
      </header>
      <div className="space-y-2">
        {stock.length === 0 && <p className="text-sm text-muted-foreground">Aucune entrée. Clique sur Ajouter pour commencer.</p>}
        {stock.map(item => isDenom ? <DenominationRow key={item.id} item={item} /> : <LotRow key={item.id} item={item} />)}
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Create `app/stock/page.tsx`**

```tsx
// app/stock/page.tsx
'use client'
import { StockSection } from '@/components/stock/StockSection'
import type { StockItemKind } from '@/types/tournament'

const KINDS: StockItemKind[] = ['cheque', 'bon', 'biere', 'volants', 'hybride', 'accessoire']

export default function Page() {
  return (
    <div className="space-y-8 max-w-4xl">
      <header>
        <h1>Stock</h1>
        <p className="text-muted-foreground">Saisis les lots disponibles. Le stock se décrémente à mesure que tu attribues.</p>
      </header>
      {KINDS.map(k => <StockSection key={k} kind={k} />)}
    </div>
  )
}
```

- [ ] **Step 5: Verify in dev, commit**

```bash
npm run dev
```

Open `/stock/`, add a few items in each section, verify that `used / quantity` updates as you type and that lock disables inputs.

```bash
git add -A
git commit -m "feat(stock): /stock page with denominations and lots"
```

---

### Task 18: `/repartition` grid + cell preview

**Files:**
- Create: `app/repartition/page.tsx`, `components/repartition/RepartitionGrid.tsx`, `components/repartition/CellPreview.tsx`

- [ ] **Step 1: Create `CellPreview.tsx`**

```tsx
// components/repartition/CellPreview.tsx
'use client'
import type { CategoryCode } from '@/types/tournament'
import { useStore } from '@/lib/store'
import { cellTotalValue } from '@/lib/derivations'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ColorChip } from '@/components/shared/ColorChip'

export function CellPreview({ code, sKey, onOpen }: { code: CategoryCode; sKey: string; onOpen: () => void }) {
  const t = useStore(s => s.tournament)
  const key = `${code}-${sKey}`
  const award = t.attributions[key]
  const status = award?.status ?? 'empty'
  const total = cellTotalValue(t, key)

  const kinds = new Set<string>()
  for (const r of [...(award?.winner ?? []), ...(award?.finalist ?? [])]) {
    const it = t.stock.find(x => x.id === r.stockItemId)
    if (it) kinds.add(it.kind)
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full min-h-[88px] p-2 rounded-md border bg-card hover:border-primary text-left flex flex-col gap-1 transition-colors"
      aria-label={`Modifier ${code} ${sKey}`}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{sKey}</span>
        <StatusBadge status={status} />
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        {[...kinds].map(k => <ColorChip key={k} kind={k as any} />)}
      </div>
      <div className="text-xs text-muted-foreground tabular-nums mt-auto">{total > 0 ? `${total.toLocaleString('fr-FR')} €` : '—'}</div>
    </button>
  )
}
```

- [ ] **Step 2: Create `RepartitionGrid.tsx`**

```tsx
// components/repartition/RepartitionGrid.tsx
'use client'
import { useState } from 'react'
import type { CategoryCode } from '@/types/tournament'
import { useStore } from '@/lib/store'
import { generateSeriesKeys } from '@/lib/series'
import { CellPreview } from './CellPreview'
import { AwardEditorPanel } from './AwardEditorPanel'

const ORDER: CategoryCode[] = ['SH', 'SD', 'DH', 'DD', 'DMX']

export function RepartitionGrid() {
  const categories = useStore(s => s.tournament.categories)
  const maxSeries = Math.max(...ORDER.map(c => categories[c].seriesCount))
  const headerKeys = generateSeriesKeys(maxSeries)
  const [editing, setEditing] = useState<{ code: CategoryCode; sKey: string } | null>(null)

  return (
    <>
      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full border-separate border-spacing-2 min-w-[640px]">
          <thead>
            <tr>
              <th className="sticky left-0 bg-background z-10 text-left text-xs uppercase tracking-wider text-muted-foreground">Catégorie</th>
              {headerKeys.map(k => <th key={k} className="text-xs uppercase tracking-wider text-muted-foreground">{k}</th>)}
            </tr>
          </thead>
          <tbody>
            {ORDER.map(code => {
              const cfg = categories[code]
              const keys = generateSeriesKeys(cfg.seriesCount)
              return (
                <tr key={code}>
                  <th className="sticky left-0 bg-background z-10 text-left align-middle font-medium pr-2">
                    {cfg.label}<br/>
                    <span className="text-xs text-muted-foreground">{cfg.isDouble ? 'Double' : 'Simple'}</span>
                  </th>
                  {headerKeys.map(k => (
                    <td key={k} className="align-top">
                      {keys.includes(k)
                        ? <CellPreview code={code} sKey={k} onOpen={() => setEditing({ code, sKey: k })} />
                        : <div className="min-h-[88px] rounded-md border border-dashed opacity-40" aria-hidden />}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <AwardEditorPanel
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
        code={editing?.code}
        sKey={editing?.sKey}
      />
    </>
  )
}
```

- [ ] **Step 3: Create `app/repartition/page.tsx` (placeholder editor for now)**

```tsx
// app/repartition/page.tsx
'use client'
import { RepartitionGrid } from '@/components/repartition/RepartitionGrid'

export default function Page() {
  return (
    <div className="space-y-4">
      <header>
        <h1>Répartition</h1>
        <p className="text-muted-foreground">Clique sur une cellule pour attribuer les lots.</p>
      </header>
      <RepartitionGrid />
    </div>
  )
}
```

- [ ] **Step 4: Create a stub `AwardEditorPanel.tsx` so the import resolves**

```tsx
// components/repartition/AwardEditorPanel.tsx
'use client'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { CategoryCode } from '@/types/tournament'

export function AwardEditorPanel({ open, onOpenChange, code, sKey }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  code?: CategoryCode
  sKey?: string
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{code && sKey ? `${code} · ${sKey}` : ''}</SheetTitle>
        </SheetHeader>
        <p className="p-4 text-sm text-muted-foreground">Éditeur en construction (Task 19).</p>
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 5: Verify grid renders, commit**

```bash
npm run dev
```

Open `/repartition/`. Expected: grid renders, cells clickable, side sheet opens with the placeholder.

```bash
git add -A
git commit -m "feat(repartition): grid + cell preview + editor stub"
```

---

### Task 19: AwardEditorPanel — full editor with LotPicker + DuplicateMenu

**Files:**
- Modify: `components/repartition/AwardEditorPanel.tsx`
- Create: `components/repartition/LotPicker.tsx`, `components/repartition/DuplicateMenu.tsx`

- [ ] **Step 1: Create `LotPicker.tsx`**

```tsx
// components/repartition/LotPicker.tsx
'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import type { LotRef } from '@/types/tournament'
import { LotBadge } from '@/components/shared/LotBadge'
import { Button } from '@/components/ui/button'
import { Plus, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { stockRemaining } from '@/lib/derivations'

interface Props {
  refs: LotRef[]
  countMultiplier: number      // 1 for simple, 2 for double
  readOnly?: boolean
  onChange: (refs: LotRef[]) => void
}

export function LotPicker({ refs, countMultiplier, readOnly, onChange }: Props) {
  const t = useStore(s => s.tournament)
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const filtered = t.stock.filter(s => s.label.toLowerCase().includes(filter.toLowerCase()))

  const add = (id: string) => {
    onChange([...refs, { stockItemId: id, count: countMultiplier }])
    setOpen(false)
  }
  const remove = (idx: number) => onChange(refs.filter((_, i) => i !== idx))

  return (
    <div className="space-y-2">
      <ul className="flex flex-wrap gap-2">
        {refs.map((ref, idx) => {
          const item = t.stock.find(x => x.id === ref.stockItemId)
          if (!item) return null
          return (
            <li key={idx} className="flex items-center gap-1">
              <LotBadge item={item} count={ref.count} />
              {!readOnly && (
                <button type="button" onClick={() => remove(idx)} aria-label="Retirer ce lot" className="text-muted-foreground hover:text-destructive">
                  <X className="size-4" />
                </button>
              )}
            </li>
          )
        })}
      </ul>
      {!readOnly && (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-4 mr-1" /> Ajouter un lot
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Choisir un lot</DialogTitle></DialogHeader>
          <Input placeholder="Filtrer…" value={filter} onChange={(e) => setFilter(e.target.value)} />
          <ul className="max-h-80 overflow-y-auto divide-y">
            {filtered.length === 0 && <li className="p-3 text-sm text-muted-foreground">Aucun lot en stock. Ajoute-en dans la page Stock.</li>}
            {filtered.map(item => {
              const remaining = stockRemaining(t, item)
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className="w-full text-left p-3 hover:bg-accent flex items-center justify-between"
                    onClick={() => add(item.id)}
                    aria-label={`Ajouter ${item.label}`}
                  >
                    <LotBadge item={item} />
                    <span className={`text-xs tabular-nums ${remaining < countMultiplier ? 'text-destructive' : 'text-muted-foreground'}`}>
                      reste {remaining}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

- [ ] **Step 2: Create `DuplicateMenu.tsx`**

```tsx
// components/repartition/DuplicateMenu.tsx
'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { generateSeriesKeys } from '@/lib/series'
import type { CategoryCode } from '@/types/tournament'

const ORDER: CategoryCode[] = ['SH', 'SD', 'DH', 'DD', 'DMX']

export function DuplicateMenu({ open, onOpenChange, sourceKey }: { open: boolean; onOpenChange: (o: boolean) => void; sourceKey: string }) {
  const t = useStore(s => s.tournament)
  const duplicate = useStore(s => s.duplicateAward)
  const [selected, setSelected] = useState<Record<string, boolean>>({})

  const allKeys: string[] = []
  for (const code of ORDER) {
    const cfg = t.categories[code]
    for (const k of generateSeriesKeys(cfg.seriesCount)) {
      const key = `${code}-${k}`
      if (key !== sourceKey) allKeys.push(key)
    }
  }

  const toggle = (k: string) => setSelected(s => ({ ...s, [k]: !s[k] }))
  const apply = () => {
    const targets = Object.keys(selected).filter(k => selected[k])
    if (targets.length) duplicate(sourceKey, targets)
    setSelected({})
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Dupliquer {sourceKey} vers…</DialogTitle></DialogHeader>
        <div className="max-h-80 overflow-y-auto grid grid-cols-2 gap-2 pr-2">
          {allKeys.map(k => (
            <Label key={k} className="flex items-center gap-2 px-2 py-1 rounded border hover:bg-accent cursor-pointer">
              <Checkbox checked={!!selected[k]} onCheckedChange={() => toggle(k)} />
              <span className="text-sm">{k}</span>
            </Label>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={apply}>Dupliquer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 3: Replace `AwardEditorPanel.tsx` with the full editor**

```tsx
// components/repartition/AwardEditorPanel.tsx
'use client'
import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useStore } from '@/lib/store'
import type { CategoryCode, LotRef, SeriesAward } from '@/types/tournament'
import { LotPicker } from './LotPicker'
import { DuplicateMenu } from './DuplicateMenu'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Trophy, Medal, CheckCircle2, Copy, Trash2 } from 'lucide-react'
import { cellTotalValue, valuePerPlayer } from '@/lib/derivations'

export function AwardEditorPanel({ open, onOpenChange, code, sKey }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  code?: CategoryCode
  sKey?: string
}) {
  const t = useStore(s => s.tournament)
  const setLot = useStore(s => s.setLot)
  const setAwardStatus = useStore(s => s.setAwardStatus)
  const clearAward = useStore(s => s.clearAward)
  const locked = t.meta.locked

  const [showDuplicate, setShowDuplicate] = useState(false)
  const [showClear, setShowClear] = useState(false)

  if (!code || !sKey) return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent /></Sheet>

  const key = `${code}-${sKey}`
  const award: SeriesAward = t.attributions[key] ?? { winner: [], finalist: [], status: 'empty' }
  const isDouble = t.categories[code].isDouble
  const mult = isDouble ? 2 : 1
  const total = cellTotalValue(t, key)

  const updateRefs = (role: 'winner' | 'finalist', refs: LotRef[]) => setLot(key, role, refs)
  const toggleValidated = () => setAwardStatus(key, award.status === 'validated' ? 'draft' : 'validated')

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="sm:max-w-lg w-full overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t.categories[code].label} · {sKey}</SheetTitle>
            <SheetDescription>
              {isDouble ? 'Double : chaque lot sera attribué × 2 (un par joueur).' : 'Simple : un seul exemplaire par lot.'}
            </SheetDescription>
          </SheetHeader>

          <div className="p-4 space-y-6">
            <section className="space-y-2">
              <h3 className="flex items-center gap-2"><Trophy className="size-5 text-secondary" /> Vainqueur</h3>
              <LotPicker refs={award.winner} countMultiplier={mult} readOnly={locked} onChange={refs => updateRefs('winner', refs)} />
              <p className="text-xs text-muted-foreground">Valeur par joueur : {valuePerPlayer(t, key, 'winner').toLocaleString('fr-FR')} €</p>
            </section>

            <section className="space-y-2">
              <h3 className="flex items-center gap-2"><Medal className="size-5 text-muted-foreground" /> Finaliste</h3>
              <LotPicker refs={award.finalist} countMultiplier={mult} readOnly={locked} onChange={refs => updateRefs('finalist', refs)} />
              <p className="text-xs text-muted-foreground">Valeur par joueur : {valuePerPlayer(t, key, 'finalist').toLocaleString('fr-FR')} €</p>
            </section>

            <div className="rounded-md border bg-muted/30 p-3 text-sm">
              <div className="font-medium">Total de la cellule : {total.toLocaleString('fr-FR')} €</div>
              <div className="text-xs text-muted-foreground">Coût stock total (lots × quantité).</div>
            </div>
          </div>

          <SheetFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <div className="flex gap-2">
              <Button variant="outline" disabled={locked} onClick={() => setShowDuplicate(true)}><Copy className="size-4 mr-1" /> Dupliquer</Button>
              <Button variant="outline" disabled={locked} onClick={() => setShowClear(true)}><Trash2 className="size-4 mr-1" /> Vider</Button>
            </div>
            <Button onClick={toggleValidated} disabled={locked} variant={award.status === 'validated' ? 'secondary' : 'default'}>
              <CheckCircle2 className="size-4 mr-1" />
              {award.status === 'validated' ? 'Dévalider' : 'Valider la série'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <DuplicateMenu open={showDuplicate} onOpenChange={setShowDuplicate} sourceKey={key} />
      <ConfirmDialog
        open={showClear}
        onOpenChange={setShowClear}
        title="Vider cette série ?"
        description="Les lots du vainqueur et du finaliste seront supprimés."
        variant="destructive"
        confirmLabel="Vider"
        onConfirm={() => clearAward(key)}
      />
    </>
  )
}
```

- [ ] **Step 4: Verify in dev, commit**

```bash
npm run dev
```

Verify: open a cell, add stock items first via `/stock`, then attribute lots, validate, duplicate, clear.

```bash
git add -A
git commit -m "feat(repartition): AwardEditorPanel with LotPicker, DuplicateMenu, validate"
```

---

### Task 20: Dashboard page

**Files:**
- Create: `app/page.tsx` (replace), `components/dashboard/KPICard.tsx`, `components/dashboard/ValidationProgress.tsx`, `components/dashboard/AlertsList.tsx`, `components/dashboard/PerPlayerView.tsx`

- [ ] **Step 1: Create `KPICard.tsx`**

```tsx
// components/dashboard/KPICard.tsx
export function KPICard({ label, value, hint, tone = 'default' }: { label: string; value: string | number; hint?: string; tone?: 'default' | 'warn' | 'error' | 'ok' }) {
  const toneClass = {
    default: 'border bg-card',
    ok:      'border-emerald-300 bg-emerald-50',
    warn:    'border-secondary bg-secondary/10',
    error:   'border-destructive bg-destructive/10',
  }[tone]
  return (
    <div className={`rounded-lg p-4 ${toneClass}`}>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-3xl font-display tabular-nums">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  )
}
```

- [ ] **Step 2: Create `ValidationProgress.tsx`**

```tsx
// components/dashboard/ValidationProgress.tsx
import { useStore } from '@/lib/store'
import { categoryProgress, overallProgress } from '@/lib/derivations'
import type { CategoryCode } from '@/types/tournament'
import { Progress } from '@/components/ui/progress'

const ORDER: CategoryCode[] = ['SH', 'SD', 'DH', 'DD', 'DMX']

export function ValidationProgress() {
  const t = useStore(s => s.tournament)
  const overall = overallProgress(t)
  const pct = overall.total ? Math.round((overall.validated / overall.total) * 100) : 0
  return (
    <section className="rounded-lg border bg-card p-4 space-y-3">
      <h2>Avancement de la validation</h2>
      <div>
        <div className="flex justify-between text-sm mb-1"><span>Global</span><span className="tabular-nums">{overall.validated}/{overall.total} ({pct}%)</span></div>
        <Progress value={pct} />
      </div>
      <ul className="grid sm:grid-cols-2 gap-2">
        {ORDER.map(code => {
          const p = categoryProgress(t, code)
          const cp = p.total ? Math.round((p.validated / p.total) * 100) : 0
          return (
            <li key={code} className="space-y-1">
              <div className="flex justify-between text-xs"><span>{t.categories[code].label}</span><span className="tabular-nums">{p.validated}/{p.total}</span></div>
              <Progress value={cp} />
            </li>
          )
        })}
      </ul>
    </section>
  )
}
```

- [ ] **Step 3: Create `AlertsList.tsx`**

```tsx
// components/dashboard/AlertsList.tsx
'use client'
import { useStore } from '@/lib/store'
import { runValidators } from '@/lib/validators'
import { AlertTriangle, AlertCircle, Info } from 'lucide-react'

const ICON = { warn: AlertTriangle, error: AlertCircle, info: Info } as const
const TONE = {
  warn:  'border-secondary bg-secondary/10 text-foreground',
  error: 'border-destructive bg-destructive/10 text-destructive',
  info:  'border bg-card text-muted-foreground',
} as const

export function AlertsList() {
  const t = useStore(s => s.tournament)
  const alerts = runValidators(t)

  // Group: errors + warnings first, info last
  const errs  = alerts.filter(a => a.severity === 'error')
  const warns = alerts.filter(a => a.severity === 'warn')
  const infos = alerts.filter(a => a.severity === 'info').slice(0, 10)

  if (alerts.length === 0) {
    return <p className="text-sm text-emerald-700">✅ Aucune alerte. Tout est cohérent.</p>
  }

  const render = (a: typeof alerts[number], i: number) => {
    const Icon = ICON[a.severity]
    return (
      <li key={i} className={`flex items-start gap-2 rounded-md border p-2 text-sm ${TONE[a.severity]}`}>
        <Icon className="size-4 mt-0.5 shrink-0" aria-hidden />
        <div>
          <span className="font-medium mr-1">{a.code}</span>
          <span>{a.message}</span>
        </div>
      </li>
    )
  }

  return (
    <section className="rounded-lg border bg-card p-4 space-y-3">
      <h2>Alertes de cohérence</h2>
      {errs.length + warns.length > 0 && <ul className="space-y-1">{[...errs, ...warns].map(render)}</ul>}
      {infos.length > 0 && (
        <details>
          <summary className="text-xs text-muted-foreground cursor-pointer">+ {alerts.filter(a => a.severity === 'info').length} info (séries non dotées)</summary>
          <ul className="space-y-1 mt-2">{infos.map(render)}</ul>
        </details>
      )}
    </section>
  )
}
```

- [ ] **Step 4: Create `PerPlayerView.tsx`**

```tsx
// components/dashboard/PerPlayerView.tsx
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
```

- [ ] **Step 5: Replace `app/page.tsx`**

```tsx
// app/page.tsx
'use client'
import { useStore } from '@/lib/store'
import { overallProgress, totalRecipients, stockRemaining, stockItemValue } from '@/lib/derivations'
import { KPICard } from '@/components/dashboard/KPICard'
import { ValidationProgress } from '@/components/dashboard/ValidationProgress'
import { AlertsList } from '@/components/dashboard/AlertsList'
import { PerPlayerView } from '@/components/dashboard/PerPlayerView'

export default function Page() {
  const t = useStore(s => s.tournament)
  const p = overallProgress(t)
  const pct = p.total ? Math.round((p.validated / p.total) * 100) : 0
  const budget = t.stock.reduce((sum, item) => sum + stockItemValue(item) * item.quantity, 0)
  const allocated = Object.entries(t.attributions).reduce((sum, [, a]) => {
    const refs = [...a.winner, ...a.finalist]
    return sum + refs.reduce((s, r) => {
      const it = t.stock.find(x => x.id === r.stockItemId)
      return s + (it ? stockItemValue(it) * r.count : 0)
    }, 0)
  }, 0)
  const understocked = t.stock.filter(it => stockRemaining(t, it) < 0).length

  return (
    <div className="space-y-6">
      <header>
        <h1>{t.meta.name}</h1>
        <p className="text-muted-foreground">Vue d'ensemble du tournoi.</p>
      </header>

      <section className="grid sm:grid-cols-4 gap-3">
        <KPICard label="Validation" value={`${pct}%`} hint={`${p.validated}/${p.total} séries`} tone={pct === 100 ? 'ok' : 'default'} />
        <KPICard label="Personnes à récompenser" value={totalRecipients(t)} />
        <KPICard label="Stock total (valorisé)" value={`${budget.toLocaleString('fr-FR')} €`} />
        <KPICard label="Lots déjà attribués" value={`${allocated.toLocaleString('fr-FR')} €`} tone={understocked > 0 ? 'error' : 'default'} hint={understocked > 0 ? `${understocked} lot(s) en rupture` : undefined} />
      </section>

      <ValidationProgress />
      <AlertsList />
      <PerPlayerView />
    </div>
  )
}
```

- [ ] **Step 6: Verify in dev, commit**

```bash
npm run dev
```

Open `/`. Verify KPIs, progress bars, alerts, per-player table.

```bash
git add -A
git commit -m "feat(dashboard): KPIs, validation progress, alerts, per-player view"
```

---

### Task 21: `/preparation` page with PDF export

**Files:**
- Create: `app/preparation/page.tsx`, `components/preparation/ChecklistByCategory.tsx`, `lib/pdf-export.tsx`

- [ ] **Step 1: Create `ChecklistByCategory.tsx`**

```tsx
// components/preparation/ChecklistByCategory.tsx
'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import { generateSeriesKeys } from '@/lib/series'
import type { CategoryCode } from '@/types/tournament'
import { LotBadge } from '@/components/shared/LotBadge'
import { Checkbox } from '@/components/ui/checkbox'

const ORDER: CategoryCode[] = ['SH', 'SD', 'DH', 'DD', 'DMX']

export function ChecklistByCategory() {
  const t = useStore(s => s.tournament)
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  return (
    <div className="space-y-6">
      {ORDER.map(code => {
        const cfg = t.categories[code]
        const keys = generateSeriesKeys(cfg.seriesCount)
        return (
          <section key={code} className="space-y-2">
            <h2>{cfg.label} <span className="text-sm text-muted-foreground font-normal">({cfg.isDouble ? 'Double' : 'Simple'})</span></h2>
            {keys.map(sKey => {
              const key = `${code}-${sKey}`
              const a = t.attributions[key]
              return (
                <div key={key} className="rounded-md border bg-card p-3">
                  <div className="font-medium">{sKey}</div>
                  {!a || (a.winner.length === 0 && a.finalist.length === 0) ? (
                    <p className="text-sm text-muted-foreground">Non doté.</p>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-3 mt-2">
                      {(['winner', 'finalist'] as const).map(role => {
                        const refs = a[role]
                        if (refs.length === 0) return <div key={role} />
                        return (
                          <div key={role} className="space-y-1">
                            <div className="text-xs uppercase text-muted-foreground">{role === 'winner' ? 'Vainqueur' : 'Finaliste'}</div>
                            <ul className="space-y-1">
                              {refs.map((ref, i) => {
                                const item = t.stock.find(x => x.id === ref.stockItemId)
                                if (!item) return null
                                const id = `${key}-${role}-${i}`
                                return (
                                  <li key={id} className="flex items-center gap-2 no-print:flex">
                                    <Checkbox id={id} checked={!!checked[id]} onCheckedChange={() => setChecked(c => ({ ...c, [id]: !c[id] }))} />
                                    <label htmlFor={id} className="flex items-center gap-2 text-sm"><LotBadge item={item} count={ref.count} /></label>
                                  </li>
                                )
                              })}
                            </ul>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </section>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Create `lib/pdf-export.tsx`** (React-PDF document)

```tsx
// lib/pdf-export.tsx
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
  empty:   { color: '#888', fontStyle: 'italic' },
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
```

- [ ] **Step 3: Create `app/preparation/page.tsx`**

```tsx
// app/preparation/page.tsx
'use client'
import { useStore } from '@/lib/store'
import { ChecklistByCategory } from '@/components/preparation/ChecklistByCategory'
import { Button } from '@/components/ui/button'
import { Download, Printer } from 'lucide-react'
import { downloadChecklistPdf } from '@/lib/pdf-export'
import { toast } from 'sonner'

export default function Page() {
  const t = useStore(s => s.tournament)
  const exportPdf = async () => {
    try {
      await downloadChecklistPdf(t)
    } catch (e) {
      toast.error('Échec de l\'export PDF.')
    }
  }
  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-2 flex-wrap no-print">
        <div>
          <h1>Préparation</h1>
          <p className="text-muted-foreground">Check-list des lots à préparer, par catégorie puis par série.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}><Printer className="size-4 mr-1" /> Imprimer</Button>
          <Button onClick={exportPdf}><Download className="size-4 mr-1" /> Export PDF</Button>
        </div>
      </header>
      <ChecklistByCategory />
    </div>
  )
}
```

- [ ] **Step 4: Verify, commit**

```bash
npm run dev
```

Open `/preparation/`. Click "Export PDF" — a file should download. The print button opens the browser print dialog.

```bash
git add -A
git commit -m "feat(preparation): checklist page with PDF export"
```

---

### Task 22: `/ceremonie` page — presentation mode + keyboard shortcuts

**Files:**
- Create: `app/ceremonie/page.tsx`, `components/ceremonie/PresentationStage.tsx`, `components/ceremonie/SeriesNavigator.tsx`, `components/ceremonie/LotCardLarge.tsx`, `components/ceremonie/ProjectorMode.tsx`, `hooks/useKeyboard.ts`

- [ ] **Step 1: Create `useKeyboard.ts`**

```ts
// hooks/useKeyboard.ts
'use client'
import { useEffect } from 'react'

export function useKeyboard(handlers: Record<string, () => void>) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement | null)?.isContentEditable) return
      const fn = handlers[e.key]
      if (fn) { e.preventDefault(); fn() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handlers])
}
```

- [ ] **Step 2: Create `LotCardLarge.tsx`**

```tsx
// components/ceremonie/LotCardLarge.tsx
import type { StockItem } from '@/types/tournament'
import { ColorChip } from '@/components/shared/ColorChip'

export function LotCardLarge({ item, count }: { item: StockItem; count: number }) {
  const value = item.amount ?? item.unitValue ?? 0
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-card border-2 border-foreground/10">
      <ColorChip kind={item.kind} size="md" className="!size-8" />
      <div className="flex-1">
        <div className="font-display text-2xl md:text-3xl leading-tight">{item.label}</div>
        <div className="text-muted-foreground text-lg">{value.toLocaleString('fr-FR')} €</div>
      </div>
      {count > 1 && <div className="font-display text-3xl md:text-4xl text-primary">× {count}</div>}
    </div>
  )
}
```

- [ ] **Step 3: Create `SeriesNavigator.tsx`**

```tsx
// components/ceremonie/SeriesNavigator.tsx
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

export function SeriesNavigator({ code, sKey, categoryLabel, onPrevSeries, onNextSeries, onPrevCategory, onNextCategory }: Props) {
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
```

- [ ] **Step 4: Create `ProjectorMode.tsx`** (CSS-only toggle helper)

```tsx
// components/ceremonie/ProjectorMode.tsx
'use client'
import { Button } from '@/components/ui/button'
import { Maximize, Minimize } from 'lucide-react'

export function ProjectorButton({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <Button variant="outline" size="sm" onClick={onToggle} aria-pressed={active} className="no-print">
      {active ? <><Minimize className="size-4 mr-1" /> Quitter projecteur</> : <><Maximize className="size-4 mr-1" /> Mode projecteur (F)</>}
    </Button>
  )
}
```

- [ ] **Step 5: Create `PresentationStage.tsx`**

```tsx
// components/ceremonie/PresentationStage.tsx
'use client'
import { useState, useMemo, useCallback } from 'react'
import type { CategoryCode } from '@/types/tournament'
import { useStore } from '@/lib/store'
import { generateSeriesKeys } from '@/lib/series'
import { LotCardLarge } from './LotCardLarge'
import { SeriesNavigator } from './SeriesNavigator'
import { ProjectorButton } from './ProjectorMode'
import { Button } from '@/components/ui/button'
import { useKeyboard } from '@/hooks/useKeyboard'
import { CheckCircle2, Trophy, Medal } from 'lucide-react'

const ORDER: CategoryCode[] = ['SH', 'SD', 'DH', 'DD', 'DMX']

export function PresentationStage() {
  const t = useStore(s => s.tournament)
  const toggleDelivered = useStore(s => s.toggleDelivered)
  const [code, setCode] = useState<CategoryCode>('SH')
  const [sIdx, setSIdx] = useState(0)
  const [projector, setProjector] = useState(false)

  const cfg = t.categories[code]
  const keys = useMemo(() => generateSeriesKeys(cfg.seriesCount), [cfg.seriesCount])
  const sKey = keys[Math.min(sIdx, keys.length - 1)]
  const key = `${code}-${sKey}`
  const a = t.attributions[key]
  const isDouble = cfg.isDouble
  const delivered = !!a?.deliveredAt

  const nextSeries = useCallback(() => setSIdx(i => Math.min(i + 1, keys.length - 1)), [keys.length])
  const prevSeries = useCallback(() => setSIdx(i => Math.max(0, i - 1)), [])

  const cycleCategory = useCallback((delta: number) => {
    const idx = ORDER.indexOf(code)
    const next = ORDER[(idx + delta + ORDER.length) % ORDER.length]
    setCode(next)
    setSIdx(0)
  }, [code])

  useKeyboard({
    'ArrowLeft':  prevSeries,
    'ArrowRight': nextSeries,
    'ArrowUp':    () => cycleCategory(-1),
    'ArrowDown':  () => cycleCategory(1),
    ' ':          () => toggleDelivered(key),
    'f':          () => setProjector(p => !p),
    'F':          () => setProjector(p => !p),
    'Escape':     () => setProjector(false),
  })

  const stage = (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <section className="space-y-2">
          <h2 className="flex items-center gap-2 text-2xl"><Trophy className="size-7 text-secondary" /> Vainqueur</h2>
          {a?.winner.length ? (
            <div className="space-y-2">
              {a.winner.map((ref, i) => {
                const it = t.stock.find(x => x.id === ref.stockItemId)
                return it ? <LotCardLarge key={i} item={it} count={ref.count} /> : null
              })}
              {isDouble && <p className="text-muted-foreground text-sm">× 2 (un par joueur)</p>}
            </div>
          ) : <p className="text-muted-foreground">Aucun lot attribué.</p>}
        </section>
        <section className="space-y-2">
          <h2 className="flex items-center gap-2 text-2xl"><Medal className="size-7 text-muted-foreground" /> Finaliste</h2>
          {a?.finalist.length ? (
            <div className="space-y-2">
              {a.finalist.map((ref, i) => {
                const it = t.stock.find(x => x.id === ref.stockItemId)
                return it ? <LotCardLarge key={i} item={it} count={ref.count} /> : null
              })}
              {isDouble && <p className="text-muted-foreground text-sm">× 2 (un par joueur)</p>}
            </div>
          ) : <p className="text-muted-foreground">Aucun lot attribué.</p>}
        </section>
      </div>
    </div>
  )

  return projector ? (
    <div className="fixed inset-0 bg-background z-50 p-8 overflow-auto">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="font-display text-4xl">{cfg.label} · {sKey}</h1>
          <ProjectorButton active onToggle={() => setProjector(false)} />
        </header>
        {stage}
      </div>
    </div>
  ) : (
    <div className="space-y-6 max-w-5xl mx-auto">
      <header className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1>Cérémonie</h1>
          <p className="text-muted-foreground text-sm">←/→ série · ↑/↓ catégorie · Espace toggle remis · F projecteur</p>
        </div>
        <ProjectorButton active={projector} onToggle={() => setProjector(p => !p)} />
      </header>
      <SeriesNavigator
        code={code}
        sKey={sKey}
        categoryLabel={cfg.label}
        onPrevSeries={prevSeries}
        onNextSeries={nextSeries}
        onPrevCategory={() => cycleCategory(-1)}
        onNextCategory={() => cycleCategory(1)}
      />
      {stage}
      <div className="flex justify-center">
        <Button
          size="lg"
          variant={delivered ? 'secondary' : 'default'}
          onClick={() => toggleDelivered(key)}
          className="h-16 text-lg"
        >
          <CheckCircle2 className="size-6 mr-2" />
          {delivered ? `Remis (${new Date(a!.deliveredAt!).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })})` : 'Lots remis'}
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create `app/ceremonie/page.tsx`**

```tsx
// app/ceremonie/page.tsx
'use client'
import { PresentationStage } from '@/components/ceremonie/PresentationStage'

export default function Page() {
  return <PresentationStage />
}
```

- [ ] **Step 7: Verify in dev, commit**

```bash
npm run dev
```

Test: navigate with arrow keys, toggle delivered with space, press F for projector mode, Escape to exit.

```bash
git add -A
git commit -m "feat(ceremonie): presentation stage with keyboard shortcuts and projector"
```

---

### Task 23: `/share` read-only (query string) + ShareDialog

**Files:**
- Create: `app/share/page.tsx`, `components/share/SnapshotBanner.tsx`, `components/share/ShareDialog.tsx`, `components/share/ReadOnlyContext.tsx`
- Modify: `components/layout/AppShell.tsx` (add Share button)

**Important:** Next.js `output: 'export'` does **not** support runtime-only dynamic routes. Putting the snapshot in a path segment would force every possible snapshot to be enumerated at build time. We therefore use a **query string**: `/share/?s=<encoded>` resolves to the single static `app/share/page.tsx` and reads the snapshot from `useSearchParams()` on the client.

- [ ] **Step 1: Create a `ReadOnly` context**

```tsx
// components/share/ReadOnlyContext.tsx
'use client'
import { createContext, useContext } from 'react'
export const ReadOnlyContext = createContext(false)
export const useReadOnly = () => useContext(ReadOnlyContext)
```

- [ ] **Step 2: Create `SnapshotBanner.tsx`**

```tsx
// components/share/SnapshotBanner.tsx
export function SnapshotBanner({ savedAt }: { savedAt: string }) {
  let when = savedAt
  try { when = new Date(savedAt).toLocaleString('fr-FR') } catch {}
  return (
    <div className="bg-secondary text-secondary-foreground text-center text-sm py-2 px-4">
      📸 Snapshot du {when} — peut être obsolète. Lecture seule.
    </div>
  )
}
```

- [ ] **Step 3: Create `app/share/page.tsx`** (query-string based, static-export friendly)

```tsx
// app/share/page.tsx
'use client'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { decodeSnapshot } from '@/lib/share-codec'
import { useStore } from '@/lib/store'
import type { Tournament } from '@/types/tournament'
import { ReadOnlyContext } from '@/components/share/ReadOnlyContext'
import { SnapshotBanner } from '@/components/share/SnapshotBanner'

function SharePageInner() {
  const params = useSearchParams()
  const encoded = params.get('s') ?? ''
  const replace = useStore(s => s.replaceTournament)
  const [t, setT] = useState<Tournament | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!encoded) { setErr('Aucun snapshot dans l’URL.'); return }
    const decoded = decodeSnapshot(encoded)
    if (!decoded) { setErr('Snapshot invalide ou corrompu.'); return }
    setT(decoded)
    replace({ ...decoded, meta: { ...decoded.meta, locked: true } })
  }, [encoded, replace])

  if (err) return <div className="p-8 text-destructive">{err}</div>
  if (!t) return <div className="p-8 text-muted-foreground">Chargement du snapshot…</div>

  return (
    <ReadOnlyContext.Provider value={true}>
      <SnapshotBanner savedAt={t.meta.savedAt} />
      <div className="p-4 space-y-4">
        <p className="text-sm text-muted-foreground">Tu peux naviguer dans Dashboard / Répartition / Préparation / Cérémonie via la barre de gauche. Toute édition est désactivée.</p>
      </div>
    </ReadOnlyContext.Provider>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Chargement…</div>}>
      <SharePageInner />
    </Suspense>
  )
}
```

- [ ] **Step 4: Create `ShareDialog.tsx`**

```tsx
// components/share/ShareDialog.tsx
'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import { encodeSnapshot, MAX_URL_PAYLOAD } from '@/lib/share-codec'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Share2, Copy, Download } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'

export function ShareDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const t = useStore(s => s.tournament)
  const [base] = useState(() => typeof window !== 'undefined' ? window.location.origin : '')
  const encoded = encodeSnapshot(t)
  const url = `${base}/share/?s=${encoded}`
  const tooLong = encoded.length > MAX_URL_PAYLOAD

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); toast.success('Lien copié') } catch { toast.error('Copie impossible') }
  }
  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(t, null, 2)], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${t.meta.name.replace(/\s+/g, '-').toLowerCase()}.json`; a.click(); URL.revokeObjectURL(a.href)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Partager le snapshot</DialogTitle>
          <DialogDescription>Lien en lecture seule. Repartage-le à chaque mise à jour majeure.</DialogDescription>
        </DialogHeader>
        {tooLong ? (
          <div className="space-y-3">
            <p className="text-sm text-destructive">Snapshot trop volumineux pour une URL ({encoded.length} caractères). Télécharge le JSON et envoie-le, les bénévoles l'importeront via /import.</p>
            <Button onClick={downloadJson}><Download className="size-4 mr-1" /> Télécharger le JSON</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-center bg-card p-3 rounded-md border">
              <QRCodeSVG value={url} size={180} />
            </div>
            <Input readOnly value={url} aria-label="URL du snapshot" />
            <div className="flex gap-2">
              <Button onClick={copy}><Copy className="size-4 mr-1" /> Copier</Button>
              <Button variant="outline" onClick={downloadJson}><Download className="size-4 mr-1" /> JSON</Button>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 5: Wire `Share` into `AppShell.tsx`**

Replace `AppShell.tsx` body with:

```tsx
// components/layout/AppShell.tsx
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
          <div className="flex items-center gap-2 sm:gap-4">
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
```

- [ ] **Step 6: Run dev and verify**

```bash
npm run dev
```

In the main app, click Partager → copy URL → open in private window → verify read-only banner + locked state (the lock toggle is on; all edit actions disabled by `locked`).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(share): snapshot URL + QR + read-only banner"
```

---

### Task 24: `/import` page

**Files:**
- Create: `app/import/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// app/import/page.tsx
'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Upload, RotateCcw } from 'lucide-react'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { toast } from 'sonner'
import type { Tournament } from '@/types/tournament'

export default function Page() {
  const replace = useStore(s => s.replaceTournament)
  const resetToDefaults = useStore(s => s.resetToDefaults)
  const [pending, setPending] = useState<Tournament | null>(null)
  const [resetOpen, setResetOpen] = useState(false)

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const obj = JSON.parse(String(reader.result))
        if (obj?.meta?.schemaVersion !== 1) throw new Error('schemaVersion')
        setPending(obj)
      } catch {
        toast.error('Fichier invalide (JSON ou schemaVersion).')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-6 max-w-xl">
      <header>
        <h1>Importer / Réinitialiser</h1>
        <p className="text-muted-foreground">Charge un snapshot JSON ou réinitialise l'application.</p>
      </header>

      <section className="rounded-lg border bg-card p-4 space-y-3">
        <h2 className="flex items-center gap-2"><Upload className="size-5" /> Importer un fichier JSON</h2>
        <p className="text-sm text-muted-foreground">Écrasera l'état actuel après confirmation.</p>
        <input type="file" accept="application/json,.json" onChange={onFile} className="block text-sm" />
      </section>

      <section className="rounded-lg border bg-card p-4 space-y-3">
        <h2 className="flex items-center gap-2"><RotateCcw className="size-5" /> Réinitialiser</h2>
        <p className="text-sm text-muted-foreground">Repart d'une configuration vierge (catégories par défaut, stock vide).</p>
        <Button variant="destructive" onClick={() => setResetOpen(true)}>Reset complet</Button>
      </section>

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(o) => !o && setPending(null)}
        title="Remplacer l'état actuel ?"
        description="Le tournoi en cours sera remplacé par le contenu du fichier."
        variant="destructive"
        confirmLabel="Remplacer"
        onConfirm={() => { if (pending) { replace(pending); toast.success('Snapshot importé.') } }}
      />
      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Réinitialiser complètement ?"
        description="Toutes les données seront effacées. Tape RESET pour confirmer."
        variant="destructive"
        confirmLabel="Réinitialiser"
        requireText="RESET"
        onConfirm={() => { resetToDefaults(); toast.success('Tournoi réinitialisé.') }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify, commit**

```bash
npm run dev
git add -A
git commit -m "feat(import): import JSON + reset with double confirmation"
```

---

### Task 25: First-load bootstrap of suggested stock items

**Files:**
- Modify: `hooks/useHydrated.ts`

The spec asks for "suggested denominations" placeholders. On first hydration when `stock.length === 0` we add suggested rows with `quantity: 0` so the user just has to fill the count.

- [ ] **Step 1: Update `hooks/useHydrated.ts`**

```tsx
// hooks/useHydrated.ts
'use client'
import { useEffect } from 'react'
import { useStore } from '@/lib/store'

const FIRST_RUN_KEY = 'abil-prizes:first-run-seeded'

const SUGGESTIONS: Array<{ kind: 'cheque' | 'bon' | 'biere' | 'volants' | 'hybride'; label: string; amount?: number; unitValue?: number }> = [
  { kind: 'cheque', label: 'Chèque 150€', amount: 150 },
  { kind: 'cheque', label: 'Chèque 100€', amount: 100 },
  { kind: 'bon',    label: "Bon d'achat 40€", amount: 40 },
  { kind: 'bon',    label: "Bon d'achat 35€", amount: 35 },
  { kind: 'bon',    label: "Bon d'achat 30€", amount: 30 },
  { kind: 'bon',    label: "Bon d'achat 25€", amount: 25 },
  { kind: 'bon',    label: "Bon d'achat 20€", amount: 20 },
  { kind: 'bon',    label: "Bon d'achat 15€", amount: 15 },
  { kind: 'biere',   label: 'Lot de 2 bières', unitValue: 0 },
  { kind: 'volants', label: 'Boîte de volants', unitValue: 0 },
  { kind: 'hybride', label: 'Boîte hybride',   unitValue: 0 },
]

function uid(): string { return Math.random().toString(36).slice(2, 10) }

export function useHydrated(): boolean {
  const hydrated = useStore(s => s.hydrated)
  const hydrate  = useStore(s => s.hydrate)
  const stock    = useStore(s => s.tournament.stock)
  const upsert   = useStore(s => s.upsertStockItem)

  useEffect(() => { if (!hydrated) hydrate() }, [hydrated, hydrate])

  useEffect(() => {
    if (!hydrated) return
    if (typeof window === 'undefined') return
    if (localStorage.getItem(FIRST_RUN_KEY)) return
    if (stock.length > 0) { localStorage.setItem(FIRST_RUN_KEY, '1'); return }
    for (const s of SUGGESTIONS) upsert({ id: uid(), quantity: 0, ...s } as any)
    localStorage.setItem(FIRST_RUN_KEY, '1')
  }, [hydrated, stock.length, upsert])

  return hydrated
}
```

- [ ] **Step 2: Verify, commit**

Clear `localStorage` in DevTools, refresh `/stock` — suggestions appear with quantity 0.

```bash
git add hooks/useHydrated.ts
git commit -m "feat(bootstrap): seed suggested stock denominations on first run"
```

---

## Phase 5 — Polish & ship

### Task 26: README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace `README.md`**

```markdown
# ABIL Prizes — Tour des Héraults

Application web statique de gestion des récompenses pour le tournoi **Tour des Héraults** organisé par l'Association Bad In Lez (ABIL).

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

## Persistance

- Auto-sauvegarde locale dans `localStorage` (clé `abil-prizes:v1`)
- Export JSON via `/import` (bouton "Télécharger" dans Partager)
- Import JSON via `/import`

## Partage

- Bouton **Partager** en haut → URL avec snapshot compressé + QR code
- Les bénévoles ouvrent le lien → vue en **lecture seule**
- Si le tournoi est volumineux : télécharge le JSON, partage-le par WhatsApp, importe via `/import`

## Raccourcis cérémonie

- `←` / `→` : série précédente / suivante
- `↑` / `↓` : catégorie précédente / suivante
- `Espace` : marquer les lots comme remis
- `F` : mode projecteur plein écran
- `Échap` : quitter le mode projecteur

## Stack

Next.js 16 (`output: 'export'`) · React 19 · TypeScript · Tailwind 4 · shadcn/ui · Zustand · LZ-string · @react-pdf/renderer · Framer Motion · Sonner.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: README in French with quickstart and shortcuts"
```

---

### Task 27: Final build + lint sweep

- [ ] **Step 1: Lint and build**

```bash
npm run lint
npm run build
npm test
```

Expected: all pass.

- [ ] **Step 2: If anything fails, fix inline (typos, unused imports), then re-run.**

- [ ] **Step 3: Commit any fixups**

```bash
git add -A
git commit -m "chore: final lint/build sweep" || true
```

---

### Task 28: Push to GitHub `abil-lots`

**Files:** — (no code changes)

- [ ] **Step 1: Confirm repo remote does not exist yet, then add it**

```bash
git remote -v
```

If `origin` is empty:
```bash
git remote add origin https://github.com/kellian-puginier/abil-lots.git
```

- [ ] **Step 2: Push the main branch with upstream tracking**

```bash
git push -u origin main
```

Expected: push succeeds. If the remote rejects because it has unrelated commits (the user said it's empty, but verify), pause and ask the user — do NOT force-push.

- [ ] **Step 3: Confirm on GitHub**

Open `https://github.com/kellian-puginier/abil-lots` and confirm files are present.

---

## Coverage Map (self-review)

| Spec section                       | Task(s)                       |
|------------------------------------|-------------------------------|
| §1 Contexte / §2 Structure métier  | Type definitions (T6), defaults (T8) |
| §3 Stack technique                 | T1, T2, T3, T4, T5            |
| §4 Modèle de données               | T6, T13                       |
| §5.1 Routes                        | T16–T24                       |
| §5.2 Layout (header, navs, lock)   | T14                           |
| §5.3 Stock                         | T17                           |
| §5.3 Config                        | T16                           |
| §5.3 Répartition                   | T18, T19                      |
| §5.3 Dashboard                     | T20                           |
| §5.3 Préparation + PDF             | T21                           |
| §5.3 Cérémonie + raccourcis        | T22                           |
| §5.3 Share / Import                | T23, T24                      |
| §5.4 Components & lib              | T6–T15 file structure         |
| §6 Garde-fous V1–V5 + per-player   | T10, T20                      |
| §7 Partage URL + QR + fallback     | T23                           |
| §8 Config par défaut + suggestions | T8, T25                       |
| §9 Accessibilité                   | Inline through all UI tasks   |
| §10 Tests Vitest                   | T5, T7–T13                    |
| §11 README + Git push              | T26, T28                      |
