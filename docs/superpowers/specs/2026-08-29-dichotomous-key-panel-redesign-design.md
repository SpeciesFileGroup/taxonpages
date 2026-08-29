# Dichotomous key panel — redesign

**Date:** 2026-08-29
**Branch:** setup
**Status:** design — awaiting review

## 1. Context

TaxonPages renders dichotomous ("lead"/couplet) keys through two package pieces:

- `panel:keys` → `modules/otus/components/Panel/PanelKeys/PanelKeys.vue` — a small card on
  the OTU overview listing available keys (dichotomous + observation matrices), linking out.
- `/keys/:id` → `modules/keys/views/keyId.vue` — a full page that hands everything to the
  third-party `@sfgrp/pinpoint` `<VuePinpoint>` component and styles it via `.pinpoint-*`
  CSS overrides. A metadata modal (`MetadataModal.vue`) hides title/citation behind a small ⓘ.

`@sfgrp/pinpoint` is a ~300-line thin client over a single API call. Its only slots are
`title`, `target`, and two button labels — there is **no slot for figures** (its `FigureList`
is internal) and **none for per-couplet citations**, and it only offers one view (an
interactive step-through). Every improvement below requires replacing it.

### Observed problems (from a live render of key #3977 "Key to the species of Adosomus")

1. **Downstream wall of text.** Pinpoint previews each choice by dumping the full lead text
   of *every* couplet below it. The user cannot answer the one question they have at a
   couplet — "which taxa lie down this branch?" — without reading paragraphs.
2. **Everything is blue.** The entire downstream preview is rendered in link colour, so the
   couplet is a wall of blue. Emphasis is spent on the least important text.
3. **Targets navigate in place.** Clicking a taxon replaces the page, losing the reader's
   position in the key.
4. **Key metadata is hidden.** Title and origin citation sit behind a modal; `description`
   (e.g. "Original language German, translated by Jakob Jilg in 2026") is not shown at all.
5. **No figures, no per-couplet citations**, though the data supports both.

## 2. Goals / non-goals

### Goals

- Replace the pinpoint renderer with a local, themeable, **NPM-distributable** module.
- Two reading formats with a persisted toggle: **Guided** (step-through) and **Full key**
  (classic numbered list).
- Guided mode answers "which OTUs are down this route?" directly; no downstream text dump.
- Per-couplet **figures** with thumbnail → lightbox.
- Per-couplet and key-level **citations**: short verbatim form inline, full reference on click.
- Prominent metadata header (title, taxonomic scope, description, origin citation,
  attribution, freshness/size chips) — no modal.
- Taxon links open in a new tab; in-key movement is app state, not navigation.
- Visual language consistent with TaxonPages: framework components + theme tokens only;
  emphasis reserved for couplet numbers and terminal taxa; links are text-coloured until
  hover.

### Non-goals

- Redesigning the **interactive / multi-access (matrix) key** (`@sfgrp/distinguish`). That is
  a full application (descriptors, state filters, layout modes), not a thin client. It is
  forked here only as a thin local wrapper for routing/theming parity; a real redesign is a
  separate future project using the same "local module → publishable package" pattern.
- Server-side or authored changes to TaxonWorks. All data is read-only via the public
  project-token API.
- Editing anything under `node_modules/@sfgrp/taxonpages`.

## 3. Architecture

### 3.1 Local module, publishable later

New project-local module, auto-discovered via `~/modules/**/router/*.js` (same mechanism as
`panels/`; confirmed in `src/plugins/vite/discoverPackages.js` and `src/router/index.js`):

```
taxa/modules/keys/
  package.json            ← taxonpages manifest (see 3.4); not consumed locally, present for publish
  README.md               ← what it is, how to publish
  router/index.js         ← route registration: { name: 'dichotomous-key', path: '/key/:id/:couplet?' }
  KeyView.vue             ← route component: 3 API calls, format state, view switch (no separate store)
  lib/
    tree.js               ← pure, Node-tested: buildNodes, orderedCouplets, descendantOtus, breadcrumb, childChoices, coupletByNumber
    format.js             ← resolveFormat (pure) + readFormat/writeFormat (localStorage, SSR-guarded)
  components/
    KeyHeader.vue
    FormatToggle.vue
    GuidedView.vue        ← current couplet (derived from :couplet) + breadcrumb + choices
    GuidedChoice.vue      ← one lead: decision text, figures, citation, "leads to" line
    FullKeyView.vue       ← numbered couplet list; id="couplet-N" + RouterLink-to-:couplet jumps
    LeadText.vue          ← lead text + inline short citation, shared by both views
    LeadFigures.vue       ← thumbnail row → KeyLightbox
    ReachableTaxa.vue     ← "leads to N species: …" with disclosure for large sets
    CoupletCitation.vue   ← short form + click-through popup (VModal)
    KeyLightbox.vue       ← keys-local image viewer (overlay, prev/next, caption, Esc, focus-trap)
    TaxonLink.vue         ← <RouterLink target="_blank"> to otus-id, italic label
```

