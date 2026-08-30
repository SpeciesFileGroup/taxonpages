# TaxonPages — Curculionoidea project

Git repo root: `taxa/` (i.e. `/home/jakobj/Data/01Aktuelle_Projekte/0_TaxonWorks/TaxonPagesDev/taxa`).


TaxonPages is distributed as the NPM package `@sfgrp/taxonpages`. This project consumes it — custom panels, config, and components live locally; the framework comes from `node_modules`.

API: `https://sfg.taxonworks.org/api/v1` · token in `config/api.yml`.
Dev server: `npm run dev` → http://localhost:5173/ (SPA) · `npm run dev:ssr` → http://localhost:6173/ (SSR)

## Project layout

```
taxa/
  panels/          ← custom panels (all work happens here)
  config/          ← api.yml, taxa_page.yml, style/theme.css
  components/      ← local component overrides
  node_modules/@sfgrp/taxonpages/src/  ← package source (read-only)
```

Custom panels each need a `main.js` (registers the panel id) and are wired up in `config/taxa_page.yml`.
CLI: `taxonpages package list/add/remove/unpack` manages panels and packages.

### For CLAUDE
- List of feature requests for TaxonWorks. Append if a new need is arising (ask me first): `docs/TaxonWorksWishlist.md`
- To do list for CLAUDE: `docs/Task_toDo.md`
- TaxonWorks API documentation: https://github.com/SpeciesFileGroup/taxonworks_api (local copy may be available)
- TaxonWorks source repo: https://github.com/SpeciesFileGroup/taxonworks (local copy may be avalable)

## Critical: path alias

`@/` resolves to **`node_modules/@sfgrp/taxonpages/src/`**, NOT to the local `taxa/` tree.
So `@/utils/request`, `@/components/...`, `@/constants/objectTypes` etc. all come from the package.

## Tailwind v4 — color utilities

Use `text-secondary`, `bg-secondary`, `border-secondary` (maps to `--color-secondary`).
**`text-secondary-color` is NOT a valid utility** — generates no CSS. It looks fine on `<a>` tags (browser default link color) but silently fails on `<span>`, `<div>`, `<button>`. All occurrences have been purged; do not reintroduce it.

Other useful tokens: `text-base-content`, `bg-base-foreground`, `border-base-muted`, `text-secondary-content`.

### Surface / background tokens — the vanilla scheme (theme-safe in dark + light)

The color palette is always derived from the TaxonPages package's own `VCard.global.vue` / `VModal` / `theme.css`, individual panels should never have their own color palette. Every panel and
component should follow it so dark mode stays readable:

| Role | Token |
|---|---|
| Page background (the ground the layout paints) | `bg-base-background` |
| **Panel / card / any raised surface** — where your content and text live | `bg-base-foreground` + `text-base-content` |
| Muted label / secondary text (labels only, never values) | `text-base-soft` |
| Border between surfaces | `border-base-muted` (a.k.a. `border-base-border`) |
| Nested raised block inside a card | keep it `bg-base-foreground` and separate it with a **border** — or `bg-base-muted`. Never a different fill just for "depth". |
| Accent / link text | `text-secondary` (standing `text-base-content`, `hover:text-secondary` for in-content links) |

**Rules that keep dark mode legible:**
- **Never put content on `bg-base-background`.** In dark mode it is near-black; text sitting
  directly on it (especially default `text-base-content` / white) is white-on-black and reads
  as broken. Content always sits on `bg-base-foreground`.
- **Don't distinguish sibling cards by fill.** Same `bg-base-foreground`, separated by a
  border (optionally a subtle `--tp-card-shadow`). A "recessed" darker fill inverts in dark
  mode. (This is why `modules/keys/components/GuidedChoice.vue` was reverted from
  `bg-base-background` to `bg-base-foreground` — 2026-08-30.)
- **`*-content` colors are text-on-fill only.** `text-secondary-content` / `text-primary-content`
  are white and are only legible *on* `bg-secondary` / `bg-primary`. On a card they are
  invisible (white-on-white in light mode). Use `text-secondary` / `text-base-content` instead.

### Every colour is a theme token — no literals

Enforced across `panels/` `components/` `modules/` as of 2026-08-30 (audit + purge).

**Never use:**
- Tailwind's default palette — `text-red-500`, `bg-blue-600`, `text-gray-400`, … (any
  `<util>-<colour>-<number>`). Every one is a fixed sRGB value that ignores the theme.
