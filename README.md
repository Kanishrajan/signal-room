# Receipts of a Life — The Signal Room

A static, accessible timeline that fuses three **provided real exports**—Spotify listening history, a household spending ledger, and card/fraud transactions—into one receipt stream. Users can search, filter, select two receipts, connect them, unlock a narrative chapter, and inspect the persistent Life Arc.

## Build gate: verified source schemas first

The previous build used seeded arrays with synthetic dates. This version does **not** assume that mapping.

The supplied files were inspected before the ETL was rewritten:

| Source | Actual file | Verified columns / format | Normalization |
|---|---|---|---|
| Music | `data/raw/spotify_history.csv` | `spotify_track_uri, ts, platform, ms_played, track_name, artist_name, album_name, reason_start, reason_end, shuffle, skipped` | `ts` is parsed as UTC `YYYY-MM-DD HH:mm:ss`; string booleans become booleans |
| Ledger | `data/raw/Daily Household Transactions.csv` | `Date, Mode, Category, Subcategory, Note, Amount, Income/Expense, Currency` | mixed `D/M/YYYY` with optional time; `Transfer-Out` is normalized to `expense` |
| Card | `data/raw/Augmented_IndiaTransactMultiFacet2024.csv` | 21 columns including `trans_id, trans_date_trans_time, merchant, category, amt, is_fraud, customer_id` | `M/D/YYYY H:mm`; fraud and null-density are derived from actual fields |

Important mismatch from the old mapping: the card source has **21 columns**, not a five-field schema, and the old synthetic source arrays were not the provided files. The build script now asserts the real headers before parsing.

## ETL pipeline

The build order is intentionally data-first:

```text
provided raw files
      ↓
scripts/build-receipts.ts
      ↓
schema + date-format checks
      ↓
normalize into Receipt union
      ↓
deterministic stratified curation
      ↓
data/receipts.json (240 records)
      ↓
static Vite build
```

The curation is deterministic and balanced:

- 80 Music receipts
- 80 Ledger receipts
- 80 Card receipts
- 240 total, within the required 150–300 range
- Music includes engaged + skipped listening
- Ledger includes income + non-income records
- Card includes non-fraud + fraud + unknown `is_fraud` records

Run:

```bash
npm install
npm run build:receipts
npm run lint
npm run build
```

`build` runs the ETL first, so stale `receipts.json` cannot silently survive a production build.

Raw files remain under `data/raw/` and are build-time inputs only. They are never imported by the browser.

## Product requirements

- **Explore receipts:** chronological Ledger-style list, one receipt per row.
- **Filter/search:** literal `Music`, `Ledger`, `Card` channel controls + `Search receipts...`.
- **Discover relationships:** select A → select B → `Connect`.
- **Interactive storytelling:** each successful connection can unlock a Chapter Card.
- **Life Arc:** one persistent SVG synthesis of unlocked chapters; clicking a node returns to its evidence.
- **Responsive:** desktop inspector, tablet slide-over, mobile bottom sheet.
- **Keyboard complete:** receipt selection and Connect work without pointer-only interaction.
- **Reduced motion:** narrative transition becomes effectively instant and Life Arc has no animation loop.

## Visual system

### Swiss / International — always on

The structural layer uses strict alignment, large whitespace, a grotesk UI face, and mono metadata. It governs the grid, spacing, typography, and chronology.

### Minimalist — resting state

Before data is loaded and across empty states, the interface is intentionally quiet: paper-white background, black type, no decorative containers, and hairline dividers only where information hierarchy needs them.

### Bauhaus — track identity

The three channels use simple geometric glyphs:

- Music — circle / red
- Ledger — square / blue
- Card — triangle / yellow

Color is concentrated in channel controls and the Life Arc legend rather than sprayed across every receipt.

### Brutalist — interaction

Anything clickable is unmistakably an instrument control: hard black borders, rectangular hit areas, direct labels, and short offset shadows. No soft rounded UI.

### Maximalism — Life Arc payoff

Once multiple chapters exist, the Life Arc becomes denser and more chromatic. This is the only persistent screen allowed to feel visually saturated.

### Y2K / Acid — narrative beats only

The chapter reveal uses a short retro-digital tuning/glitch beat. It does not loop and does not appear in idle UI. `prefers-reduced-motion` collapses it to an immediate state change.

## Architecture

```text
/
├── components/
│   ├── ui/                 # presentational primitives
│   ├── receipt/            # receipt list/card/detail
│   └── pattern/            # connection/chapter/Life Arc
├── data/
│   ├── raw/                # build-time source exports
│   └── receipts.json       # 240-record browser payload
├── lib/
│   ├── clustering.ts       # pure filtering + pattern evaluation
│   └── scoring.ts          # pure deterministic scoring
├── scripts/
│   └── build-receipts.ts   # source verification + ETL
├── store/
│   └── pattern-store.ts    # single Zustand state store
├── types/
│   └── receipt.ts          # discriminated Receipt union
└── src/
    ├── App.tsx
    └── index.css
```

Rules:

- No runtime parsing of CSV.
- No API routes or serverless functions.
- No canvas, WebGL, physics, or `requestAnimationFrame`.
- Pattern scoring runs only after `Connect`.
- `receipts.json` is never mutated at runtime.
- Business logic stays in `lib/` and the Zustand store.
- UI components stay focused on presentation and interaction wiring.

## Pattern engine

The pattern engine is a transparent heuristic, not an AI/statistical model.

It considers:

1. temporal proximity,
2. cross-channel convergence,
3. late-night synchrony,
4. meaningful listening engagement,
5. confidence attenuation.

The calculation happens on an explicit `Connect` action rather than every render or scroll.

## Accessibility

- semantic header/nav/main/aside/footer structure,
- real focusable receipt buttons,
- Enter/Space selection flow,
- Connect button enabled only after two selections,
- `aria-live="polite"` announcements,
- visible focus rings,
- no drag-only interaction,
- reduced-motion handling.

## Performance

The browser receives only the curated `receipts.json` payload. The large raw exports are parsed once during the build step. The app contains no animation loop or canvas rendering, and Life Arc is the only lazily loaded visual module.

## Deployment

This is a static Vite application.

```bash
npm run build
```

Deploy the resulting `dist/` directory to Vercel or another static host. No environment variables, API routes, or server process are required.

## Known limitations

- The three source systems have different date ranges and semantics; a connection is a deterministic narrative heuristic, not proof of causality.
- Household timestamps without a time component are normalized to midnight UTC because the source does not provide a more precise time.
- Card timestamps do not declare a timezone in the supplied schema, so the build uses a consistent UTC representation for the static timeline.