The forked list card is a **separate** unit (a module's `router/index.js` can only add routes,
not panels):

```
taxa/panels/PanelKeys/
  main.js                 ← id: 'panel:keys' (local wins over the npm panel)
  PanelKeys.vue           ← forked list card; dichotomous keys link to the local route
```

### 3.2 Route — one URL per couplet

```js
// modules/keys/router/index.js
export default [
  { name: 'dichotomous-key', path: '/key/:id/:couplet?',
    component: () => import('../KeyView.vue') }
]
```

- `/key/:id` — the whole key (Guided starts at couplet 1; Full key from the top).
- `/key/:id/:couplet` — a specific couplet, e.g. `/key/3977/4`. Canonical, shareable,
  bookmarkable. `:couplet` is the couplet **number** (may be a curator string such as `A`,
  matched string-safe against the ordered couplet list; unknown values fall back to the root
  couplet, no error).
- Composes with the format query param: `/key/3977/4?format=full`.

**Why a path segment, not a hash.** The couplet must resolve identically under SSR and CSR.
Browsers never send the URL fragment (`#…`) to the server, so a hash-based couplet would
render couplet 1 on the server for every deep link and only correct itself after client
hydration. `route.params.couplet` is populated the same way during the SSR render and on the
client, so the server emits the right couplet's HTML. No hash is used anywhere; the path
param is the single source of truth. (A query param would also be SSR-visible; a path segment
is chosen because "a distinct URL per couplet" reads best and it needs no extra route shape.)

**Navigation.** In Guided mode, descending / breadcrumb / back all call
`router.push({ name: 'dichotomous-key', params: { id, couplet } })` rather than mutating local
state, so the URL always reflects the current couplet and browser **Back walks up the key**.
In Full-key mode, a set `:couplet` scrolls that couplet's section into view on mount / on
change (client-only, guarded); every couplet section carries `id="couplet-<number>"`.

Vue Router assembles `[...dynamicRoutes, ...coreModuleRoutes, ...userModuleRoutes]` and
first-match wins, so a local module cannot transparently reclaim the core `/keys/:id` path.
The redesign lives at the sibling path `/key/…`; the forked `PanelKeys.vue` links there;
the core `/keys/:id` route stays registered but unreferenced.

*(Base path `/key` is cosmetic and trivially changed. If a future consumer wants to supersede
`/keys/:id` outright, the host project disables the core `keys` module via the discovery
`disabled` option — documented as an install note, not relied on here.)*

### 3.3 SSR

`npm run dev:ssr` runs the app SSR. Requirements:

- **Couplet selection is route-driven.** Both views derive their position from
  `route.params.couplet` — no `window` / `location` / hash access — so the SSR render and the
  client render select the same couplet for a given URL.
- `KeyView.vue` fetches client-side with a spinner during SSR (matching the current
  `keyId.vue`, which is entirely `<ClientOnly>`); the couplet the URL points at is still
  deterministic. Full SSR data-fetching is out of scope but nothing here blocks adding it.
- `?format=` (query) is SSR-visible and wins in `resolveFormat`. The `localStorage`-persisted
  format preference is a **client-only, post-mount** enhancement — applied in `onMounted`, so
  a stored preference that differs from the server default produces at most a one-frame swap
  on the client, never a hydration-mismatch error.
- `KeyLightbox` and `lib/format.js` guard every `window` / `localStorage` / `document`
  access; the lightbox overlay renders client-only (`<ClientOnly>` + `<Teleport>`).

### 3.4 Distributability constraints (design rules, enforced from day one)

- **No imports from project-local paths** (`panels/`, `config/`, `_shared/`). Everything the
  module needs is under `modules/keys/`. This is also why a keys-local lightbox (not a shared
  `panels/_shared` one) is correct — a shared viewer would not travel with the package.