- hex / `rgb(...)` / `hsl(...)` literals in `.vue` / `.js` / `style` blocks.
- arbitrary colour values — `bg-[#4c9c2e]`, `text-[rgb(...)]`.

**Use instead** — the token utilities the package's `@theme` generates (all resolve to a
package `--tp-*` var; the whole set is re-tintable from `config/style/theme.css`):

| Purpose | Utilities |
|---|---|
| Surfaces / text / borders | `*-base-background`, `*-base-foreground`, `*-base-content`, `*-base-soft`, `*-base-muted`, `*-base-border`, `*-base-lighter` |
| Brand | `*-primary`, `*-primary-content`, `*-secondary`, `*-secondary-content` |
| Status | `*-danger`, `*-success`, `*-warning` (package-provided — portable to any TaxonPages repo) |
| Map categories | `*-map-georeference`, `*-map-aggregate`, `*-map-asserted`, `*-map-type-material`, `*-map-collection-object`, `*-map-field-occurrence` |
| Chrome | `*-footer-*`, `*-scrollbar-*`, `*-card-shadow`, `*-card-border`, `*-tree-line` |

**One carve-out:** `text-white` is allowed *only* as the label colour on a saturated status
fill (`bg-danger`/`bg-success`/`bg-warning`) or a map-category disc — this is what the
package's own `VButton` solid variants do. Never `text-white` on a `base-*` surface.

**A colour a panel needs that has no package token** (e.g. a brand green, a data-series
accent): do **not** add it to `config/style/theme.css` or `config/vendor/tailwind.css`
`@theme` — a distributed panel wouldn't carry those, so the class would generate no CSS.
Instead put a plain CSS custom property in a `*-tokens.css` beside the panel and import it
from the panel:
- generic → `panels/_shared/panel-tokens.css`; feature-scoped → e.g. `panels/_gbifShared/gbif-tokens.css`
- prefix `--pp-` ("project panels"), define in `:root` **and** `.dark`
- consume as `var(--pp-<name>)` via inline `:style` or a scoped class — never a `bg-*`/`text-*` utility
- a host repo can still retint it by redefining `--pp-<name>` in its own `:root`

Existing: `--pp-accent-identified` (phenology "Identified" series), `--pp-gbif` (GBIF green).

## Vue whitespace condensing — rendering spaces between elements

Vite compiles Vue templates with `whitespace: 'condense'`. This silently strips:
- whitespace-only text nodes between elements
- leading/trailing whitespace in text nodes adjacent to block/virtual elements (`<template>`, `<em>`, `<RouterLink>`, etc.)

**Symptom**: "WordAuthor, Year" runs together with no space — most common when splitting a name into an `<em>` part and an authorship plain-text suffix.

**Wrong approaches** (both fail):
```html
<!-- space stripped between </template> and text node -->
<template v-if="plain"> {{ plain }}</template>

<!-- leading space stripped from text interpolation adjacent to element -->
{{ plain ? ' ' + plain : '' }}
```

**Correct fix**: move anything after a Vue element into a `<span v-html>`. Build the suffix as a computed HTML string (starting with `' '`) and escape user data with a small `escHtml` helper:
```js
function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
const labelSuffix = computed(() => {
  // … build HTML string starting with ' ' …
  return parts.length ? ' ' + parts.join(' ') : ''
})
```
```html
<template v-else>{{ name.italic }}</template><span v-html="labelSuffix" />
```

Note the `<template>` closing tag and `<span>` opening tag are on the **same line** with no whitespace between them — that ensures the italic part and the span touch at exactly one boundary, which Vue condense does not strip.

## makeAPIRequest

Axios instance pre-configured with TaxonWorks base URL and `project_token`. Imported from `@/utils/request` or `@/utils`.

```js
import { makeAPIRequest } from '@/utils/request'

// As a function (GET shorthand used in the package):
makeAPIRequest('/collection_objects/123/dwc')

// As axios instance (preferred in custom panels):
makeAPIRequest.get('/images', { params: { per: 10, extend: ['depictions'] } })
makeAPIRequest.get(`/citations?${params}`)
```

**Use only for the TaxonWorks API.** For external APIs (iNaturalist, GRSciColl) use `axios` directly or `fetch`.

