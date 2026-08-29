# Dichotomous Key Panel Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `@sfgrp/pinpoint` dichotomous-key renderer with a local, NPM-distributable `modules/keys/` package offering a Guided and a Full-key view, per-couplet figures + citations, a visible metadata masthead, new-tab taxon links, and a "leads to" reachable-taxa summary instead of pinpoint's downstream wall of text.

**Architecture:** A project-local Vue module (`modules/keys/`, auto-discovered via `~/modules/**/router/*.js`) registers a route `/key/:id`. Its route component `KeyView.vue` makes three read-only API calls and pipes the result through a pure, Node-tested transform module (`lib/tree.js`) into presentational components. A thin fork of the interactive/matrix-key view (`modules/interactiveKeys/`) and the keys list card (`panels/PanelKeys/`) are created so routing and links point at the local pieces. No files under `node_modules/` are touched.

**Tech Stack:** Vue 3 `<script setup>`, Tailwind v4 utility classes + TaxonPages theme tokens, `makeAPIRequest` (axios instance, auto-adds `project_token`) from `@/utils/request`, global components (`VCard`, `VModal`, `VSpinner`, `VButton`, `RouterLink`, `ClientOnly`, `IconClose`). No test framework in this repo — pure logic is verified with a throwaway Node script (per this repo's convention, see `CLAUDE.md` and the prior plan `2026-08-26-merge-specimen-occurrence-panels.md`); UI is verified manually in the browser with `npm run dev` (SPA, http://localhost:5173/) and compile-checked with `npm run build`.

**Spec:** `docs/superpowers/specs/2026-08-29-dichotomous-key-panel-redesign-design.md` — read it alongside this plan.

## Global Constraints

- **No imports from project-local paths** (`panels/`, `config/`, `_shared/`) inside `modules/keys/`. Only `@/…` (framework src), `vue`, and files within `modules/keys/` itself. This keeps the module publishable as `taxonpages-module-keys`.
- **No dependency on `@sfgrp/pinpoint`** anywhere in the new code.
- **Styling: theme tokens only** — `text-base-content`, `bg-base-foreground`, `border-base-muted`, `text-base-soft`, `text-secondary`, `text-secondary-content`, `--tp-card-shadow`, `--tp-card-border`. Never `text-secondary-color` (generates no CSS — see `CLAUDE.md`).
- **Links are text-coloured until hover.** In-key jump targets (breadcrumb steps, couplet-number jumps, "from N") carry no standing colour — only `hover:underline hover:text-secondary`. Outbound taxon links may carry a subtle standing treatment (italic name, `hover:underline`) but never a saturated colour block.
- **Every taxon target** (`target_type === '/api/v1/otus'`) opens in a new tab: `target="_blank" rel="noopener"`.
- **Standing emphasis reserved for**: couplet numbers and terminal taxon names. Lead text is plain body. Citations, figure labels, chips are secondary (`text-base-soft`, smaller).
- **Contrast rule** (as in `DwcTable`): only labels / section headers may be faint; every actual value is full-contrast.
- **Route** `{ name: 'dichotomous-key', path: '/key/:id/:couplet?' }`. `:couplet` is the couplet **number** (string-safe; may be a curator label like `A`). One URL per couplet, resolvable identically under SSR and CSR — **no URL hash anywhere** (browsers don't send the fragment to the server). Both views derive their position from `route.params.couplet` via `coupletByNumber`; unknown/absent → root couplet, no error. Guided navigation is `router.push({ params: { id, couplet } })` so browser Back walks up the key. The core `/keys/:id` route stays registered but unreferenced (Vue Router first-match-wins prevents a local module from reclaiming the path).
- **Vue whitespace condensing**: when text follows a Vue element (`<template>`, `<RouterLink>`, `<em>`…) and a space is needed, build the suffix as an HTML string in a computed and render with `v-html` on a `<span>` on the same line as the preceding element's closing tag. See `CLAUDE.md` "Vue whitespace condensing".
- **SSR**: `npm run dev:ssr` also runs. Guard every `window` / `localStorage` / `document` access; render the lightbox overlay client-only.

---

## File Structure

```
modules/keys/
  package.json                  ← taxonpages manifest for later publish (not consumed locally)
  README.md                     ← what it is, how to publish
  router/index.js               ← route: { name: 'dichotomous-key', path: '/key/:id/:couplet?' }
  KeyView.vue                   ← route component: 3 API calls, format state, layout; reads route.params
  lib/
    tree.js                     ← PURE: buildNodes, orderedCouplets, descendantOtus, breadcrumb, childChoices, coupletByNumber  (Node-tested)
    format.js                   ← resolveFormat (pure) + readFormat/writeFormat (localStorage, guarded)
  components/
    KeyHeader.vue               ← title, scope, description, origin citation, attribution, chips
    FormatToggle.vue            ← Guided ⇄ Full key segmented control
    GuidedView.vue              ← breadcrumb + current couplet + choices; current couplet = route.params.couplet
    GuidedChoice.vue            ← one lead: LeadText + LeadFigures + CoupletCitation + ReachableTaxa
    ReachableTaxa.vue           ← "→ Couplet M · leads to K species" + name disclosure
    FullKeyView.vue             ← numbered couplet list; id="couplet-N", RouterLink jumps, scroll-into-view on :couplet
    LeadText.vue                ← lead text + inline short citation (shared by both views)
    LeadFigures.vue             ← thumbnail row → opens KeyLightbox
    KeyLightbox.vue             ← keys-local image viewer (overlay, prev/next, caption, Esc, focus-trap)
    CoupletCitation.vue         ← short citation form + click-through VModal with full reference
    TaxonLink.vue               ← <RouterLink target="_blank"> to otus-id, italic label
modules/interactiveKeys/
  router/index.js               ← route: { name: 'interactive-key', path: '/interactive-key/:id' }
  InteractiveKey.vue            ← thin fork of the package view (VueInteractiveKey)
  components/ImageMatrixButton.vue  ← copied verbatim from the package
panels/PanelKeys/
  main.js                       ← id: 'panel:keys' (local overrides the npm panel)
  PanelKeys.vue                 ← forked list card; dichotomous rows → 'dichotomous-key', matrix rows → 'interactive-key'
```

---

## API reference (probed 2026-08-29 against `sfg.taxonworks.org`, key #3977)

**Call 1 — `GET /leads/key/:id`** (token auto-added by `makeAPIRequest`):

```jsonc
{
  "metadata": {
    "server": "https://sfg.taxonworks.org/",
    "key_version": "0.0.1",
    "title": "Key to the species of Adosomus …",
    "origin_citation": "Voss, E. (1937) Über ostasiatische Curculioniden. <i>Senckenbergiana</i>, 19, 226–282. [45 figs]",
    "attribution": null,
    "taxonomic_scope": "Adosomus Faust, 1904"
  },
  "data": {
    "entries": {                     // couplet nodes ONLY (nodes that have children)
      "3977": { "children": [3978,3979], "parent_id": null, "position": null, "couplet_number": 1, "depth": 1 },
      "3978": { "children": [3980,3981], "parent_id": 3977, "position": 0, "couplet_number": 2, "depth": 2 }
      // …
    },
    "leads": {                       // EVERY lead, including couplet roots
      "3977": { "text": "Key to the species …", "parent_id": null, "position": null, "target_label": 1, "target_type": "internal" },
      "3980": { "text": "Antennal funicle: 1st …", "parent_id": 3978, "position": 0,
                "target_label": "Adosomus (Xeradosomus) samsonowii (Gebler, 1844)", "target_id": 1081954,
                "target_type": "/api/v1/otus" }
      // figures[] present on a lead only when it has depictions (none in #3977):
      //   { caption, figure_label, position, thumb, medium, content_type, original_png }
    }
  }
}
```

- `target_type` values seen: `"internal"` (points to a child couplet; `target_label` is the couplet number), `"/api/v1/otus"` (terminal; `target_label` is the taxon name, `target_id` the OTU id). The helper can also emit `"redirect"`, `"link_out"`, `"lead_item_otus"` — treat anything not `"/api/v1/otus"` and not `"internal"` as "other target", render `target_label` as plain text (with `target_link` as a normal external link when present).
- A node is a **couplet** iff it appears in `entries` (equivalently `entries[id].children.length > 0`). A node is **terminal** otherwise.
- `figures[]` shape is per TaxonWorks `depiction_to_json`; **unverified live** (no Lead depiction exists in this project yet). Code defensively: `fig.figure_label ?? fig.label`, and treat `thumb`/`medium` as usable `<img src>` directly.
- `original_png` is an `/api/v1/…` path; build a usable URL as pinpoint does: `` `${apiUrl}/${original_png.substring(8)}?project_token=${token}` `` where `apiUrl = __APP_ENV__.url` (already ends in `/api/v1`) — `.substring(8)` drops the leading `/api/v1/`.

**Call 2 — `GET /leads`** → array of public key roots. Find `row.id === Number(id)`:

```jsonc
{ "id": 3977, "otu_id": 732685, "text": "…", "description": "Original language German, translated by Jakob Jilg in 2026",
  "otus_count": 9, "couplets_count": 7, "key_updated_at_in_words": "6 months" }
```

None of `description` / `otus_count` / `couplets_count` / `key_updated_at_in_words` / `otu_id` are in call 1. If the key id is not in the call-2 list (non-public key), the header degrades to call-1 fields only.

**Call 3 — `GET /citations?citation_object_type=Lead&citation_object_id[]=…&extend[]=source`** — one batched call with every lead id from call 1:

```jsonc
[{ "id": 3121806, "citation_object_id": 3977, "citation_object_type": "Lead", "pages": "258",
   "is_original": true, "citation_source_body": "Voss, 1937:258",
   "source": { "author_year": "Voss, 1937",
               "cached": "Voss, E. (1937) Über ostasiatische Curculioniden. <i>Senckenbergiana</i>, 19, 226–282. [45 figs]" } }]
```

Short inline form: `citation_source_body` (already `"Author, year:pages"`), fallback `source.author_year`. Full form: `source.cached`, fallback `citation_source_body`. Multiple citations per lead are possible — render all short forms, comma-separated; each opens its own full reference.

---

## Task 1: Module scaffold + pure tree transforms + raw route

**Files:**
- Create: `modules/keys/router/index.js`
- Create: `modules/keys/lib/tree.js`
- Create: `modules/keys/KeyView.vue`
- Create: `modules/keys/package.json`
- Test: throwaway `/tmp/keytree.test.mjs`

**Interfaces:**
- Produces (`lib/tree.js`):
  - `buildNodes(entries: object, leads: object): Record<string, Node>` where
    `Node = { id:number, text:string, parentId:number|null, position:number|null, targetType:string, targetLabel:string|number, targetId:number|null, targetLink:string|null, figures:Figure[], children:number[], coupletNumber:(number|string|null), depth:number|null, isCouplet:boolean }`
  - `rootId(nodes: Record<string,Node>): number` — the node with `parentId === null`
  - `orderedCouplets(nodes: Record<string,Node>): Node[]` — every couplet node, depth-first, `position`-sorted, root first
  - `descendantOtus(nodeId: number, nodes: Record<string,Node>): {id:number,label:string}[]` — terminal OTU targets in the subtree rooted at `nodeId`, deduped by `id`, sorted by `label` (locale)
  - `breadcrumb(nodeId: number, nodes: Record<string,Node>): Node[]` — couplet nodes from root to `nodeId` inclusive
  - `childChoices(coupletId: number, nodes: Record<string,Node>): Node[]` — `nodes[coupletId].children` mapped to nodes, `position`-sorted
  - `coupletByNumber(value: string|number|null, nodes: Record<string,Node>): Node|null` — the couplet node whose number matches `value` string-safe (`String(n.coupletNumber) === String(value)`); `null` when `value` is nullish or unmatched
- Produces (`router/index.js`): route `{ name: 'dichotomous-key', path: '/key/:id/:couplet?' }`

- [ ] **Step 1: Write the failing test**

Create `/tmp/keytree.test.mjs`:

```js
import assert from 'node:assert/strict'
import {
  buildNodes, rootId, orderedCouplets, descendantOtus, breadcrumb, childChoices, coupletByNumber
} from '/home/jakobj/Data/01Aktuelle_Projekte/0_TaxonWorks/TaxonPagesDev/taxa/modules/keys/lib/tree.js'

// Minimal 3-couplet fixture:
//   1 ─┬─ a: → couplet 2
//      └─ b: OTU "Zeta"        (id 90)
//   2 ─┬─ c: OTU "Alpha"       (id 91)
//      └─ d: OTU "alpha"       (id 92)   // lowercase, tests locale sort
const entries = {
  '1': { children: [10, 11], parent_id: null, position: null, couplet_number: 1, depth: 1 },
  '10': { children: [20, 21], parent_id: 1, position: 0, couplet_number: 2, depth: 2 }
}
const leads = {
  '1':  { text: 'root', parent_id: null, position: null, target_label: 1, target_type: 'internal' },
  '10': { text: 'a', parent_id: 1, position: 0, target_label: 2, target_type: 'internal' },
  '11': { text: 'b', parent_id: 1, position: 1, target_label: 'Zeta', target_id: 90, target_type: '/api/v1/otus' },
  '20': { text: 'c', parent_id: 10, position: 0, target_label: 'Alpha', target_id: 91, target_type: '/api/v1/otus' },
  '21': { text: 'd', parent_id: 10, position: 1, target_label: 'alpha', target_id: 92, target_type: '/api/v1/otus',
          figures: [{ figure_label: 'Fig 1', caption: null, thumb: '/t.jpg', medium: '/m.jpg', original_png: '/api/v1/x.png' }] }
}

const nodes = buildNodes(entries, leads)

// buildNodes: couplet flag + merged fields + children default
assert.equal(nodes['1'].isCouplet, true)
assert.equal(nodes['10'].isCouplet, true)
assert.equal(nodes['11'].isCouplet, false)
assert.deepEqual(nodes['11'].children, [])
assert.equal(nodes['21'].figures.length, 1)
assert.equal(nodes['21'].targetId, 92)

// rootId
assert.equal(rootId(nodes), 1)

// orderedCouplets: root first, then DFS
assert.deepEqual(orderedCouplets(nodes).map((n) => n.id), [1, 10])

// descendantOtus: subtree of couplet 1 = Alpha, alpha, Zeta -> locale-sorted
assert.deepEqual(descendantOtus(1, nodes).map((o) => o.label), ['alpha', 'Alpha', 'Zeta'])
assert.deepEqual(descendantOtus(10, nodes).map((o) => o.id), [92, 91]) // alpha(92) < Alpha(91) by locale

// breadcrumb: root..node inclusive, couplets only
assert.deepEqual(breadcrumb(10, nodes).map((n) => n.id), [1, 10])
assert.deepEqual(breadcrumb(1, nodes).map((n) => n.id), [1])

// childChoices: position-sorted child nodes
assert.deepEqual(childChoices(1, nodes).map((n) => n.id), [10, 11])

// coupletByNumber: string-safe match; nullish/unmatched -> null
assert.equal(coupletByNumber(2, nodes).id, 10)
assert.equal(coupletByNumber('2', nodes).id, 10)
assert.equal(coupletByNumber(null, nodes), null)
assert.equal(coupletByNumber(99, nodes), null)

console.log('All keytree tests passed.')
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node /tmp/keytree.test.mjs`
Expected: FAIL — `Cannot find module '.../modules/keys/lib/tree.js'`

- [ ] **Step 3: Create `modules/keys/lib/tree.js`**

```js
// Pure transforms over the /leads/key/:id payload. No Vue, no network — Node-testable.
//
// `entries` contains ONLY couplet nodes (those with children). `leads` contains every
// lead including couplet roots. A node is a couplet iff it has an entry.

function toNode(id, lead, entry) {
  return {
    id: Number(id),
    text: lead.text ?? '',
    parentId: lead.parent_id ?? null,
    position: lead.position ?? null,
    targetType: lead.target_type ?? 'internal',
    targetLabel: lead.target_label ?? '',
    targetId: lead.target_id ?? null,
    targetLink: lead.target_link ?? null,
    figures: Array.isArray(lead.figures) ? lead.figures : [],
    children: entry?.children ? entry.children.map(Number) : [],
    coupletNumber: entry?.couplet_number ?? null,
    depth: entry?.depth ?? null,
    isCouplet: !!(entry && entry.children && entry.children.length)
  }
}

export function buildNodes(entries, leads) {
  const nodes = {}
  for (const [id, lead] of Object.entries(leads)) {
    nodes[id] = toNode(id, lead, entries[id])
  }
  return nodes
}

export function rootId(nodes) {
  const root = Object.values(nodes).find((n) => n.parentId === null)
  return root ? root.id : Number(Object.keys(nodes)[0])
}

const byPosition = (a, b) => (a.position ?? 0) - (b.position ?? 0)

export function childChoices(coupletId, nodes) {
  const node = nodes[coupletId]
  if (!node) return []
  return node.children
    .map((cid) => nodes[cid])
    .filter(Boolean)
    .sort(byPosition)
}

export function orderedCouplets(nodes) {
  const out = []
  const walk = (id) => {
    const node = nodes[id]
    if (!node || !node.isCouplet) return
    out.push(node)
    childChoices(id, nodes).forEach((child) => walk(child.id))
  }
  walk(rootId(nodes))
  return out
}

export function descendantOtus(nodeId, nodes) {
  const found = new Map()
  const walk = (id) => {
    const node = nodes[id]
    if (!node) return
    if (!node.isCouplet && node.targetType === '/api/v1/otus' && node.targetId != null) {
      found.set(node.targetId, { id: node.targetId, label: String(node.targetLabel) })
    }
    node.children.forEach(walk)
  }
  walk(nodeId)
  return [...found.values()].sort((a, b) => a.label.localeCompare(b.label))
}

export function breadcrumb(nodeId, nodes) {
  const path = []
  let cursor = nodes[nodeId]
  while (cursor) {
    if (cursor.isCouplet) path.unshift(cursor)
    cursor = cursor.parentId == null ? null : nodes[cursor.parentId]
  }
  return path
}

// Resolve a :couplet route param (a couplet number, possibly a curator string like "A")
// to its node. String-safe. Nullish or unmatched -> null (caller falls back to the root).
export function coupletByNumber(value, nodes) {
  if (value == null || value === '') return null
  const wanted = String(value)
  return (
    Object.values(nodes).find(
      (n) => n.isCouplet && String(n.coupletNumber) === wanted
    ) || null
  )
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node /tmp/keytree.test.mjs`
Expected: `All keytree tests passed.`

- [ ] **Step 5: Create `modules/keys/router/index.js`**

```js
export default [
  {
    name: 'dichotomous-key',
    path: '/key/:id/:couplet?',
    component: () => import('../KeyView.vue')
  }
]
```

`:couplet` is optional. `/key/3977` and `/key/3977/4` both match; `route.params.couplet` is
`undefined` for the first, `'4'` for the second — available identically during SSR render and
on the client.

- [ ] **Step 6: Create `modules/keys/package.json`**

```json
{
  "name": "taxonpages-module-keys",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "description": "Dichotomous (couplet) key renderer for TaxonPages.",
  "taxonpages": { "type": "module", "entry": "./router/index.js" },
  "peerDependencies": { "@sfgrp/taxonpages": "*", "vue": "^3" }
}
```

- [ ] **Step 7: Create `modules/keys/KeyView.vue` (raw, unstyled — proves the route + call 1 + transforms)**

```vue
<template>
  <div class="container mx-auto py-4">
    <VSpinner v-if="loading" />
    <div v-else-if="error" class="text-danger">Could not load key {{ route.params.id }}.</div>
    <div v-else>
      <h1 class="text-xl mb-4">{{ metadata.title }}</h1>
      <ol>
        <li v-for="c in couplets" :key="c.id" class="mb-3">
          <strong>Couplet {{ c.coupletNumber }}</strong>
          <ul class="ml-4 list-disc">
            <li v-for="choice in childrenOf(c.id)" :key="choice.id">
              {{ choice.text }}
              — <em>{{ choice.isCouplet ? 'couplet ' + choice.coupletNumber : choice.targetLabel }}</em>
            </li>
          </ul>
        </li>
      </ol>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { makeAPIRequest } from '@/utils/request'
import { buildNodes, orderedCouplets, childChoices } from './lib/tree.js'

const route = useRoute()

const loading = ref(true)
const error = ref(false)
const metadata = ref({})
const nodes = ref({})

const couplets = computed(() => orderedCouplets(nodes.value))
const childrenOf = (id) => childChoices(id, nodes.value)

async function load(id) {
  loading.value = true
  error.value = false
  try {
    const { data } = await makeAPIRequest.get(`/leads/key/${id}`)
    metadata.value = data.metadata || {}
    nodes.value = buildNodes(data.data.entries || {}, data.data.leads || {})
  } catch (e) {
    error.value = true
  } finally {
    loading.value = false
  }
}

watch(() => route.params.id, (id) => id && load(id), { immediate: true })
</script>
```

- [ ] **Step 8: Compile check**

Run: `npm run build`
Expected: build succeeds; console shows `[taxonpages] Local module "keys" …` discovery line (or no error). If SSR is your default, also `npm run build:ssr`.

- [ ] **Step 9: Browser check**

Run: `npm run dev`, open `http://localhost:5173/key/3977`.
Expected: the title "Key to the species of Adosomus …" and 7 couplets, each listing its two choices with the target (a couplet number or a species name). No styling yet — that is later tasks.

- [ ] **Step 10: Delete the throwaway script and commit**

```bash
rm /tmp/keytree.test.mjs
git add modules/keys/
git commit -m "Add local dichotomous-key module: route, pure tree transforms, raw view"
```

---

## Task 2: Metadata masthead (`KeyHeader.vue`) + call 2

**Files:**
- Create: `modules/keys/components/KeyHeader.vue`
- Modify: `modules/keys/KeyView.vue` (add call 2, render `<KeyHeader>`)

**Interfaces:**
- Consumes: `metadata` (call 1) shape from Task 1; `makeAPIRequest`.
- Produces: `KeyHeader` props `{ meta: object }` where `meta` is the merged object
  `{ title, taxonomicScope, originCitation, attribution, description, otuId, updatedInWords, coupletsCount, otusCount }`.

- [ ] **Step 1: Create `modules/keys/components/KeyHeader.vue`**

```vue
<template>
  <header class="border-b border-base-muted pb-4 mb-6">
    <h1 class="text-2xl font-semibold text-base-content">{{ meta.title }}</h1>

    <p v-if="meta.taxonomicScope" class="mt-1 text-base-content">
      <span class="text-base-soft">Scope: </span>
      <RouterLink
        v-if="meta.otuId"
        :to="{ name: 'otus-id', params: { id: meta.otuId } }"
        target="_blank"
        rel="noopener"
        class="italic hover:underline hover:text-secondary"
      >{{ meta.taxonomicScope }}</RouterLink>
      <span v-else class="italic">{{ meta.taxonomicScope }}</span>
    </p>

    <p v-if="meta.description" class="mt-2 text-base-content">{{ meta.description }}</p>

    <p
      v-if="meta.originCitation"
      class="mt-2 text-sm text-base-content [&_i]:italic cursor-pointer hover:underline"
      role="button"
      tabindex="0"
      @click="showCitation = true"
      @keydown.enter="showCitation = true"
      v-html="meta.originCitation"
    />

    <p v-if="meta.attribution" class="mt-1 text-sm text-base-soft">{{ attributionText }}</p>

    <div class="mt-3 flex flex-wrap gap-2 text-xs text-base-soft">
      <span v-if="meta.coupletsCount" class="border border-base-muted rounded px-2 py-0.5">
        {{ meta.coupletsCount }} couplets
      </span>
      <span v-if="meta.otusCount" class="border border-base-muted rounded px-2 py-0.5">
        {{ meta.otusCount }} taxa
      </span>
      <span v-if="meta.updatedInWords" class="border border-base-muted rounded px-2 py-0.5">
        updated {{ meta.updatedInWords }} ago
      </span>
    </div>

    <VModal v-if="showCitation" @close="showCitation = false">
      <template #header><div class="text-sm font-medium">Reference</div></template>
      <div class="px-4 pb-4 text-sm leading-relaxed [&_i]:italic" v-html="meta.originCitation" />
    </VModal>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({ meta: { type: Object, required: true } })

const showCitation = ref(false)

// attribution shape from TaxonWorks attribution_to_json is loosely specified; render a
// best-effort string and never throw.
const attributionText = computed(() => {
  const a = props.meta.attribution
  if (!a) return ''
  if (typeof a === 'string') return a
  return a.label || a.text || ''
})
</script>
```

- [ ] **Step 2: Wire call 2 into `modules/keys/KeyView.vue`**

Replace the `<script setup>` body's data refs + `load` with:

```js
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { makeAPIRequest } from '@/utils/request'
import { buildNodes, orderedCouplets, childChoices } from './lib/tree.js'
import KeyHeader from './components/KeyHeader.vue'

const route = useRoute()

const loading = ref(true)
const error = ref(false)
const rawMeta = ref({})
const listMeta = ref({})
const nodes = ref({})

const couplets = computed(() => orderedCouplets(nodes.value))
const childrenOf = (id) => childChoices(id, nodes.value)

const meta = computed(() => ({
  title: rawMeta.value.title || listMeta.value.text || '',
  taxonomicScope: rawMeta.value.taxonomic_scope || null,
  originCitation: rawMeta.value.origin_citation || null,
  attribution: rawMeta.value.attribution || null,
  description: listMeta.value.description || null,
  otuId: listMeta.value.otu_id || null,
  updatedInWords: listMeta.value.key_updated_at_in_words || null,
  coupletsCount: listMeta.value.couplets_count || null,
  otusCount: listMeta.value.otus_count || null
}))

async function load(id) {
  loading.value = true
  error.value = false
  listMeta.value = {}
  try {
    const keyReq = makeAPIRequest.get(`/leads/key/${id}`)
    const listReq = makeAPIRequest.get('/leads').catch(() => ({ data: [] }))
    const { data } = await keyReq
    rawMeta.value = data.metadata || {}
    nodes.value = buildNodes(data.data.entries || {}, data.data.leads || {})
    const { data: list } = await listReq
    listMeta.value = (Array.isArray(list) ? list : []).find((r) => r.id === Number(id)) || {}
  } catch (e) {
    error.value = true
  } finally {
    loading.value = false
  }
}

watch(() => route.params.id, (id) => id && load(id), { immediate: true })
```

And in the template replace the `<h1>…</h1>` line with:

```vue
<KeyHeader :meta="meta" />
```

- [ ] **Step 3: Compile check** — `npm run build` → succeeds.

- [ ] **Step 4: Browser check**

Reload `http://localhost:5173/key/3977`.
Expected: masthead shows the title, `Scope: Adosomus Faust, 1904` (italic, links to an OTU page in a new tab), the description line "Original language German, translated by Jakob Jilg in 2026", the Voss 1937 citation with *Senckenbergiana* italicised (clicking it opens a modal with the same reference), and three chips: "7 couplets", "9 taxa", "updated 6 months ago".

- [ ] **Step 5: Commit**

```bash
git add modules/keys/
git commit -m "keys: metadata masthead with description, scope link, citation, chips"
```

---

## Task 3: Full-key view (`FullKeyView.vue`, `LeadText.vue`, `TaxonLink.vue`)

**Files:**
- Create: `modules/keys/components/TaxonLink.vue`
- Create: `modules/keys/components/LeadText.vue`
- Create: `modules/keys/components/FullKeyView.vue`
- Modify: `modules/keys/KeyView.vue` (render `<FullKeyView>` instead of the raw `<ol>`)

**Interfaces:**
- Consumes: `Node` shape, `orderedCouplets`, `childChoices` (Task 1); `meta` (Task 2); `route.params.id` / `route.params.couplet`.
- Produces:
  - `TaxonLink` props `{ id:number, label:string }` — renders `<RouterLink target="_blank">` to `otus-id`, italic label, `hover:underline`.
  - `LeadText` props `{ node:Node, citations:object }` — lead text + (later) inline citation. `citations` may be `{}` now; the prop exists so Task 5 needs no signature change.
  - `FullKeyView` props `{ keyId:string|number, couplet:string|null, couplets:Node[], nodes:Record<string,Node>, citations:object }`. Couplet-number targets and "from N" back-references are `<RouterLink>`s to `{ name: 'dichotomous-key', params: { id: keyId, couplet: N } }` (no hash). When `couplet` changes, the matching `#couplet-N` section is scrolled into view (client-only).

- [ ] **Step 1: Create `modules/keys/components/TaxonLink.vue`**

```vue
<template>
  <RouterLink
    :to="{ name: 'otus-id', params: { id } }"
    target="_blank"
    rel="noopener"
    class="italic text-base-content hover:underline hover:text-secondary"
  >{{ label }}</RouterLink>
</template>

<script setup>
defineProps({
  id: { type: [Number, String], required: true },
  label: { type: String, required: true }
})
</script>
```

- [ ] **Step 2: Create `modules/keys/components/LeadText.vue`**

```vue
<template>
  <span>
    <span class="text-base-content">{{ node.text }}</span>
    <span v-if="shortCitations.length" class="text-sm text-base-soft">
      <template v-for="(c, i) in shortCitations" :key="c.id">
        <span> </span>
        <span
          class="cursor-pointer hover:underline"
          role="button"
          tabindex="0"
          @click="$emit('open-citation', c)"
          @keydown.enter="$emit('open-citation', c)"
        >[{{ c.short }}]</span>
      </template>
    </span>
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  node: { type: Object, required: true },
  citations: { type: Object, default: () => ({}) }
})
defineEmits(['open-citation'])

const shortCitations = computed(() => props.citations[props.node.id] || [])
</script>
```

- [ ] **Step 3: Create `modules/keys/components/FullKeyView.vue`**

```vue
<template>
  <div class="[&_i]:italic">
    <section
      v-for="couplet in couplets"
      :key="couplet.id"
      :id="`couplet-${couplet.coupletNumber}`"
      class="mb-5 scroll-mt-24"
    >
      <div class="flex gap-3">
        <span class="font-semibold text-secondary-content shrink-0 tabular-nums">
          {{ couplet.coupletNumber }}
        </span>
        <div class="flex-1">
          <p v-if="fromCouplet(couplet)" class="text-xs text-base-soft mb-1">
            <RouterLink
              :to="coupletTo(fromCouplet(couplet))"
              class="hover:underline hover:text-secondary"
            >from {{ fromCouplet(couplet) }}</RouterLink>
          </p>

          <div
            v-for="(choice, idx) in childrenOf(couplet.id)"
            :key="choice.id"
            class="mb-2"
          >
            <div class="flex gap-2">
              <span class="text-base-soft shrink-0 w-4 text-right">{{ idx === 0 ? '' : '—' }}</span>
              <div class="flex-1">
                <LeadText :node="choice" :citations="citations" @open-citation="$emit('open-citation', $event)" />
                <span> … </span>
                <RouterLink
                  v-if="choice.isCouplet"
                  :to="coupletTo(choice.coupletNumber)"
                  class="font-medium hover:underline hover:text-secondary"
                >couplet {{ choice.coupletNumber }}</RouterLink>
                <TaxonLink
                  v-else-if="choice.targetType === '/api/v1/otus'"
                  :id="choice.targetId"
                  :label="String(choice.targetLabel)"
                />
                <a
                  v-else-if="choice.targetLink"
                  :href="choice.targetLink"
                  target="_blank"
                  rel="noopener"
                  class="hover:underline hover:text-secondary"
                >{{ choice.targetLabel }}</a>
                <span v-else class="text-base-content">{{ choice.targetLabel }}</span>

                <LeadFigures v-if="choice.figures.length" :figures="choice.figures" class="mt-1" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { watch, nextTick } from 'vue'
import { childChoices } from '../lib/tree.js'
import LeadText from './LeadText.vue'
import TaxonLink from './TaxonLink.vue'
import LeadFigures from './LeadFigures.vue'

const props = defineProps({
  keyId: { type: [String, Number], required: true },
  couplet: { type: [String, null], default: null },
  couplets: { type: Array, required: true },
  nodes: { type: Object, required: true },
  citations: { type: Object, default: () => ({}) }
})
defineEmits(['open-citation'])

const childrenOf = (id) => childChoices(id, props.nodes)

// RouterLink target for a couplet number — same route, :couplet param changes. No hash.
const coupletTo = (n) => ({ name: 'dichotomous-key', params: { id: props.keyId, couplet: String(n) } })

// The couplet number whose lead points into this couplet (its parent couplet), for a back-reference.
function fromCouplet(couplet) {
  const parent = couplet.parentId == null ? null : props.nodes[couplet.parentId]
  return parent && parent.isCouplet ? parent.coupletNumber : null
}

// When the URL names a couplet, bring its section into view (client only).
function scrollToCouplet(n) {
  if (n == null || typeof document === 'undefined') return
  nextTick(() => {
    document.getElementById(`couplet-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}
watch(() => props.couplet, scrollToCouplet, { immediate: true })
watch(() => props.couplets, () => scrollToCouplet(props.couplet))
</script>
```

> **Note:** `FullKeyView` imports `LeadFigures.vue`, created in Task 4. To keep this task's build green, create a one-line stub now and replace it in Task 4:
> ```bash
> mkdir -p modules/keys/components
> printf '%s\n' '<template><span /></template><script setup>defineProps({ figures: { type: Array, default: () => [] } })</script>' > modules/keys/components/LeadFigures.vue
> ```

- [ ] **Step 4: Render `<FullKeyView>` in `modules/keys/KeyView.vue`**

Template — replace the `<div v-else> … </div>` block with:

```vue
<div v-else>
  <KeyHeader :meta="meta" />
  <FullKeyView
    :key-id="route.params.id"
    :couplet="route.params.couplet ?? null"
    :couplets="couplets"
    :nodes="nodes"
    :citations="citations"
    @open-citation="() => {}"
  />
</div>
```

Script — add the import and a `citations` ref (populated in Task 5):

```js
import FullKeyView from './components/FullKeyView.vue'
const citations = ref({})
```

`route` is already imported (Task 2). `route.params.couplet` is reactive, so `FullKeyView`'s
`watch(() => props.couplet, …)` scrolls whenever the URL's couplet segment changes.

- [ ] **Step 5: Compile check** — `npm run build` and `npm run build:ssr` → succeed (the scroll watcher guards `document`).

- [ ] **Step 6: Browser check**

Reload `http://localhost:5173/key/3977`.
Expected: a numbered couplet list. Couplet numbers are bold and colour-accented; the two leads of each couplet are stacked, the second prefixed `—`; each lead ends in ` … ` then either `couplet N` (clicking navigates to `/key/3977/N` and scrolls that couplet into view; middle-click opens `/key/3977/N` in a new tab) or a species name in italic (clicking opens the OTU page in a **new tab**). Couplets 2–7 show a small "from N" back-reference. No blue wall — jump links are plain text until hovered.
Then open `http://localhost:5173/key/3977/4` directly: the page loads already scrolled to couplet 4. Browser Back returns to the previous couplet position.

- [ ] **Step 7: Commit**

```bash
git add modules/keys/
git commit -m "keys: full-key view — numbered couplets, back-anchors, new-tab taxon links"
```

---

## Task 4: Figures + keys-local lightbox (`LeadFigures.vue`, `KeyLightbox.vue`)

**Files:**
- Replace: `modules/keys/components/LeadFigures.vue` (the stub from Task 3)
- Create: `modules/keys/components/KeyLightbox.vue`

**Interfaces:**
- Consumes: `Figure` objects from `node.figures` — `{ thumb, medium, original_png, caption, figure_label, label?, position? }`.
- Produces:
  - `LeadFigures` props `{ figures: Figure[] }` — thumbnail row; opens `KeyLightbox` at the clicked index.
  - `KeyLightbox` props `{ figures: Figure[], index: number }`, emits `close`, `update:index`.

- [ ] **Step 1: Create `modules/keys/components/KeyLightbox.vue`**

```vue
<template>
  <Teleport to="body">
    <div
      ref="root"
      role="dialog"
      aria-modal="true"
      aria-label="Figure viewer"
      class="fixed inset-0 z-[10000] flex flex-col bg-base-foreground/95 backdrop-blur-md"
    >
      <div class="flex-none h-12 flex items-center justify-between px-3">
        <span class="text-sm text-base-soft">{{ index + 1 }} / {{ figures.length }}</span>
        <button type="button" class="p-2 cursor-pointer text-base-content" aria-label="Close" @click="$emit('close')">
          <IconClose />
        </button>
      </div>

      <div class="flex-1 min-h-0 relative flex items-center justify-center px-4">
        <img
          :src="src(current)"
          :alt="caption(current)"
          class="max-w-full max-h-full object-contain cursor-zoom-out"
          @click="$emit('close')"
        />
        <button
          v-if="index > 0"
          type="button"
          class="absolute left-2 top-1/2 -translate-y-1/2 p-3 text-base-content hover:text-secondary"
          aria-label="Previous"
          @click="$emit('update:index', index - 1)"
        >‹</button>
        <button
          v-if="index < figures.length - 1"
          type="button"
          class="absolute right-2 top-1/2 -translate-y-1/2 p-3 text-base-content hover:text-secondary"
          aria-label="Next"
          @click="$emit('update:index', index + 1)"
        >›</button>
      </div>

      <div v-if="caption(current)" class="flex-none px-6 pb-4 pt-2 text-center text-sm text-base-content [&_i]:italic">
        <span v-if="current.figure_label || current.label" class="text-base-soft">
          {{ current.figure_label || current.label }} —
        </span>
        <span v-html="current.caption" />
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  figures: { type: Array, required: true },
  index: { type: Number, required: true }
})
const emit = defineEmits(['close', 'update:index'])

const root = ref(null)
let previouslyFocused = null

const current = computed(() => props.figures[props.index] || {})
const apiUrl = (typeof __APP_ENV__ !== 'undefined' && __APP_ENV__.url) || ''
const token = (typeof __APP_ENV__ !== 'undefined' && __APP_ENV__.project_token) || ''

function src(fig) {
  if (fig.medium) return fig.medium
  if (fig.original_png) return `${apiUrl}/${String(fig.original_png).substring(8)}?project_token=${token}`
  return fig.thumb || ''
}
function caption(fig) {
  return fig.caption || fig.figure_label || fig.label || ''
}

function onKey(e) {
  if (e.key === 'Escape') emit('close')
  else if (e.key === 'ArrowLeft' && props.index > 0) emit('update:index', props.index - 1)
  else if (e.key === 'ArrowRight' && props.index < props.figures.length - 1) emit('update:index', props.index + 1)
  else if (e.key === 'Tab') trapFocus(e)
}
function trapFocus(e) {
  const f = root.value?.querySelectorAll('button, [tabindex]:not([tabindex="-1"])')
  if (!f?.length) return
  const first = f[0]
  const last = f[f.length - 1]
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
}

onMounted(() => {
  previouslyFocused = document.activeElement
  document.addEventListener('keydown', onKey)
  document.body.classList.add('overflow-hidden')
  root.value?.querySelector('button')?.focus()
})
onUnmounted(() => {
  document.removeEventListener('keydown', onKey)
  document.body.classList.remove('overflow-hidden')
  previouslyFocused?.focus?.()
})
</script>
```

- [ ] **Step 2: Replace `modules/keys/components/LeadFigures.vue`**

```vue
<template>
  <div class="flex flex-wrap gap-1.5">
    <button
      v-for="(fig, i) in figures"
      :key="i"
      type="button"
      class="h-20 w-24 shrink-0 overflow-hidden rounded border border-base-muted hover:border-secondary transition"
      :title="fig.figure_label || fig.label || 'figure'"
      @click="open(i)"
    >
      <img :src="fig.thumb || fig.medium" alt="" class="h-full w-full object-contain" />
    </button>

    <ClientOnly>
      <KeyLightbox
        v-if="viewer !== null"
        :figures="figures"
        :index="viewer"
        @close="viewer = null"
        @update:index="viewer = $event"
      />
    </ClientOnly>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import KeyLightbox from './KeyLightbox.vue'

defineProps({ figures: { type: Array, default: () => [] } })

const viewer = ref(null)
const open = (i) => { viewer.value = i }
</script>
```

- [ ] **Step 3: Compile check** — `npm run build` → succeeds. Also `npm run build:ssr` → succeeds (lightbox is `ClientOnly` + `Teleport`).

- [ ] **Step 4: Browser check (no live data — structural)**

Key #3977 has no figures, so nothing renders yet. Temporarily add a fake figure to confirm wiring: in `KeyView.vue`'s `load`, right after `nodes.value = buildNodes(...)`, add
`Object.values(nodes.value)[3].figures = [{ thumb: 'https://sfg.taxonworks.org/favicon.ico', medium: 'https://sfg.taxonworks.org/favicon.ico', figure_label: 'Fig 1', caption: 'test <i>caption</i>' }]`
then reload `/key/3977`. Expected: a thumbnail appears under one lead; clicking it opens a full-screen overlay with the image, "Fig 1 — test *caption*", a counter "1 / 1", Esc closes it and focus returns. **Remove the temporary line and reload** — thumbnails disappear.

- [ ] **Step 5: Commit**

```bash
git add modules/keys/components/LeadFigures.vue modules/keys/components/KeyLightbox.vue
git commit -m "keys: per-couplet figures with a keys-local lightbox"
```

---

## Task 5: Citations (`CoupletCitation.vue` + call 3)

**Files:**
- Create: `modules/keys/components/CoupletCitation.vue`
- Modify: `modules/keys/KeyView.vue` (call 3, build `citations` map, host the full-reference modal)

**Interfaces:**
- Consumes: lead ids = `Object.keys(nodes.value)`; call-3 response shape (see API reference).
- Produces:
  - `citations` map: `Record<leadId, { id:number, short:string, full:string }[]>` — the shape `LeadText` (Task 3) already expects.
  - `CoupletCitation` props `{ citation: { full:string } }`, emits `close` — a `VModal` with the full reference.

- [ ] **Step 1: Create `modules/keys/components/CoupletCitation.vue`**

```vue
<template>
  <VModal @close="$emit('close')">
    <template #header><div class="text-sm font-medium">Reference</div></template>
    <div class="px-4 pb-4 text-sm leading-relaxed [&_i]:italic" v-html="citation.full" />
  </VModal>
</template>

<script setup>
defineProps({ citation: { type: Object, required: true } })
defineEmits(['close'])
</script>
```

- [ ] **Step 2: Wire call 3 + the map + the modal into `modules/keys/KeyView.vue`**

Script — add import, replace `const citations = ref({})` with the real fetch, add active-citation state:

```js
import CoupletCitation from './components/CoupletCitation.vue'

const citations = ref({})
const activeCitation = ref(null)

async function loadCitations(leadIds) {
  if (!leadIds.length) return
  const qs = new URLSearchParams()
  qs.set('citation_object_type', 'Lead')
  qs.append('extend[]', 'source')
  leadIds.forEach((id) => qs.append('citation_object_id[]', id))
  try {
    const { data } = await makeAPIRequest.get(`/citations?${qs.toString()}`)
    const map = {}
    for (const c of Array.isArray(data) ? data : []) {
      const key = String(c.citation_object_id)
      ;(map[key] ||= []).push({
        id: c.id,
        short: c.citation_source_body || c.source?.author_year || 'reference',
        full: c.source?.cached || c.citation_source_body || ''
      })
    }
    citations.value = map
  } catch (e) {
    citations.value = {}
  }
}
```

In `load`, after `nodes.value = buildNodes(...)` and kicking off the list request, add:

```js
loadCitations(Object.keys(nodes.value))
```

(fire-and-forget; the map fills in reactively).

Template — wire the real `@open-citation` handler (keep the `key-id` / `couplet` props from
Task 3) and host the modal:

```vue
<FullKeyView
  :key-id="route.params.id"
  :couplet="route.params.couplet ?? null"
  :couplets="couplets"
  :nodes="nodes"
  :citations="citations"
  @open-citation="activeCitation = $event"
/>
<CoupletCitation
  v-if="activeCitation"
  :citation="activeCitation"
  @close="activeCitation = null"
/>
```

- [ ] **Step 3: Compile check** — `npm run build` → succeeds.

- [ ] **Step 4: Browser check**

Reload `http://localhost:5173/key/3977`. Couplet 1's first lead is the only one with a citation in this project's data.
Expected: after the lead text of couplet 1, a small `[Voss, 1937:258]` in muted text; clicking it opens a modal with the full "Voss, E. (1937) Über ostasiatische Curculioniden. *Senckenbergiana*, 19, 226–282. [45 figs]" (italic journal). Other leads show no citation marker.

- [ ] **Step 5: Commit**

```bash
git add modules/keys/
git commit -m "keys: per-couplet + key-level citations (short inline form, full reference modal)"
```

---

## Task 6: Guided view + format toggle (`GuidedView.vue`, `GuidedChoice.vue`, `ReachableTaxa.vue`, `FormatToggle.vue`, `lib/format.js`)

**Files:**
- Create: `modules/keys/lib/format.js`
- Create: `modules/keys/components/ReachableTaxa.vue`
- Create: `modules/keys/components/GuidedChoice.vue`
- Create: `modules/keys/components/GuidedView.vue`
- Create: `modules/keys/components/FormatToggle.vue`
- Modify: `modules/keys/KeyView.vue` (format state, switch views)
- Test: append to a throwaway `/tmp/keyformat.test.mjs`

**Interfaces:**
- Consumes: `descendantOtus`, `breadcrumb`, `childChoices`, `rootId`, `coupletByNumber` (Task 1); `citations` map (Task 5); `route.params.id` / `route.params.couplet`.
- Produces:
  - `lib/format.js`: `resolveFormat({ stored, query }): 'guided'|'full'` (pure); `readFormat(): 'guided'|'full'`; `writeFormat(v): void`.
  - `ReachableTaxa` props `{ choice:Node, nodes:Record<string,Node> }`.
  - `GuidedChoice` props `{ keyId:string|number, choice:Node, nodes:Record<string,Node>, citations:object }`, emits `open-citation(c)`. The "descend" action is a `<RouterLink>` to `{ name:'dichotomous-key', params:{ id:keyId, couplet } }` — no `descend` emit.
  - `GuidedView` props `{ keyId:string|number, couplet:string|null, nodes:Record<string,Node>, citations:object }`, emits `open-citation(c)`. Current couplet = `coupletByNumber(couplet, nodes) ?? nodes[rootId(nodes)]`; breadcrumb steps and "↑ back" are `<RouterLink>`s to the same route with the target `:couplet`.
  - `FormatToggle` props `{ modelValue:'guided'|'full' }`, emits `update:modelValue`.

- [ ] **Step 1: Write the failing test for `resolveFormat`**

Create `/tmp/keyformat.test.mjs`:

```js
import assert from 'node:assert/strict'
import { resolveFormat } from '/home/jakobj/Data/01Aktuelle_Projekte/0_TaxonWorks/TaxonPagesDev/taxa/modules/keys/lib/format.js'

assert.equal(resolveFormat({ stored: null, query: null }), 'guided')          // default
assert.equal(resolveFormat({ stored: 'full', query: null }), 'full')          // stored wins over default
assert.equal(resolveFormat({ stored: 'full', query: 'guided' }), 'guided')    // query wins over stored
assert.equal(resolveFormat({ stored: 'nonsense', query: null }), 'guided')    // invalid stored ignored
assert.equal(resolveFormat({ stored: null, query: 'full' }), 'full')

console.log('All keyformat tests passed.')
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node /tmp/keyformat.test.mjs`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `modules/keys/lib/format.js`**

```js
const VALID = ['guided', 'full']
const STORAGE_KEY = 'taxonpages:key-format'

// Pure: given a stored preference and a ?format= query value, pick the format.
// Precedence: query > stored > default('guided'). Unknown values are ignored.
export function resolveFormat({ stored, query }) {
  if (VALID.includes(query)) return query
  if (VALID.includes(stored)) return stored
  return 'guided'
}

export function readFormat() {
  let stored = null
  let query = null
  try {
    if (typeof localStorage !== 'undefined') stored = localStorage.getItem(STORAGE_KEY)
  } catch (e) { /* private mode / SSR */ }
  try {
    if (typeof window !== 'undefined') {
      query = new URLSearchParams(window.location.search).get('format')
    }
  } catch (e) { /* SSR */ }
  return resolveFormat({ stored, query })
}

export function writeFormat(value) {
  if (!VALID.includes(value)) return
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, value)
  } catch (e) { /* ignore */ }
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node /tmp/keyformat.test.mjs`
Expected: `All keyformat tests passed.`

- [ ] **Step 5: Create `modules/keys/components/ReachableTaxa.vue`**

```vue
<template>
  <div class="text-sm">
    <span class="text-base-soft">→ </span>
    <template v-if="choice.isCouplet">
      <span class="text-base-soft">Couplet {{ choice.coupletNumber }} · </span>
      <span class="text-base-content">leads to {{ taxa.length }} {{ taxa.length === 1 ? 'taxon' : 'taxa' }}</span>
      <button
        v-if="taxa.length"
        type="button"
        class="ml-1 text-base-soft hover:underline hover:text-secondary"
        @click="expanded = !expanded"
      >{{ expanded ? 'hide' : 'show names' }}</button>
      <div v-if="expanded || taxa.length <= inlineLimit" class="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
        <TaxonLink v-for="t in taxa" :key="t.id" :id="t.id" :label="t.label" />
      </div>
    </template>
    <TaxonLink
      v-else-if="choice.targetType === '/api/v1/otus'"
      :id="choice.targetId"
      :label="String(choice.targetLabel)"
    />
    <a
      v-else-if="choice.targetLink"
      :href="choice.targetLink"
      target="_blank"
      rel="noopener"
      class="hover:underline hover:text-secondary"
    >{{ choice.targetLabel }}</a>
    <span v-else class="text-base-content">{{ choice.targetLabel }}</span>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { descendantOtus } from '../lib/tree.js'
import TaxonLink from './TaxonLink.vue'

const props = defineProps({
  choice: { type: Object, required: true },
  nodes: { type: Object, required: true }
})

const inlineLimit = 4
const expanded = ref(false)
const taxa = computed(() => descendantOtus(props.choice.id, props.nodes))
</script>
```

- [ ] **Step 6: Create `modules/keys/components/GuidedChoice.vue`**

```vue
<template>
  <div class="rounded border border-base-muted bg-base-foreground p-4 flex flex-col gap-3"
       :style="{ boxShadow: 'var(--tp-card-shadow) 0 2px 4px 0' }">
    <p class="[&_i]:italic leading-relaxed">
      <LeadText :node="choice" :citations="citations" @open-citation="$emit('open-citation', $event)" />
    </p>

    <LeadFigures v-if="choice.figures.length" :figures="choice.figures" />

    <ReachableTaxa :choice="choice" :nodes="nodes" />

    <RouterLink
      v-if="choice.isCouplet"
      :to="{ name: 'dichotomous-key', params: { id: keyId, couplet: String(choice.coupletNumber) } }"
      class="self-start text-sm px-3 py-1 rounded bg-primary text-primary-content hover:bg-primary/80"
    >Go to couplet {{ choice.coupletNumber }} →</RouterLink>
  </div>
</template>

<script setup>
import LeadText from './LeadText.vue'
import LeadFigures from './LeadFigures.vue'
import ReachableTaxa from './ReachableTaxa.vue'

defineProps({
  keyId: { type: [String, Number], required: true },
  choice: { type: Object, required: true },
  nodes: { type: Object, required: true },
  citations: { type: Object, default: () => ({}) }
})
defineEmits(['open-citation'])
</script>
```

- [ ] **Step 7: Create `modules/keys/components/GuidedView.vue`**

```vue
<template>
  <div>
    <nav v-if="trail.length > 1" class="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
      <template v-for="(step, i) in trail" :key="step.id">
        <RouterLink
          :to="to(step.coupletNumber)"
          class="hover:underline hover:text-secondary"
          :class="i === trail.length - 1 ? 'text-base-content font-medium' : 'text-base-soft'"
        >Couplet {{ step.coupletNumber }}</RouterLink>
        <span v-if="i < trail.length - 1" class="text-base-soft">›</span>
      </template>
    </nav>

    <div class="flex items-baseline justify-between mb-3">
      <h2 class="text-lg font-semibold text-secondary-content">Couplet {{ current.coupletNumber }}</h2>
      <RouterLink
        v-if="parentCouplet"
        :to="to(parentCouplet.coupletNumber)"
        class="text-sm text-base-soft hover:underline hover:text-secondary"
      >↑ back</RouterLink>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <GuidedChoice
        v-for="choice in choices"
        :key="choice.id"
        :key-id="keyId"
        :choice="choice"
        :nodes="nodes"
        :citations="citations"
        @open-citation="$emit('open-citation', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { rootId, breadcrumb, childChoices, coupletByNumber } from '../lib/tree.js'
import GuidedChoice from './GuidedChoice.vue'

const props = defineProps({
  keyId: { type: [String, Number], required: true },
  couplet: { type: String, default: null },
  nodes: { type: Object, required: true },
  citations: { type: Object, default: () => ({}) }
})
defineEmits(['open-citation'])

// Current couplet is a function of the URL. Unknown / absent -> root couplet.
const current = computed(() => {
  if (!Object.keys(props.nodes).length) return {}
  return coupletByNumber(props.couplet, props.nodes) || props.nodes[rootId(props.nodes)] || {}
})

const parentCouplet = computed(() => {
  const p = current.value.parentId == null ? null : props.nodes[current.value.parentId]
  return p && p.isCouplet ? p : null
})

const trail = computed(() => (current.value.id ? breadcrumb(current.value.id, props.nodes) : []))
const choices = computed(() => (current.value.id ? childChoices(current.value.id, props.nodes) : []))

// RouterLink target for a couplet number. The root couplet drops the :couplet segment
// so its URL is the clean /key/:id.
function to(coupletNumber) {
  const root = props.nodes[rootId(props.nodes)]
  const params = { id: props.keyId }
  if (!root || String(root.coupletNumber) !== String(coupletNumber)) {
    params.couplet = String(coupletNumber)
  }
  return { name: 'dichotomous-key', params }
}
</script>
```

- [ ] **Step 8: Create `modules/keys/components/FormatToggle.vue`**

```vue
<template>
  <div class="inline-flex rounded border border-base-muted overflow-hidden text-sm">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      class="px-3 py-1"
      :class="modelValue === opt.value
        ? 'bg-primary text-primary-content'
        : 'bg-base-foreground text-base-content hover:bg-base-muted'"
      @click="$emit('update:modelValue', opt.value)"
    >{{ opt.label }}</button>
  </div>
</template>

<script setup>
defineProps({ modelValue: { type: String, required: true } })
defineEmits(['update:modelValue'])

const options = [
  { value: 'guided', label: 'Guided' },
  { value: 'full', label: 'Full key' }
]
</script>
```

- [ ] **Step 9: Wire format state + view switch into `modules/keys/KeyView.vue`**

Script — add:

```js
import GuidedView from './components/GuidedView.vue'
import FormatToggle from './components/FormatToggle.vue'
import { readFormat, writeFormat } from './lib/format.js'

const format = ref('guided')
onMounted(() => { format.value = readFormat() })
watch(format, (v) => writeFormat(v))
```

(add `onMounted` to the `vue` import).

Template — replace the results block:

```vue
<div v-else>
  <div class="flex items-start justify-between gap-4">
    <KeyHeader class="flex-1" :meta="meta" />
    <FormatToggle v-model="format" class="mt-1 shrink-0 key-print-hide" />
  </div>

  <GuidedView
    v-if="format === 'guided'"
    :key-id="route.params.id"
    :couplet="route.params.couplet ?? null"
    :nodes="nodes"
    :citations="citations"
    @open-citation="activeCitation = $event"
  />
  <FullKeyView
    v-else
    :key-id="route.params.id"
    :couplet="route.params.couplet ?? null"
    :couplets="couplets"
    :nodes="nodes"
    :citations="citations"
    @open-citation="activeCitation = $event"
  />

  <CoupletCitation v-if="activeCitation" :citation="activeCitation" @close="activeCitation = null" />
</div>
```

(`key-print-hide` is styled in Task 7; harmless until then.)

- [ ] **Step 10: Compile check** — `npm run build` and `npm run build:ssr` → succeed.

- [ ] **Step 11: Browser check**

Reload `http://localhost:5173/key/3977`.
Expected (Guided, the default):
- Header with a "Guided | Full key" toggle at the top-right.
- "Couplet 1" heading; two choice cards side by side on desktop.
- Each card: the lead text (plain body colour), then a `→ Couplet 2 · leads to N taxa  show names` line. Card 1 ("Scrobes ventrally confluent…") → "leads to 2 taxa", names shown inline (*A. samsonowii*, *A. roridus*). Card 2 → "leads to 7 taxa", collapsed behind "show names".
- Card with a child couplet has a "Go to couplet N →" link; clicking it navigates to `/key/3977/N`, the view swaps to that couplet, and a breadcrumb appears (`Couplet 1 › Couplet 3`). Breadcrumb steps and "↑ back" are links that navigate upward; **browser Back walks up the key**.
- Open `http://localhost:5173/key/3977/4` directly → Guided loads showing couplet 4 with the full breadcrumb `Couplet 1 › Couplet 3 › Couplet 4`. Under `npm run dev:ssr` (`http://localhost:6173/key/3977/4`) the page renders without error and settles on couplet 4 after hydration — same URL, same couplet, on server and client (data still loads client-side with a brief spinner, as the current `keyId.vue` does entirely; the point is the couplet is chosen from `route.params`, never a hash, so it is deterministic regardless of render mode).
- Middle-click "Go to couplet N" → opens `/key/3977/N` in a new tab.
- Toggle to "Full key" → the Task 3 list. Reload the page → it stays on "Full key" (localStorage). Append `?format=guided` to the URL → shows Guided regardless of stored value (query wins). `/key/3977/4?format=full` → Full key scrolled to couplet 4.
- No downstream couplet text is shown anywhere in Guided mode — only the decision text of the current couplet's own choices.

- [ ] **Step 12: Delete throwaway script and commit**

```bash
rm /tmp/keyformat.test.mjs
git add modules/keys/
git commit -m "keys: guided step-through view, reachable-taxa summary, persisted format toggle"
```

---

## Task 7: Full-key current-couplet marker + return control, then visual pass

**Files:**
- Modify: `modules/keys/components/FullKeyView.vue` (highlight the current couplet; add a sticky "return to current couplet" control)
- Modify: `modules/keys/KeyView.vue` (print stylesheet, container spacing)
- Modify: any of `modules/keys/components/*.vue` as needed for the audit checks below

**Interfaces:** no prop changes. `FullKeyView` already receives `couplet` (the current couplet number, or `null`); this task adds visual treatment driven by that existing prop.

**Design amendment (2026-08-29):** In Full-key view, navigating to a couplet (clicking a couplet-number link → `:couplet` route param) scrolls you there, but after scrolling around to check other couplets it is easy to lose your place. So: (a) the current couplet's `<section>` is visually marked, and (b) a persistent control returns you to it.

- [ ] **Step 1: Current-couplet marker + return control in `modules/keys/components/FullKeyView.vue`**

On the couplet `<section>`, add a `data-current` attribute and a highlight class when it is the current couplet:

```vue
<section
  v-for="couplet in couplets"
  :key="couplet.id"
  :id="`couplet-${couplet.coupletNumber}`"
  :data-current="isCurrent(couplet) || null"
  class="mb-5 scroll-mt-24 rounded transition-colors"
  :class="isCurrent(couplet)
    ? 'ring-2 ring-secondary ring-offset-2 ring-offset-base-foreground bg-secondary/5'
    : ''"
>
```

Add, after the couplet list (still inside the component's root element), a fixed-position control shown only while a couplet is active — and hidden in print:

```vue
<button
  v-if="currentCoupletNumber"
  type="button"
  class="key-print-hide fixed bottom-4 right-4 z-40 flex items-center gap-1 rounded-full bg-primary text-primary-content text-sm px-3 py-2 shadow-lg hover:bg-primary/80"
  @click="scrollToCouplet(currentCoupletNumber)"
>↑ Couplet {{ currentCoupletNumber }}</button>
```

Script additions:

```js
const currentCoupletNumber = computed(() =>
  props.couplet != null && props.couplet !== '' ? String(props.couplet) : null
)
function isCurrent(couplet) {
  return currentCoupletNumber.value != null &&
    String(couplet.coupletNumber) === currentCoupletNumber.value
}
```

(`scrollToCouplet` already exists from Task 3; `computed` is already imported there? — Task 3's `FullKeyView` imports `{ watch, nextTick }` only, so add `computed` to that import.)

- [ ] **Step 2: Dark-mode surface in `modules/keys/KeyView.vue`**

**Reported (2026-08-29):** in dark mode the key currently renders white text directly on the page background, which is hard to read. Other TaxonPages panels place their content on an elevated `bg-base-foreground` surface (the grey card backing in dark mode). Match that.

Wrap the rendered content of the `v-else` branch (the `KeyHeader` + view + `CoupletCitation`, i.e. everything shown once the key has loaded) in a surface panel:

```vue
<div v-else class="rounded-lg border border-base-muted bg-base-foreground p-4 sm:p-6">
  <!-- header row, GuidedView / FullKeyView, CoupletCitation -->
</div>
```

Keep the outer `container mx-auto py-4` wrapper. Then check nested surfaces still read as distinct against this backing:
- `GuidedChoice` cards currently use `bg-base-foreground` too — on the new backing they will blend. Give them a visible edge: keep `border border-base-muted` and drop their `bg-base-foreground` to plain `bg-base` (or `bg-base-foreground/60`), whichever reads as a raised card in both themes.
- The current-couplet `ring` highlight from Step 1 must still be visible against `bg-base-foreground` — `ring-offset-base-foreground` already accounts for that; verify in the dark/light check.
- The fixed "↑ Couplet N" button sits above the page, not inside the panel — unaffected.

Do not hard-code colours; only swap between theme tokens.

- [ ] **Step 3: Add a print stylesheet to `modules/keys/KeyView.vue`**

Append to the component:

```vue
<style>
@media print {
  .key-print-hide { display: none !important; }
  .container { max-width: none !important; }
  a { text-decoration: none !important; color: inherit !important; }
}
</style>
```

`<FormatToggle>` already has `key-print-hide` (Task 6). Also add it to the Guided view's breadcrumb `<nav>` and "↑ back" link (navigation chrome, meaningless on paper). Forcing Full-key rendering for print is out of scope — document in the README that `?format=full` before printing gives the paginated list.

- [ ] **Step 4: Link-treatment audit**

Grep the module for link classes and confirm the rule:

Run: `grep -rn "text-secondary\|hover:underline\|target=\"_blank\"\|#couplet" modules/keys/`

Confirm:
- Breadcrumb steps, couplet-number `<RouterLink>` jumps, "from N" back-references, "show names" / "↑ back" — **no standing `text-secondary`**, only `hover:underline hover:text-secondary`.
- No literal `#couplet-` in any `:href` / `:to` (couplet navigation goes through the `:couplet` route param, not a hash — grep should show `#couplet-` only as the `id="couplet-..."` scroll target in `FullKeyView.vue`).
- `TaxonLink` — `italic text-base-content` + `hover:underline hover:text-secondary`, and every instance has `target="_blank" rel="noopener"`.
- Couplet numbers — `font-semibold` + `text-secondary-content` (colour accent is allowed here; this is reserved emphasis).

Fix any element that violates it.

- [ ] **Step 5: Dark / light check**

Run `npm run dev`, open `http://localhost:5173/#/key/3977` (SPA is hash-mode — note the `/#/`). Toggle the site theme (header sun/moon control). In BOTH themes verify:
- The key content sits on the `bg-base-foreground` panel and white/dark text reads comfortably against it (this was the reported problem — confirm it is fixed in dark mode).
- `GuidedChoice` cards and the current-couplet `ring` highlight read as distinct against the panel backing.
- Couplet numbers legible; muted text (chips, citations, figure labels) dimmer but readable; hover states visible.
- The fixed "↑ Couplet N" button (visible when a couplet is active, e.g. `/#/key/3977/4`) is legible and does not overlap key content awkwardly.
Adjust token choices only (`bg-base` vs `bg-base-foreground`, `text-base-soft` vs `text-base-content`, `border-base-muted`) — no hard-coded colours.

- [ ] **Step 6: Compile check** — `npm run build` and `npm run build:ssr` → succeed.

- [ ] **Step 7: Commit**

```bash
git add modules/keys/
git commit -m "keys: dark-mode surface, current-couplet marker + return control, visual pass"
```

---

## Task 8: Fork the keys list card (`panels/PanelKeys/`)

**Files:**
- Create: `panels/PanelKeys/main.js`
- Create: `panels/PanelKeys/PanelKeys.vue`

**Interfaces:**
- Consumes: `TaxonWorks.getKeys(otuId)` response — `{ observation_matrices: { scoped, in }, leads: { scoped, in } }`; each `leads.*` item `{ id, text }`; each `observation_matrices.*` item `{ id, name, is_media }`.
- Produces: panel id `panel:keys` (local; overrides the npm panel). Dichotomous rows link to route `dichotomous-key`; non-media matrix rows link to `interactive-key` (Task 9); media matrix rows keep the core `image-matrices-id`.

- [ ] **Step 1: Create `panels/PanelKeys/main.js`**

```js
import PanelKeys from './PanelKeys.vue'

export default {
  id: 'panel:keys',
  component: PanelKeys
}
```

- [ ] **Step 2: Create `panels/PanelKeys/PanelKeys.vue`**

Fork of the package component (`node_modules/@sfgrp/taxonpages/src/modules/otus/components/Panel/PanelKeys/PanelKeys.vue`) with only the link targets changed. Full file:

```vue
<template>
  <VCard v-if="count">
    <VCardHeader>Keys ({{ count }})</VCardHeader>
    <VCardContent>
      <template v-for="(group, key) in keys" :key="key">
        <div v-if="[...group.matrices, ...group.leads].length">
          <VTable>
            <VTableHeader>
              <VTableHeaderRow>
                <VTableHeaderCell>{{ key }}</VTableHeaderCell>
              </VTableHeaderRow>
            </VTableHeader>
            <VTableBody>
              <VTableBodyRow v-for="{ id, name, is_media } in group.matrices" :key="id">
                <VTableBodyCell>
                  <RouterLink
                    :to="{
                      name: is_media ? 'image-matrices-id' : 'interactive-key',
                      params: { id }
                    }"
                    v-text="name"
                  />
                </VTableBodyCell>
              </VTableBodyRow>
              <VTableBodyRow v-for="{ text, id } in group.leads" :key="id">
                <VTableBodyCell>
                  <RouterLink :to="{ name: 'dichotomous-key', params: { id } }" v-text="text" />
                </VTableBodyCell>
              </VTableBodyRow>
            </VTableBody>
          </VTable>
        </div>
      </template>
    </VCardContent>
  </VCard>
</template>

<script setup>
import TaxonWorks from '@/modules/otus/services/TaxonWorks.js'
import { useOtuPageRequest } from '@/modules/otus/helpers/useOtuPageRequest.js'
import { onMounted, onBeforeUnmount, ref, computed } from 'vue'

const props = defineProps({
  otuId: { type: Number }
})

const controller = new AbortController()
const keys = ref({ to: {}, in: {} })

const count = computed(
  () =>
    [...Object.values(keys.value.to), ...Object.values(keys.value.in)].flat().length
)

onMounted(() => {
  const params = { otu_id: props.otuId }

  useOtuPageRequest('panel keys', () =>
    TaxonWorks.getKeys(props.otuId, { signal: controller.signal, params })
  )
    .then(({ data }) => {
      keys.value = {
        to: { matrices: data.observation_matrices.scoped, leads: data.leads.scoped },
        in: { matrices: data.observation_matrices.in, leads: data.leads.in }
      }
    })
    .catch(() => {})
})

onBeforeUnmount(() => {
  controller?.abort()
})
</script>
```

> Verify the two `@/modules/otus/...` import paths resolve (they are package-internal but under the `@/` alias). If the build reports either as missing, check the real path under `node_modules/@sfgrp/taxonpages/src/modules/otus/` and adjust — do not copy those helper files into the project.

- [ ] **Step 3: Compile check** — `npm run build` → succeeds; discovery logs `Local panel "PanelKeys" overrides NPM package …` (benign).

- [ ] **Step 4: Browser check**

Run `npm run dev`. Open an OTU overview page known to have a dichotomous key — e.g. an Adosomus species: `http://localhost:5173/` → search "Adosomus roridus" → its page, "Overview" tab, the "Keys" panel.
Expected: the panel lists "Key to the species of Adosomus …"; clicking it navigates to `/key/<id>` (the new view), **not** `/keys/<id>`. If the OTU also has an observation matrix, that row goes to `/interactive-key/<id>` after Task 9 (until then that route 404s — acceptable mid-plan, retest in Task 9).

- [ ] **Step 5: Commit**

```bash
git add panels/PanelKeys/
git commit -m "keys: fork panel:keys list card, link dichotomous keys to the local /key route"
```

---

## Task 9: Thin fork of the interactive/matrix key (`modules/interactiveKeys/`)

**Files:**
- Create: `modules/interactiveKeys/router/index.js`
- Create: `modules/interactiveKeys/InteractiveKey.vue`
- Create: `modules/interactiveKeys/components/ImageMatrixButton.vue`

**Interfaces:**
- Produces: route `{ name: 'interactive-key', path: '/interactive-key/:id' }`.
- No behavioural change from the package view; this only moves the file into the project for routing/theming ownership (spec §10).

- [ ] **Step 1: Copy `ImageMatrixButton.vue` verbatim**

```bash
mkdir -p modules/interactiveKeys/components
cp node_modules/@sfgrp/taxonpages/src/modules/interactiveKeys/components/ImageMatrixButton.vue \
   modules/interactiveKeys/components/ImageMatrixButton.vue
```

(If that path differs, find it: `find node_modules/@sfgrp/taxonpages/src -name ImageMatrixButton.vue`.)

- [ ] **Step 2: Create `modules/interactiveKeys/router/index.js`**

```js
export default [
  {
    name: 'interactive-key',
    path: '/interactive-key/:id',
    component: () => import('../InteractiveKey.vue')
  }
]
```

- [ ] **Step 3: Create `modules/interactiveKeys/InteractiveKey.vue`**

Fork of `node_modules/@sfgrp/taxonpages/src/modules/interactiveKeys/views/InteractiveKey.vue`, unchanged except local component import. Copy that file's full contents into `modules/interactiveKeys/InteractiveKey.vue`, then change the one import line:

```js
import ImageMatrixButton from './components/ImageMatrixButton.vue'
```

Keep everything else — the `<VueInteractiveKey>` usage, the `@sfgrp/distinguish` import, the `:root` token mapping and `.distinguish-*` `<style>` block — byte-for-byte.

- [ ] **Step 4: Compile check** — `npm run build` → succeeds. Expect a discovery log line for local module `interactiveKeys`.

- [ ] **Step 5: Browser check**

Open an OTU with an observation matrix key via the forked `PanelKeys` panel (Task 8). Click the matrix row.
Expected: it loads at `/interactive-key/<id>` and renders the interactive key exactly as the package version does at `/interactive_keys/<id>` (same layout, same theming). No console errors.

- [ ] **Step 6: Commit**

```bash
git add modules/interactiveKeys/
git commit -m "keys: thin local fork of the interactive/matrix key view for routing + theming ownership"
```

---

## Task 10: Module README + manifest polish

**Files:**
- Create: `modules/keys/README.md`
- Modify: `modules/keys/package.json` (only if Task 1 left `version`/`name` needing a final value)

**Interfaces:** none.

- [ ] **Step 1: Create `modules/keys/README.md`**

```markdown
# taxonpages-module-keys

Dichotomous (couplet) key renderer for TaxonPages. Replaces the `@sfgrp/pinpoint`
default at a local route.

## What it provides

- Route `dichotomous-key` → `/key/:id/:couplet?` (`:id` is a TaxonWorks lead/key id;
  optional `:couplet` is a couplet number). **One URL per couplet** — `/key/3977/4` is
  shareable and bookmarkable, and resolves identically under SSR and client rendering
  (no URL hash: browsers don't send the fragment to the server). Both views derive their
  position from the route; Guided-mode navigation uses `router.push`, so browser Back
  walks up the key.
- Two views, toggled and remembered per viewer (`localStorage` key
  `taxonpages:key-format`; `?format=guided|full` in the query overrides and is SSR-visible;
  composes as `/key/3977/4?format=full`):
  - **Guided** — one couplet at a time, breadcrumb trail, and a "leads to N taxa"
    summary per choice instead of a wall of downstream text.
  - **Full key** — the classic numbered couplet list; couplet references navigate the
    `:couplet` param and scroll the target `id="couplet-N"` section into view.
- Per-couplet figures with a self-contained lightbox.
- Per-couplet and key-level citations (short inline form, full reference in a modal).
- A visible metadata masthead (title, taxonomic scope, description, origin citation,
  attribution, size/freshness chips) — no modal.
- Taxon links open in a new tab.

## Data

Read-only TaxonWorks API, project-token auth:
`GET /leads/key/:id`, `GET /leads` (for description + counts), and
`GET /citations?citation_object_type=Lead&citation_object_id[]=…&extend[]=source`.

## Publishing

This folder is a self-contained TaxonPages module. To distribute:

1. Ensure `package.json` has `"taxonpages": { "type": "module", "entry": "./router/index.js" }`.
2. `npm publish` (name `taxonpages-module-keys`, or scoped).
3. Consumers add it as a **direct** dependency; discovery ignores transitive deps.
   `extractBaseName` strips the `taxonpages-module-` prefix → registers as module `keys`.

It has no runtime dependency on `@sfgrp/pinpoint`. `@sfgrp/taxonpages` and `vue` are
peer dependencies. The base route path is `/key` (not `/keys`) to avoid colliding with a
host project's core `/keys/:id`; a host may disable the core `keys` module if it wants
this to own `/keys/:id` outright. To print a long key, open `?format=full` first.

The keys list card (`panel:keys`) is forked separately in `panels/PanelKeys/` and is
not part of this module.
```

- [ ] **Step 2: Final compile check** — `npm run build` and `npm run build:ssr` → succeed.

- [ ] **Step 3: Full manual walkthrough**

`npm run dev`, then:
- `/key/3977` — Guided loads by default; header complete; toggle works and persists; citation modal on couplet 1; no figures (none in data).
- Guided navigation: "Go to couplet" / breadcrumb / "↑ back" change the URL to `/key/3977/N`; browser Back walks up the key; a pasted `/key/3977/6` deep-links straight to couplet 6.
- Switch to Full key — numbered list; couplet references navigate `:couplet` and scroll; `/key/3977/4?format=full` loads scrolled to couplet 4; taxon links open new tabs.
- `npm run dev:ssr` (`http://localhost:6173`): `/key/3977/4` renders without error and settles on couplet 4 after hydration; no hydration-mismatch warnings in the console.
- OTU overview for an Adosomus species — "Keys" panel lists the key, links to `/key/3977`.
- No console errors in either view or either theme.

- [ ] **Step 4: Commit**

```bash
git add modules/keys/README.md modules/keys/package.json
git commit -m "keys: module README and publish notes"
```

---

## Self-review notes

- **Spec §3.1 file layout** — Tasks 1–10 create every file listed except `useKey.js`, which was intentionally dropped: its role (fetch orchestration + derived data) lives in `KeyView.vue` + `lib/tree.js`, matching this repo's "component fetches, `lib/` transforms" pattern (prior plan). No separate store is needed — the Guided view holds no navigation state at all; the current couplet is a pure function of `route.params.couplet` via `coupletByNumber`.
- **Spec §3.2 one URL per couplet + §3.3 SSR** — route `/key/:id/:couplet?` (Task 1); both views take `keyId` + `couplet` props from `route.params` (Tasks 3, 6); no URL hash anywhere (Task 7 Step 2 greps to confirm `#couplet-` appears only as a scroll-target `id`); Guided navigation is `RouterLink`/`router.push` so Back walks up the key; `dev:ssr` deep-link check in Tasks 6 & 10.
- **Spec §4 three calls** — call 1 Task 1, call 2 Task 2, call 3 Task 5.
- **Spec §5 formats + toggle** — Full key Task 3, Guided Task 6, toggle + persistence Task 6, `?format=` override Task 6 (`resolveFormat`, Node-tested); `localStorage` pref applied post-mount (no SSR mismatch).
- **Spec §5.1 "leads to" / no downstream text** — `ReachableTaxa.vue` (Task 6) + `descendantOtus` (Task 1, Node-tested).
- **Spec §5.2 couplet references / back-jumps** — `FullKeyView.vue`: `id="couplet-N"` scroll targets, `<RouterLink>` to the `:couplet` param for couplet-number targets and "from N", scroll-into-view watcher (Task 3).
- **Spec §6 figures + lightbox** — Task 4; `KeyLightbox` is `Teleport` + `ClientOnly`, keyboard + focus-trap, keys-local (no `panels/_shared`).
- **Spec §7 masthead, no modal** — `KeyHeader.vue` (Task 2); title/description/scope/citation always visible; only the *full reference* is behind a click, consistent with `DwcTable`.
- **Spec §8 link-on-hover, reserved emphasis, print** — Task 7.
- **Spec §9 PanelKeys fork** — Task 8.
- **Spec §10 interactive-key thin fork** — Task 9 (kept, per approval).
- **Spec §3.4 distributability** — no `panels/`/`config/`/`_shared/` imports in `modules/keys/`; manifest Task 1; README Task 10.
- **Global constraint "links text-coloured until hover"** — enforced in every component and re-audited in Task 7 Step 2.
- **Type consistency** — `Node` fields (`isCouplet`, `coupletNumber`, `targetType`, `targetId`, `targetLabel`, `targetLink`, `figures`, `children`) defined in Task 1, used unchanged in Tasks 3–9. `coupletByNumber(value, nodes)` (Task 1) consumed by `GuidedView` (Task 6). `keyId` + `couplet` props: `FullKeyView` (Task 3) and `GuidedView` (Task 6) take `keyId: [String, Number]` and `couplet: { type: String, default: null }` (a nullable string — `null`/`undefined` skip Vue's type check; do NOT write `type: [String, null]`, `null` is not a valid type constructor), passed from `route.params.id` / `route.params.couplet ?? null` in `KeyView` — the Task 5 `KeyView` template snippet keeps these props (noted inline). `citations` map shape `{ id, short, full }[]` produced in Task 5, consumed by `LeadText` (Task 3) which tolerates an empty `{}` until then. `format` values `'guided'|'full'` consistent across `format.js`, `FormatToggle`, `KeyView`.
- **Known unverified point** — `figures[]` field names (`figure_label` vs `label`, whether `thumb`/`medium` are directly usable as `<img src>`); code reads both spellings and Task 4 Step 4 is a structural check with a fake figure. Revisit when the first real Lead depiction exists in the data.
- **Route collision** — new paths `/key/:id/:couplet?` and `/interactive-key/:id` deliberately differ from core `/keys/:id` and `/interactive_keys/:id`; core routes remain registered but nothing links to them after Task 8.
