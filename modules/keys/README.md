# taxonpages-module-keys

A local, NPM-distributable TaxonPages module that replaces the `@sfgrp/pinpoint` dichotomous (couplet) key renderer with a themeable, feature-complete alternative.

## What it provides

### Routes

- **`keys-index`** → `/keys` — index page listing all public dichotomous keys in the project
- **`dichotomous-key`** → `/key/:id/:couplet?` — the key view
  - `:id` is a TaxonWorks lead/key ID
  - `:couplet` (optional) is a couplet number — one URL per couplet, shareable and bookmarkable
  - Composes with `?format=guided|full` (read from the route query, so transport-agnostic; overrides the `localStorage` preference, which is client-only and applied post-mount)

No URL hash is used for couplet navigation (unlike some dichotomous-key viewers). The couplet is a **path segment**, so it resolves identically under server-side and client-side rendering: browsers never send the fragment to the server, so SSR would always render couplet 1 if couplet were in the hash.

### Formats

Toggle between two views (persisted per viewer in `localStorage` as `taxonpages:key-format`; `?format=` in the URL overrides):

**Guided mode** (default)
- One couplet at a time, step-by-step navigation
- Breadcrumb trail showing the path taken
- Each choice card shows "→ Couplet M · leads to K taxa" instead of a wall of downstream couplet text
- Figures (a lead's own, or the taxon-image fallback) sit at the bottom of each choice card, beneath the "Go to couplet" button; a figure shared by every lead is shown once above the cards
- Descending and breadcrumb clicks push the URL, so browser Back walks up the key
- Guided deep-links: `/key/3977/4` loads directly to couplet 4, with breadcrumb `1 › 3 › 4`

**Full key mode**
- Classic numbered couplet list — all couplets on one page
- Each couplet marked with `id="couplet-N"` for scroll-to navigation
- Couplet-number links navigate via the `:couplet` param and scroll the target into view
- Current couplet highlighted with a ring; a persistent "↑ Couplet N" button (bottom-right) returns to it
- **Per-lead layout:** the lead text sits in a readable column (capped ~46ch); its target
  (a taxon, or "couplet N →") renders as a filled chip, right-aligned so the whole page
  scans down a single column. A fixed ~320px image column to the right of each lead holds
  its illustrating figures (see below). Below ~640px the image column drops under the text.
- **Target taxon names** use the TaxonWorks split — name italic (`cached_html`), author +
  year roman (`cached_author_year`) — instead of italicising the whole `target_label`.
  Resolved per lead-target OTU by `composables/useKeyTaxonNames.js` (provided as
  `keyTaxonNames`); `TaxonLink` falls back to the plain label until it resolves. As a
  side effect the pill shows the OTU's full name (incl. subgenus) even when the lead's
  stored `target_label` omitted it.

### Figures and citations

- **Per-lead figures** — a lead's own `figures` (from `GET /leads/key/:id`) render in the
  image column at column width, natural aspect, stacked, with the `figure_label` (or a
  truncated caption) below each; click opens the shared
  `panels/_shared/ImageLightbox.vue` in `minimal` mode (prev/next, ←/→ keys, Esc to
  close, focus-trapped) — just the bold label + full caption, nothing else. Up to 3
  shown, then a "+N more images" link into the lightbox. A lead can carry figs 1–3 while
  its sibling carries fig 4 — each lead shows its own list. `LeadFigures.vue` maps each
  figure onto the lightbox's image shape (`lightboxItems`).
- **Shared couplet figures** — when the *same image* is attached to **every** lead of a
  couplet (e.g. one plate illustrating the contrast, added to both leads), it is hoisted
  out of the per-lead figures and shown once for the couplet: in Full-key view a block on
  the right, vertically centred beside the leads; in Guided view a "Shared figure" card
  above the choice cards. Identity is the underlying image (`figureKey` — the
  `/images/<id>/` id), so a differing caption on each copy doesn't matter; the captioned
  copy is kept as the representative (`partitionCoupletFigures` in `lib/images.js`). Each
  lead's remaining *individual* figures still show per lead, and the taxon-image fallback
  is suppressed for a lead with no individual figure — the shared figure is the couplet's
  illustration.
- **Taxon-image fallback** — in practice no key in this project carries per-lead figures,
  so for any lead that keys out an OTU (`target_type === '/api/v1/otus'`) and has no
  figures of its own, `LeadFigures` shows images *of that taxon* instead:
  `GET /otus/:id/inventory/images.json` (OTU + CollectionObject + FieldOccurrence
  depictions in one call), and when that is empty, iNaturalist (curated taxon photos, then
  research-grade observations — same logic as `panels/PanelGallery`). Up to 3 images then a
  "+N more images" link; one caption line below names the taxon and the source. Loaded lazily per
  couplet via `IntersectionObserver` (300px margin) so key text always paints first;
  results are cached and de-duped per OTU for the life of the `KeyView` instance
  (`composables/useKeyImages.js`, provided as `keyImages`). Applies to both Full-key and
  Guided views.
- **Per-couplet citations** — short inline form ("Voss, 1937: 258"), click opens a popup with full formatted reference; URLs and DOIs are clickable
- **Key-level "Primary source"** line — the citation flagged as original in TaxonWorks, or falls back to the root lead's first citation
- **"References cited (N)" modal** — aggregates every distinct source used anywhere in the key, with the primary marked

### Metadata header

A visible masthead (no modal):

- **Title** — the key's title
- **Taxonomic scope** — linked to the scope OTU in a new tab when resolvable
- **Primary source** — the origin citation, rendered as a formatted reference line
- **Description** — the key's description, full text
- **Attribution** — when present
- **Chips** — count of couplets, count of terminal taxa, "updated X time ago" (when available from the public `/leads` list), and a completeness check

### Taxonomic completeness check

A chip showing the finest rank the key operates at and how many valid descendants of the scope taxon it contains. Clicking opens a detailed modal report:

- Lists every taxon at the key's target rank, grouped by intermediate ranks (e.g., subgenus)
- Marked ✓ (included in the key) or ✗ (missing)
- Missing rows emphasized in red
- Each group shows a "(N / M keyed out)" count
- Synonyms indented under their valid taxa, with authorship shown
- Every name with a known OTU is a clickable link to its taxon page (opens in new tab)
- Report works for any key structure; completeness derived from the key tree itself (couplets + taxa chip always show)

### Synonymized target names

When a couplet's target OTU is a junior synonym, it renders as "*Name as in key* [= *Valid name*]" with the valid name in muted text.

### Visual language

- Theme tokens only — no hard-coded colors, no `.pinpoint-*` CSS overrides
- Dark mode is readable (content sits on an elevated surface card in dark mode, matching other TaxonPages panels)
- Emphasis reserved for couplet numbers and taxon names; links are text-colored until hover
- Taxon links open in new tabs; in-key navigation uses app state (router.push), not page navigation

## Data

All API calls are GET, project-token authenticated, to the TaxonWorks base URL (`https://sfg.taxonworks.org/api/v1`).

| Call | Purpose |
|------|---------|
| `GET /leads/key/:id` | Couplet tree structure and per-couplet metadata (text, target type/label, figures with captions) |
| `GET /leads` | Public key roots with description, couplet/taxon counts, "updated" timestamp, scope OTU |
| `GET /citations?citation_object_type=Lead&citation_object_id[]=…&extend[]=source` | Per-couplet citations with formatted source HTML |
| `GET /otus?…` and `GET /taxon_names?…&descendants=true` | Completeness check — scope and terminal taxa with validity flags and authorship |
| `GET /otus/:id/inventory/images.json?extend[]=depictions&extend[]=attribution&extend[]=source&extend[]=citations` | Taxon-image fallback — OTU + CollectionObject + FieldOccurrence depiction images for a lead's target taxon |
| `GET /otus?otu_id[]=…` + `GET /taxon_names?taxon_name_id[]=…` (one batched pair) | Resolve terminal OTU ids → taxon name + rank, for the iNaturalist fallback query; and → `cached_html` + `cached_author_year` for name-italic / author-roman pill rendering |
| `GET https://api.inaturalist.org/v1/taxa`, `/v1/taxa/:id`, `/v1/observations` | iNaturalist fallback images when a taxon has none in TaxonWorks (external; `axios`, not `makeAPIRequest`) |

## Publishing

This folder is a complete, self-contained TaxonPages module ready for NPM distribution.

### As an installed package

1. Ensure `package.json` has:
   ```json
   {
     "name": "taxonpages-module-keys",
     "type": "module",
     "taxonpages": { "type": "module", "entry": "./router/index.js" },
     "peerDependencies": { "@sfgrp/taxonpages": "*", "vue": "^3", "vue-router": "^4" }
   }
   ```

2. Publish to NPM (scoped or unscoped; name must include `taxonpages-module-` prefix).

3. Consumers install it as a **direct** dependency (transitive dependencies are ignored during module discovery):
   ```bash
   npm install taxonpages-module-keys
   ```
   The module name `keys` is derived by stripping the `taxonpages-module-` prefix.

### Host project installation

To use this module in a TaxonPages host project:

1. Install as above.
2. Add a nav link in `config/header.yml`:
   ```yaml
   - label: Keys
     link: /keys
   ```

The module routes are automatically discovered and registered.

### Route paths

- The module uses `/key/:id` (singular) as its base path to avoid colliding with a host project's core `/keys/:id` route (first-match routing wins). 
- A host project **may disable the core `keys` module** (via discovery config) if it wants this module to own `/keys/:id` outright.
- The keys list card (`panel:keys`) is published separately (either as `taxonpages-panel-keys` or as a project override in `panels/PanelKeys/`); it is **not part of this module**.

## Known limitations

**Keys index visibility:** The `/keys` index lists only keys whose root lead is flagged publicly accessible in TaxonWorks. The API endpoint (`GET /leads`, which maps to `leads#api_index` with `is_public=true`) is the only project-wide discovery endpoint for dichotomous keys. If a key exists in TaxonWorks but does not appear on the `/keys` page, its root lead needs to be marked public in the lead editor — no code change required. Individual keys can still be accessed by ID (`/key/:id`) if you know the ID, even if not public.

## Dependencies

- **Peer:** `@sfgrp/taxonpages` (any version), `vue` (^3), `vue-router` (^4)
- **No dependency on:** `@sfgrp/pinpoint` (this is a replacement, not a wrapper)
- **Styling:** Theme tokens only; compatible with any TaxonPages theme

## Development

```bash
npm run dev              # SPA at http://localhost:5173, hash-mode routing
npm run dev:ssr         # SSR at http://localhost:6173, history-mode routing
npm run build           # Vite production build
npm run build:ssr       # SSR build
```

Test SSR couplet routing: `npm run dev:ssr` then `/key/3977/4` should render with couplet 4 selected without a hydration-mismatch warning.