### Known API gap — institution names
TaxonWorks stores repositories internally (collection objects have a `repository_id`) but does **not** expose them via the public API. There is no `/repositories` endpoint and no `extend[]=repository` option on collection objects. The DWC endpoint only returns `institutionCode` (abbreviation, e.g. `"ZMUH"`) and `institutionID` (a GRBio URL). To resolve a full institution name, use GRSciColl (see `panels/_shared/DwcTable.vue` for the lookup implementation).

## Global components (no import needed)

VModal, VCard, VCardHeader, VCardContent, VSpinner, VButton, VPagination, VTable (+ cell/row variants),
IconClose, IconPlusCircle, IconSearch, RouterLink, ClientOnly, ImageViewer, GalleryImage, GalleryThumbnailList.

Full list in README.md.

VModal usage:
```html
<VModal @close="myRef = null">
  <template #header><div class="text-sm font-medium">Title</div></template>
  <div class="px-4 pb-4 text-sm" v-html="content" />
</VModal>
```
When inside a fixed overlay (like GalleryViewer), wrap in `<Teleport to="body">`.

## TaxonWorks depiction types

| `depiction_object_type` | Meaning | Name source |
|---|---|---|
| `Otu` | Direct OTU depiction | `dep.label` before `: ` |
| `CollectionObject` | Specimen image | DWC `/collection_objects/:id/dwc` → `scientificName` |
| `FieldOccurrence` | Field occurrence image | DWC `/field_occurrences/:id/dwc` → `scientificName` |
| `CollectingEvent` | Collecting event (ignore) | — |
| `null` / `undefined` | Synthetic (e.g. iNat) | `dep.label` is the taxon name |

**CO `dep.label` is a catalog identifier** (`"CollectionObject 123; uuid: (CollectionObject)."`) — never use it as a display name. Always use `scientificName` from the DWC endpoint.

**OTU `dep.label` format**: `"Genus species Author Year: figure description. (Otu)."` — name is everything before `: `.

## DwcTable component

Lives in `panels/_shared/DwcTable.vue` — shared across panels (same pattern as `panels/_gbifShared/`: a `_`-prefixed folder with no `main.js`, so the panel loader ignores it; plain relative imports pull it into whichever panel needs it).

**Depended on by:**
- `panels/PanelMapV2/PanelMapV2.vue` — marker/list-row "show details"
- `panels/PanelMapV2/components/Search/OtuSearch.vue` — search result rows
- `panels/PanelGallery/GalleryViewer.vue` — image viewer overlay; wrap in `<Teleport to="body">` since GalleryViewer itself renders inside a fixed-position overlay
- `panels/PanelBiologicalAssociationsV2/PanelBiologicalAssociationsV2.vue` — subject/object "ⓘ" button

If you change this file, check all four call sites — none of them keep their own copy.

Exposes: `show({ id, type })` where `type` is `'CollectionObject'` or `'FieldOccurrence'`.

**Layout** (redesigned 2026-08-25 — "specimen label" reading order, not a flat field list): identity block right under the header — name (linked, italic), type-status badge, "Identified by", "Held at" (repository), prior-determination history, media thumbnails, in that order. Then an always-visible `Location` section that also carries `Recorded by`/`Date` (collection-event fields live there, not in the identity block — locality must never be duplicated or misattributed by sitting next to a bare place name). Then `Biological associations` (see below). Everything else — catalog provenance, secondary ID paperwork, georeference protocol, morphology — is behind a single `<details>` "More details" disclosure.

**Contrast rule:** only `<dt>` labels / section headers may be faint gray (`opacity-40/50`, `text-base-soft`). Actual field values are always full-contrast text — this was an explicit correction from the user after values were originally styled too faint.

**Repository/"Held at" resolution:** `institutionCode` and `collectionCode` are resolved separately via GRSciColl (GBIF API) — they're different record types (e.g. code `"NHRS"` resolves to institution "Swedish Museum of Natural History" *and*, confusingly, a collection called "Department of Entomology"). Falls back to the raw code when GRSciColl has no single unambiguous match (private/unregistered collections, e.g. a personal collection code, will never resolve this way — there is no public API for TaxonWorks' own `repository_id`/`/repositories` records, confirmed 404 on both the API and the web app without login).