- Imports limited to `@/…` (framework src) and standard libraries. `@sfgrp/taxonpages` and
  `vue` are **peer** dependencies. No dependency on `@sfgrp/pinpoint` (removed).
- Styling uses only theme tokens present in every TaxonPages theme
  (`--tp-*`, `text-base-content`, `bg-base-foreground`, `border-base-muted`, `text-secondary`,
  `--tp-card-shadow`). No project CSS, no `.pinpoint-*` overrides.
- `package.json` manifest for later publish:
  ```json
  {
    "name": "taxonpages-module-keys",
    "taxonpages": { "type": "module", "entry": "./router/index.js" },
    "peerDependencies": { "@sfgrp/taxonpages": "*", "vue": "^3" }
  }
  ```
  `extractBaseName` strips the `taxonpages-module-` prefix → registers as module `keys`.
  Discovery only trusts **direct** dependencies, so an installed package is picked up only
  when the consumer adds it explicitly.
- The `PanelKeys` fork is publishable independently as `taxonpages-panel-keys`, or can remain
  a project override. Not bundled with the module.

## 4. Data

All calls are GET, project-token auth, base `https://sfg.taxonworks.org/api/v1`.

| # | Call | Purpose |
|---|------|---------|
| 1 | `/leads/key/:id` | `metadata` (`title`, `origin_citation` HTML, `attribution`, `taxonomic_scope`), `data.entries` (couplet tree: `children`, `parent_id`, `position`, `couplet_number`, `depth`), `data.leads` (`text`, `target_label`, `target_id`, `target_type`, `position`, and `figures[]` — `thumb`, `medium`, `original_png`, `caption`, `figure_label`, `position` — when depictions exist) |
| 2 | `/leads` | list of public key roots; match `id` → `description`, `couplets_count`, `otus_count`, `key_updated_at_in_words`, `otu_id` (none of these are in call 1) |
| 3 | `/citations?citation_object_type=Lead&citation_object_id[]=<every lead id>&extend[]=source` | per-lead citations: `source.author_year` ("Voss, 1937"), `pages`, `citation_source_body` ("Voss, 1937:258"), `source.cached` (full formatted HTML reference) |

Orchestration: call 1 first (drives the tree). Calls 2 and 3 fire in parallel immediately
after (3 needs the lead ids from 1). Header and couplet text render as soon as 1 resolves;
citations and the description/chip row fill in when 2/3 land. `original_png` needs
`?project_token=` appended (per pinpoint: strip the leading 8 chars, prefix `${baseUrl}/`).

`lib/tree.js` provides (pure, Node-tested; `KeyView.vue` owns fetch + state):
- ordered couplet list (depth-first, `position`-sorted) with stable couplet numbers
  (`origin_label` when present, else sequence);
- for each node, the set of **descendant terminal OTUs** (`{ id, label }`, leaf leads with
  `target_type: '/api/v1/otus'`), deduped and name-sorted;
- breadcrumb path root→node for the Guided view;
- `coupletByNumber(value, nodes)` — the couplet node whose number matches `value`
  (string-safe: `String(n.coupletNumber) === String(value)`), or `null`; used to turn a
  `:couplet` route param into a node in both views.

## 5. Formats

`FormatToggle.vue` — segmented control in the header. Preference persisted per-viewer in
`localStorage` (`taxonpages:key-format`), SSR-guarded, default **Guided**. `?format=full`
query param overrides (shareable links, print).

### 5.1 Guided view

One couplet at a time (`GuidedView.vue`). The displayed couplet is a function of the route:
`route.params.couplet` → `coupletByNumber` → node; absent or unknown → root couplet. The
component holds no independent "current couplet" state.

- **Breadcrumb** — the path taken so far (`breadcrumb(currentId, nodes)`), each step
  "Couplet N". Rendered as `RouterLink` to `{ params: { id, couplet: N } }` — text-coloured,
  hover reveals it is interactive; a real `<a href>` so middle-click opens that couplet in a
  new tab.
- **Current couplet** — heading "Couplet N"; an "↑ back" control (RouterLink to the parent
  couplet) when not at the root.