**Biological associations section:** shows associations this specific CO/FO participates in, *including* ones only reachable through a wrapping `AnatomicalPart` (a nidus, an egg, ...) — flagged by the user as important, easy to miss otherwise. No server-side filter exists for "associations of the specimen an AnatomicalPart wraps", so it fetches every association for the specimen's OTU (`otu_query[otu_id][]=X`, usually a handful of records) and matches client-side using `resolveSpecimenRef()` from `panels/_shared/specimenRef.js` — the same helper the BA panel uses to go the other direction (AnatomicalPart → wrapped specimen). When our side is an AnatomicalPart, its part name prefixes the relationship reading, e.g. **"egg collected from *Corylus avellana*"**, not just "collected from ...".

**For database maintainers:** "More details → Record" always shows the TaxonWorks numeric ID as a single clickable row linking to `{TW_BASE}/collection_objects/:id` or `/field_occurrences/:id` (verified this route pattern against the app's own known-working `/otus/:id` convention — same redirect-to-login signature when unauthenticated). `TW_BASE` is derived from `__APP_ENV__.url` (strip the `/api/v1` suffix) — same global used elsewhere (e.g. `PanelGallery.vue`), no import needed.

**`associatedMedia` URL format**: pipe-separated absolute URLs like `https://sfg.taxonworks.org/api/v1/images/aa7639596f6a04744668dbec7c7493a3` (hex fingerprint, not numeric ID). To fetch via `makeAPIRequest`, extract the path with `/\/api\/v1(.+)/` and call `makeAPIRequest.get(m[1])`. The response has `{ id, thumb, original, medium, ... }` at the top level.
Import example (from `panels/PanelBiologicalAssociationsV2/`): `import DwcTable from '../_shared/DwcTable.vue'`

## specimenRef.js

`panels/_shared/specimenRef.js` — exports `isSpecimenType(type)` and `resolveSpecimenRef(entity)`. Resolves a biological-association subject/object entity to the physical CollectionObject/FieldOccurrence it refers to, even when the entity is an `AnatomicalPart` wrapping one (parses `"nidus: FieldOccurrence 4996; <uuid>; ..."`-style `object_label` text — TaxonWorks never exposes the wrapped specimen as a structured field). Depended on by `PanelBiologicalAssociationsV2/makeBiologicalAssociation.js` (locality/collector lookup, the "ⓘ" button), `_shared/DwcTable.vue` (finding associations reachable via a wrapping AnatomicalPart), and `PanelSpecimenOccurrences/components/SingleSpeciesOccurrences.vue` (indexing every association for the OTU once to show the primary one inline on each list row). If you change it, check all three call sites.

## Institution name lookup

The TaxonWorks DWC response has `institutionCode` (abbreviation, e.g. `"ZMUH"`) and `institutionID` (a GRBio URL, e.g. `"http://grbio.org/institution/..."`).

To get the full institution name, use the GRSciColl API (public, CORS-enabled):
```js
// Precise: use institutionID as identifier (returns exactly one result if registered)
fetch(`https://api.gbif.org/v1/grscicoll/institution?identifier=${encodeURIComponent(institutionID)}`)

// Fallback: search by code (may return multiple results — handle ambiguity)
fetch(`https://api.gbif.org/v1/grscicoll/institution?code=${encodeURIComponent(code)}`)
// Response: { results: [{ name: "Zoologisches Institut...", code: "ZMUH" }, ...] }
```

**Open issue**: what to display when the code search returns multiple matches — noted in `to do.txt`, pending developer input on whether a `/repositories` endpoint will be added.

## GalleryViewer (panels/PanelGallery/)

- `parsedDepictions`: three-pass computed (OTU first, then CO/FO, then iNat synthetic). CO/FO name suppressed when an OTU depiction is present on the same image (they'd be the same name — showing twice is confusing).
- `dwcCache = reactive({})`: keyed by `depiction_object_id`. Vue 3 reactivity triggers recompute when properties are assigned.
- DWC prefetched for current image ± 1 on index change.
- iNat fallback images have `depictions: [{ label: taxonName }]` with no `depiction_object_type`.

## Image store (useImageStore)

Fetches `/otus/:id/inventory/images.json` with `extend: ['depictions', 'attribution', 'source', 'citations']`. Images already have `citations` array.

The subordinate-taxa fallback in `PanelGallery.vue` must also pass `extend: ['depictions', 'attribution', 'source', 'citations']` to carry citation data through.

## OTU route

```js
{ name: 'otus-id', params: { id: otuId } }
```