- **Choices** (`GuidedChoice.vue`, one per child, in a responsive grid):
  - the **decision**: full lead text (`LeadText.vue`) — this is the only place couplet text
    is read, in normal body colour;
  - `LeadFigures.vue` thumbnails, if any;
  - inline short citation ("Voss, 1937: 258"), if any → `CoupletCitation.vue`;
  - a **"leads to" line** (`ReachableTaxa.vue`):
    - choice points straight at an OTU → that taxon, italic, linked, new tab;
    - choice points at another couplet → "→ Couplet M · leads to K species", with the K
      taxon names behind a disclosure (inline when K is small). Names italic, linked, new tab.
  - choosing a child that is a couplet does `router.push({ params: { id, couplet: M } })`, so
    the URL becomes `/key/:id/M` and browser **Back walks up the key**; a terminal choice
    shows the taxon (already linked).
- **No downstream couplet text is ever previewed.** The reader descends to read it.

```
Couplet 3  ›  from Couplet 1                                   [Up]

┌─ ③ ──────────────────────────────┐  ┌─ ⑥ ──────────────────────────────┐
│ Median portion of the pronotal   │  │ Median portion of the pronotal   │
│ base produced towards the        │  │ base not produced toward the     │
│ scutellum …to the elytral apex.  │  │ scutellum. Inner interstices     │
│                        🖼  🖼      │  │ granulate in the basal half only.│
│ → Couplet 4 · leads to 4 species │  │ → Couplet 6 · leads to 3 species │
│   ▸ A. mongolicus, A. granulosus,│  │   ▸ show names                   │
│     A. karelini, A. samsonowii   │  │                                  │
└──────────────────────────────────┘  └──────────────────────────────────┘
```

### 5.2 Full key view

`FullKeyView.vue` — the classic scannable layout:

- numbered couplet list, each couplet a block: `N.` then its leads as `—`-separated lines;
- each couplet section carries `id="couplet-<number>"` (the scroll target);
- each lead: text, then its target — a couplet number or a taxon (italic, linked, new tab);
- a couplet-number target and the "from N" back-reference are `RouterLink`s to
  `{ params: { id, couplet: N } }` (no hash — consistent with §3.2, real `<a href>` for
  middle-click); when the `:couplet` param changes, `FullKeyView` scrolls
  `#couplet-<number>` into view (client-only, guarded). "from N" back-references follow
  TaxonWorks' own `print_key_markdown`.
- figures thumbnails inline under the lead; short citation at end of the lead line;
- print stylesheet: drop interactive chrome, black text, no underlines.

Length is the only issue here and it is inherent; structure + weight (numbers, taxa) +
anchors address it. No "leads to" summarisation in this mode — the list *is* the summary.

## 6. Figures & lightbox

`LeadFigures.vue`: horizontal thumbnail row, fixed height (~5rem), `object-contain`,
`figure_label` as caption line beneath when present. Click → `KeyLightbox.vue`.

`KeyLightbox.vue` (keys-local, ~120 lines, modelled on `GalleryViewer.vue`'s shell minus its
gallery-specific metadata):
- fixed overlay, `z` above header, backdrop blur, `bg-base-foreground`;
- image set = the figures of that one lead; index state;
- prev/next (reuse `@/components/ImageViewer/ControlImage{Next,Previous}.vue`), keyboard
  ←/→/Esc, focus trap, restore focus on close, `body` scroll lock;
- shows `medium` (falls back to `original_png`), `figure_label` + `caption` beneath,
  counter "n / m", thumbnail strip when >1;
- `<Teleport to="body">`, client-only.

## 7. Metadata header

`KeyHeader.vue` — a masthead block, always visible, no modal:

- **Title** — `metadata.title`, large heading.
- **Taxonomic scope** — `metadata.taxonomic_scope` label; linked to the OTU
  (`{ name: 'otus-id', params: { id: otu_id } }`, from call 2) when resolvable, new tab.
- **Description** — `description` from call 2, full text, normal contrast.
- **Origin citation** — `metadata.origin_citation` (already formatted HTML), rendered as the
  reference line; click opens the same `CoupletCitation` popup style for consistency.
- **Attribution** — `metadata.attribution` when present.
- **Chips** — `key_updated_at_in_words` ("updated 6 months ago"), `couplets_count`
  ("7 couplets"), `otus_count` ("9 taxa"). Faint, small, `border-base-muted`.
- `FormatToggle` sits at the header's trailing edge.

Contrast rule (consistent with `DwcTable`): only labels/section headers may be faint;
every actual value is full-contrast.

## 8. Visual language

- Framework components where they fit (`VCard`, `VCardHeader`, `VCardContent`, `VModal`,
  `VSpinner`, `RouterLink`). Couplet blocks use the card surface tokens
  (`bg-base-foreground`, `border` `--tp-card-border`, `--tp-card-shadow`) the current
  `.pinpoint-*` CSS already targets — now applied on real elements.
- **Links are text-coloured by default.** `hover:` reveals affordance (underline +
  `text-secondary`). This is the fix for the "wall of blue": in-key jump targets (breadcrumb
  steps, couplet anchors) get no standing colour at all — only hover. Genuine outbound taxon
  links may carry a subtle standing treatment (italic name, faint underline) but never a
  saturated blue block.
- **Standing emphasis is reserved for**: couplet numbers (badge/weight) and terminal taxon
  names (italic, medium weight). Lead text is plain body. Figure labels, citations, chips are
  secondary (`text-base-soft` / reduced size).
- All taxon `target_type: '/api/v1/otus'` links: `target="_blank" rel="noopener"` (via
  `<RouterLink target="_blank">` or a resolved `href`).
- Dark and light both covered by tokens; verified against the screenshot's dark theme.

## 9. PanelKeys fork

`panels/PanelKeys/PanelKeys.vue` — behaviourally the package card (same
`TaxonWorks.getKeys` / `useOtuPageRequest` data), with:
- dichotomous key rows link to `{ name: 'dichotomous-key', params: { id } }`;
- observation-matrix rows unchanged (`interactive-keys-id` / `image-matrices-id`);
- same `VCard`/`VTable` structure and `Keys (n)` header.
`main.js` exports `id: 'panel:keys'`; local discovery overrides the npm panel (a build
warning to that effect is expected and benign).

## 10. Interactive / matrix key

`modules/interactiveKeys/` — thin local fork of the package view (`VueInteractiveKey` from
`@sfgrp/distinguish` + `ImageMatrixButton`), same `:root` token mapping and `.distinguish-*`
overrides as today. Purpose: own the file for routing/theming parity and future work. **No
behavioural redesign in this plan.** Route name/path kept distinct from the core module for
the same first-match reason (`interactive-key` / `/interactive-key/:id`), `PanelKeys` fork
points matrix rows at it.

*(If the interactive key is not to be touched at all in this iteration, this section and its
commit are dropped — flagged as an open question.)*

## 11. Open questions / assumptions

1. **Route** `/key/:id/:couplet?` — base path `/key` cosmetic; the optional `:couplet`
   segment gives one URL per couplet, SSR- and CSR-resolvable (§3.2). Assumed acceptable.
2. **Two formats** (Guided + Full key); indented-tree format deferred. Assumed.
3. **Interactive key** — assumed "thin fork only, no redesign". If even the thin fork is
   unwanted this round, drop §10.
4. **`/leads` returns every public key root** including #3977 with the needed
   `description`/counts — confirmed for this project. If a future key is not `is_public`, the
   header degrades gracefully (title + citation from call 1 only).
5. Per-couplet citations currently exist only on the root of #3977. The design renders
   whatever call 3 returns per lead; the curator adding more is the intended workflow.

## 12. Commit sequence

Each step builds, is revertible, and is committed on its own.

1. Scaffold `modules/keys/` — route `/key/:id/:couplet?`, `KeyView.vue` shell,
   `lib/tree.js` (incl. `coupletByNumber`) with call 1 only; renders raw couplet list.
2. `KeyHeader.vue` + call 2 wiring (title, scope, description, origin citation, chips).
3. `FullKeyView.vue` — numbered list, `id="couplet-N"` + RouterLink-to-`:couplet` jumps,
   scroll-into-view on param change, taxon links (new tab), theme tokens.
4. `LeadFigures.vue` + `KeyLightbox.vue` — figures in Full key view.
5. `CoupletCitation.vue` + call 3 — inline short form + popup, in header and Full key view.
6. `GuidedView.vue` / `GuidedChoice.vue` / `ReachableTaxa.vue` + `FormatToggle.vue` +
   `lib/format.js` — the step-through (current couplet derived from `:couplet`, navigation
   via `router.push`), descendant-OTU "leads to" lines, persisted toggle.
7. Visual pass — link-on-hover treatment, emphasis on numbers/taxa, print stylesheet,
   dark/light check.
8. `panels/PanelKeys/` fork — wire the list card to the local route.
9. `modules/interactiveKeys/` thin fork (if in scope).
10. `modules/keys/package.json` manifest + module README documenting the publish path.
