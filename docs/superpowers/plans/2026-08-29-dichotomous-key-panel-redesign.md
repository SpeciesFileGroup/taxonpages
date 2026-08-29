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

(`key-print-hide` is styled in Task 8; harmless until then.)

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

## Task 7: Key completeness check (`lib/completeness.js` + header chip/report)

**Files:**
- Create: `modules/keys/lib/completeness.js`
- Modify: `modules/keys/KeyView.vue` (resolve scope descendants + terminal ranks, compute `completeness`, pass to `KeyHeader`)
- Modify: `modules/keys/components/KeyHeader.vue` (a fourth chip + a report modal)
- Test: throwaway `/tmp/keycompleteness.test.mjs`

**Interfaces:**
- Consumes: `Node` shape from Task 1 (`isCouplet`, `targetType`, `targetId`); `listMeta.otu_id` from Task 2's call 2; `makeAPIRequest`.
- Produces:
  - `lib/completeness.js`:
    - `finestRank(ranks: string[]): string | null` — the finest (most nested) rank among `ranks`, using `RANK_ORDER` (coarse→fine); ranks are normalised (lowercased, last `::` / `/` segment taken); unknown ranks are ignored; `null` when nothing usable.
    - `assessCompleteness({ terminals, descendants }): { targetRank, expectedCount, coveredCount, covered: string[], missing: string[], outOfScope: string[], isComplete: boolean } | null`
      - `terminals`: `Array<{ taxonNameId: number, rank: string, label: string }>` — the key's OTU-target leaves resolved to a valid taxon-name id + rank
      - `descendants`: `Array<{ taxonNameId: number, rank: string, name: string, valid: boolean }>` — valid descendants of the key's scope taxon
      - `targetRank = finestRank(terminals.map(t => t.rank))`; `null` targetRank → return `null` (no chip)
      - `expected` = `descendants` with `valid && normalisedRank === targetRank`
      - `covered` = `expected` whose `taxonNameId` is in the set of `terminals` taxon-name ids
      - `missing` = `expected.name` minus `covered` (sorted, locale)
      - `outOfScope` = `terminals` at `targetRank` whose `taxonNameId` is not in `descendants` (referenced but not under scope), by `label`
      - `isComplete = missing.length === 0 && outOfScope.length === 0`
  - `KeyView.vue`: a `completeness` ref (`null` until resolved), populated by a fire-and-forget `loadCompleteness()`; passed to `<KeyHeader :completeness="completeness" />`.
  - `KeyHeader.vue`: new prop `completeness: { type: Object, default: null }`; a chip (after the three existing chips) shown only when `completeness` is set; click opens a `VModal` report.

- [ ] **Step 1: Write the failing test**

Create `/tmp/keycompleteness.test.mjs`:

```js
import assert from 'node:assert/strict'
import { finestRank, assessCompleteness } from '/home/jakobj/Data/01Aktuelle_Projekte/0_TaxonWorks/TaxonPagesDev/taxa/modules/keys/lib/completeness.js'

// finestRank: species is finer than subgenus/genus; unknowns ignored; empty -> null
assert.equal(finestRank(['genus', 'subgenus', 'species']), 'species')
assert.equal(finestRank(['subgenus', 'subgenus']), 'subgenus')
assert.equal(finestRank(['NomenclaturalRank::Iczn::SpeciesGroup::Species', 'subgenus']), 'species')
assert.equal(finestRank(['weird', 'genus']), 'genus')
assert.equal(finestRank([]), null)
assert.equal(finestRank(['weird']), null)

// assessCompleteness: genus scope, key ends at species (with a subgenus also keyed out)
const descendants = [
  { taxonNameId: 1, rank: 'species',  name: 'Aus aus',   valid: true },
  { taxonNameId: 2, rank: 'species',  name: 'Aus bus',   valid: true },
  { taxonNameId: 3, rank: 'species',  name: 'Aus cus',   valid: true },
  { taxonNameId: 4, rank: 'subgenus', name: 'Aus (Aus)', valid: true },
  { taxonNameId: 5, rank: 'species',  name: 'Aus dus',   valid: false } // invalid -> not expected
]
const terminals = [
  { taxonNameId: 1, rank: 'species',  label: 'Aus aus L.' },
  { taxonNameId: 2, rank: 'species',  label: 'Aus bus L.' },
  { taxonNameId: 4, rank: 'subgenus', label: 'Aus (Aus)' },      // coarser than target, ignored for expected
  { taxonNameId: 99, rank: 'species', label: 'Xus xus' }         // not under scope
]
const r = assessCompleteness({ terminals, descendants })
assert.equal(r.targetRank, 'species')
assert.equal(r.expectedCount, 3)          // taxonNameId 1,2,3 (4 is subgenus, 5 invalid)
assert.equal(r.coveredCount, 2)           // 1,2
assert.deepEqual(r.missing, ['Aus cus'])  // 3 not keyed out
assert.deepEqual(r.outOfScope, ['Xus xus']) // terminal at species rank, not in descendants
assert.equal(r.isComplete, false)

// complete case
const r2 = assessCompleteness({
  terminals: [
    { taxonNameId: 1, rank: 'species', label: 'Aus aus' },
    { taxonNameId: 2, rank: 'species', label: 'Aus bus' },
    { taxonNameId: 3, rank: 'species', label: 'Aus cus' }
  ],
  descendants
})
assert.equal(r2.isComplete, true)
assert.deepEqual(r2.missing, [])

// no usable rank -> null
assert.equal(assessCompleteness({ terminals: [], descendants }), null)

console.log('All keycompleteness tests passed.')
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node /tmp/keycompleteness.test.mjs`
Expected: FAIL — `Cannot find module '.../modules/keys/lib/completeness.js'`

- [ ] **Step 3: Create `modules/keys/lib/completeness.js`**

```js
// Pure. Given the key's terminal taxa (with ranks) and the valid descendants of the
// key's scope taxon (with ranks), decide the rank the key operates at and whether every
// taxon of that rank in scope is keyed out. No Vue, no network — Node-testable.

// Coarse -> fine. Anything not listed is "unknown" and ignored by finestRank.
const RANK_ORDER = [
  'kingdom', 'subkingdom', 'phylum', 'subphylum', 'superclass', 'class', 'subclass',
  'infraclass', 'superorder', 'order', 'suborder', 'infraorder', 'superfamily',
  'family', 'subfamily', 'tribe', 'subtribe', 'genus', 'subgenus', 'section',
  'subsection', 'series', 'subseries', 'species group', 'species', 'subspecies',
  'variety', 'subvariety', 'form', 'subform'
]

function normRank(rank) {
  if (!rank) return ''
  let r = String(rank)
  if (r.includes('::')) r = r.split('::').pop()
  if (r.includes('/')) r = r.split('/').pop()
  // "SpeciesGroup::Species" style already handled; camelCase leaf -> spaced words
  r = r.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().trim()
  return r
}

export function finestRank(ranks) {
  let best = -1
  for (const raw of ranks || []) {
    const idx = RANK_ORDER.indexOf(normRank(raw))
    if (idx > best) best = idx
  }
  return best === -1 ? null : RANK_ORDER[best]
}

export function assessCompleteness({ terminals, descendants }) {
  const terms = Array.isArray(terminals) ? terminals : []
  const descs = Array.isArray(descendants) ? descendants : []

  const targetRank = finestRank(terms.map((t) => t.rank))
  if (!targetRank) return null

  const termIds = new Set(terms.map((t) => t.taxonNameId).filter((x) => x != null))
  const descIds = new Set(descs.map((d) => d.taxonNameId).filter((x) => x != null))

  const expected = descs.filter((d) => d.valid && normRank(d.rank) === targetRank)
  const covered = expected.filter((d) => termIds.has(d.taxonNameId))
  const coveredIds = new Set(covered.map((d) => d.taxonNameId))

  const missing = expected
    .filter((d) => !coveredIds.has(d.taxonNameId))
    .map((d) => d.name)
    .sort((a, b) => String(a).localeCompare(String(b)))

  const outOfScope = terms
    .filter((t) => normRank(t.rank) === targetRank && !descIds.has(t.taxonNameId))
    .map((t) => t.label)
    .sort((a, b) => String(a).localeCompare(String(b)))

  return {
    targetRank,
    expectedCount: expected.length,
    coveredCount: covered.length,
    covered: covered.map((d) => d.name),
    missing,
    outOfScope,
    isComplete: missing.length === 0 && outOfScope.length === 0
  }
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node /tmp/keycompleteness.test.mjs`
Expected: `All keycompleteness tests passed.`

- [ ] **Step 5: Wire `loadCompleteness()` into `modules/keys/KeyView.vue`**

Script — add the import and a ref:

```js
import { assessCompleteness } from './lib/completeness.js'
const completeness = ref(null)
```

Add this function (mirrors `loadCitations` — fire-and-forget, never throws):

```js
async function loadCompleteness(scopeOtuId, nodeMap) {
  completeness.value = null
  const terminalOtuIds = Object.values(nodeMap)
    .filter((n) => !n.isCouplet && n.targetType === '/api/v1/otus' && n.targetId != null)
    .map((n) => n.targetId)
  if (!scopeOtuId || !terminalOtuIds.length) return
  try {
    // scope OTU -> its taxon-name id
    const { data: scopeOtu } = await makeAPIRequest.get(`/otus/${scopeOtuId}`)
    const scopeTnId = scopeOtu?.taxon_name_id
    if (!scopeTnId) return

    // valid descendants of the scope taxon (id + rank + name)
    const dq = new URLSearchParams()
    dq.append('taxon_name_id[]', scopeTnId)
    dq.set('descendants', 'true')
    dq.set('validity', 'true')
    dq.set('per', '500')
    const { data: descRaw } = await makeAPIRequest.get(`/taxon_names?${dq.toString()}`)
    const descendants = (Array.isArray(descRaw) ? descRaw : []).map((d) => ({
      taxonNameId: d.id,
      rank: d.rank,
      name: [d.cached || d.name, d.cached_author_year].filter(Boolean).join(' '),  // Amendment A5: with authorship
      valid: d.cached_is_valid !== false
    }))

    // terminal OTUs -> taxon-name ids
    const oq = new URLSearchParams()
    terminalOtuIds.forEach((id) => oq.append('otu_id[]', id))
    oq.set('per', '500')
    const { data: otuRaw } = await makeAPIRequest.get(`/otus?${oq.toString()}`)
    const termTnIds = [...new Set((Array.isArray(otuRaw) ? otuRaw : [])
      .map((o) => o.taxon_name_id).filter(Boolean))]
    if (!termTnIds.length) return

    // ranks for the terminal taxon-names (some may already be in `descendants`, but fetch
    // all so out-of-scope terminals still get a rank)
    const tq = new URLSearchParams()
    termTnIds.forEach((id) => tq.append('taxon_name_id[]', id))
    tq.set('per', '500')
    const { data: tnRaw } = await makeAPIRequest.get(`/taxon_names?${tq.toString()}`)
    const terminals = (Array.isArray(tnRaw) ? tnRaw : []).map((t) => ({
      taxonNameId: t.cached_valid_taxon_name_id || t.id,
      rank: t.rank,
      label: [t.cached || t.name, t.cached_author_year].filter(Boolean).join(' ')  // Amendment A5: with authorship
    }))

    completeness.value = assessCompleteness({ terminals, descendants })
  } catch (e) {
    completeness.value = null
  }
}
```

In `load()`, right after `loadCitations(Object.keys(nodes.value))`, add:

```js
loadCompleteness(list_row_otu_id_here, nodes.value)
```

where the scope OTU id is the one already resolved into `listMeta.value.otu_id` — so call it **after** `listMeta.value` is set:

```js
listMeta.value = (Array.isArray(list) ? list : []).find((r) => r.id === Number(id)) || {}
loadCompleteness(listMeta.value.otu_id, nodes.value)
```

Template — add the prop:

```vue
<KeyHeader class="flex-1" :meta="meta" :completeness="completeness" />
```

- [ ] **Step 6: Chip + report modal in `modules/keys/components/KeyHeader.vue`**

Add the prop:

```js
const props = defineProps({
  meta: { type: Object, required: true },
  completeness: { type: Object, default: null }
})
const showCompleteness = ref(false)
```

In the chip row, after the `updatedInWords` chip, add:

```vue
<button
  v-if="completeness"
  type="button"
  class="border rounded px-2 py-0.5"
  :class="completeness.isComplete
    ? 'border-base-muted text-base-soft'
    : 'border-danger text-danger'"
  @click="showCompleteness = true"
  @keydown.enter="showCompleteness = true"
  @keydown.space.prevent="showCompleteness = true"
>{{ completeness.isComplete
  ? `complete (${completeness.expectedCount} ${completeness.targetRank})`
  : `${completeness.coveredCount} / ${completeness.expectedCount} ${completeness.targetRank}` }}</button>
```

Add the modal (next to the existing citation `VModal`):

```vue
<VModal v-if="showCompleteness && completeness" @close="showCompleteness = false">
  <template #header><div class="text-sm font-medium">Completeness</div></template>
  <div class="px-4 pb-4 text-sm space-y-2 [&_i]:italic">
    <p class="text-base-content">
      Keyed at <strong>{{ completeness.targetRank }}</strong> level —
      {{ completeness.coveredCount }} of {{ completeness.expectedCount }} in the key's scope.
    </p>
    <div v-if="completeness.missing.length">
      <p class="text-base-soft">Missing ({{ completeness.missing.length }}):</p>
      <ul class="list-disc ml-5">
        <li v-for="n in completeness.missing" :key="n"><i>{{ n }}</i></li>
      </ul>
    </div>
    <div v-if="completeness.outOfScope.length">
      <p class="text-base-soft">Referenced but outside the key's scope:</p>
      <ul class="list-disc ml-5">
        <li v-for="n in completeness.outOfScope" :key="n">{{ n }}</li>
      </ul>
    </div>
    <p v-if="completeness.isComplete" class="text-base-content">
      Every {{ completeness.targetRank }} in scope is keyed out.
    </p>
  </div>
</VModal>
```

(`border-danger` / `text-danger` are existing theme tokens — `KeyView.vue`'s error state already uses `text-danger`.)

- [ ] **Step 7: Run the throwaway test again, then delete it**

```bash
node /tmp/keycompleteness.test.mjs   # expect: All keycompleteness tests passed.
rm /tmp/keycompleteness.test.mjs
```

- [ ] **Step 8: Compile check** — `npm run build` and `npm run build:ssr` → succeed.

- [ ] **Step 9: Browser check**

`npm run dev`, open `http://localhost:5173/#/key/3977` (SPA is hash-mode).
Expected: a fourth chip next to "updated 6 months ago". Key #3977's own title says *A. grigorievi* and *A. albosquamus* are missing — the descendants query returns 9 valid species of *Adosomus*; the key keys out 7 (`otus_count` is 9 but 2 of those OTUs are subgenera). So the chip should read roughly `7 / 9 species` in `text-danger`; clicking it lists *Adosomus (Xeradosomus) albisquamus* and *Adosomus (Xeradosomus) grigorievi* under "Missing". (Exact counts depend on the live data — the point is: a red "N / M species" chip, and the two names the title mentions appear in the Missing list.)

- [ ] **Step 10: Commit**

```bash
git add modules/keys/
git commit -m "keys: taxonomic completeness check — auto-detected rank, header chip + report"
```

---

## Task 8: Full-key current-couplet marker + return control, then visual pass

**Files:**
- Modify: `modules/keys/components/FullKeyView.vue` (highlight the current couplet; add a sticky "return to current couplet" control)
- Modify: `modules/keys/KeyView.vue` (print stylesheet, container spacing)
- Modify: any of `modules/keys/components/*.vue` as needed for the audit checks below

**Interfaces:** no prop changes. `FullKeyView` already receives `couplet` (the current couplet number, or `null`); this task adds visual treatment driven by that existing prop.

**Design amendment (2026-08-29):** In Full-key view, navigating to a couplet (clicking a couplet-number link → `:couplet` route param) scrolls you there, but after scrolling around to check other couplets it is easy to lose your place. So: (a) the current couplet's `<section>` is visually marked, and (b) a persistent control returns you to it.

**Bug fix folded in (2026-08-29): "couplet N" links don't jump.** The framework router's `scrollBehavior` (`node_modules/@sfgrp/taxonpages/src/router/index.js:42`) returns `{ top: 0 }` for every hashless navigation — and our couplet URLs (`/key/:id/:couplet`, or `#/key/:id/:couplet` in the SPA's hash mode) carry no secondary hash — so every couplet navigation scrolls the window to top, and Task 3's `nextTick(...scrollIntoView)` loses the race. Fix: defer our scroll past the router's, in `scrollToCouplet` (Step 1a below). This also fixes the "↑ Couplet N" return button, which calls the same function.

- [ ] **Step 1: Current-couplet marker + return control + scroll fix in `modules/keys/components/FullKeyView.vue`**

**1a — fix `scrollToCouplet` so the jump wins the race with the router's `{ top: 0 }`.** Replace Task 3's `scrollToCouplet` body with a double-`requestAnimationFrame` deferral after `nextTick` (rAF fires after the router has applied its own scroll on nav-resolve), and change the import to `{ watch, nextTick, computed }`:

```js
function scrollToCouplet(n) {
  if (n == null || n === '' || typeof document === 'undefined') return
  nextTick(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById(`couplet-${n}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    })
  })
}
```

Keep the two existing watchers (`watch(() => props.couplet, scrollToCouplet, { immediate: true })` and `watch(() => props.couplets, () => scrollToCouplet(props.couplet))`).

**1b — current-couplet marker.** On the couplet `<section>`, add a `data-current` attribute and a highlight class when it is the current couplet:

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

**1c — return control.** Add, after the couplet list (still inside the component's root element), a fixed-position button shown only while a couplet is active — and hidden in print:

```vue
<button
  v-if="currentCoupletNumber"
  type="button"
  class="key-print-hide fixed bottom-4 right-4 z-40 flex items-center gap-1 rounded-full bg-primary text-primary-content text-sm px-3 py-2 shadow-lg hover:bg-primary/80"
  @click="scrollToCouplet(currentCoupletNumber)"
>↑ Couplet {{ currentCoupletNumber }}</button>
```

Script additions for 1b/1c:

```js
const currentCoupletNumber = computed(() =>
  props.couplet != null && props.couplet !== '' ? String(props.couplet) : null
)
function isCurrent(couplet) {
  return currentCoupletNumber.value != null &&
    String(couplet.coupletNumber) === currentCoupletNumber.value
}
```

(`computed` was added to the `vue` import in 1a.)

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

- [ ] **Step 3: Make included vs missing striking in `modules/keys/components/CompletenessReport.vue` (Amendment A11)**

**Reported (2026-08-29):** in the completeness modal the ✓/✗ marks are tiny and both rows
read as the same blue link — you can't tell at a glance which taxa the key covers. Make the
contrast unmistakable. There is a `--color-success` theme token (`text-success` / `bg-success`
/ `border-success` utilities work).

- Each member row is a flex row with a **fixed-width marker column** (`w-5 shrink-0
  text-center`), not an inline glyph: `✓` in `text-success`, `✗` in `text-danger`, both
  `font-semibold`.
- **Missing** rows get standing emphasis: the name (`TaxRefLink`) in `text-danger
  font-medium`, and the row carries `border-l-2 border-danger pl-2 -ml-2` (or a subtle
  `bg-danger/5 rounded`) so missing rows visibly stand out from the list.
- **Included** rows stay quiet: normal link colour, normal weight, just the green `✓`.
- After each group heading, a small `text-base-soft` summary: `({{ covered }} / {{ total }}
  keyed out)` — count `members` by `status`.
- Synonyms stay as they are (indented, `= `, linked, muted).
- Fix the stray space in the summary line ("… in the key's scope ." → "… in the key's
  scope.").

`TaxRefLink.vue` may need a `class` / `emphasis` prop, or wrap it — but the ✗ marker + the
`border-l` + `text-danger` on the row container is enough; keep `TaxRefLink` itself generic.
Theme tokens only.

- [ ] **Step 4: Add a print stylesheet to `modules/keys/KeyView.vue`**

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

- [ ] **Step 5: Link-treatment audit**

Grep the module for link classes and confirm the rule:

Run: `grep -rn "text-secondary\|hover:underline\|target=\"_blank\"\|#couplet" modules/keys/`

Confirm:
- Breadcrumb steps, couplet-number `<RouterLink>` jumps, "from N" back-references, "show names" / "↑ back" — **no standing `text-secondary`**, only `hover:underline hover:text-secondary`.
- No literal `#couplet-` in any `:href` / `:to` (couplet navigation goes through the `:couplet` route param, not a hash — grep should show `#couplet-` only as the `id="couplet-..."` scroll target in `FullKeyView.vue`).
- `TaxonLink` — `italic text-base-content` + `hover:underline hover:text-secondary`, and every instance has `target="_blank" rel="noopener"`.
- Couplet numbers — `font-semibold` + `text-secondary-content` (colour accent is allowed here; this is reserved emphasis).

Fix any element that violates it.

- [ ] **Step 6: Dark / light check**

Run `npm run dev`, open `http://localhost:5173/#/key/3977` (SPA is hash-mode — note the `/#/`). Toggle the site theme (header sun/moon control). In BOTH themes verify:
- The key content sits on the `bg-base-foreground` panel and white/dark text reads comfortably against it (this was the reported problem — confirm it is fixed in dark mode).
- `GuidedChoice` cards and the current-couplet `ring` highlight read as distinct against the panel backing.
- Couplet numbers legible; muted text (chips, citations, figure labels) dimmer but readable; hover states visible.
- The completeness chip (Task 7) — the `text-danger`/`border-danger` incomplete state and the neutral `complete` state both read clearly in dark and light.
- The fixed "↑ Couplet N" button (visible when a couplet is active, e.g. `/#/key/3977/4`) is legible and does not overlap key content awkwardly.
Adjust token choices only (`bg-base` vs `bg-base-foreground`, `text-base-soft` vs `text-base-content`, `border-base-muted`) — no hard-coded colours.

- [ ] **Step 7: Compile check** — `npm run build` and `npm run build:ssr` → succeed.

- [ ] **Step 8: Commit**

```bash
git add modules/keys/
git commit -m "keys: dark surface, current-couplet marker + return control, striking completeness report, visual pass"
```

---

## Task 9: Fork the keys list card (`panels/PanelKeys/`)

**Files:**
- Create: `panels/PanelKeys/main.js`
- Create: `panels/PanelKeys/PanelKeys.vue`

**Interfaces:**
- Consumes: `TaxonWorks.getKeys(otuId)` response — `{ observation_matrices: { scoped, in }, leads: { scoped, in } }`; each `leads.*` item `{ id, text }`; each `observation_matrices.*` item `{ id, name, is_media }`.
- Produces: panel id `panel:keys` (local; overrides the npm panel). Dichotomous rows link to route `dichotomous-key`; non-media matrix rows link to `interactive-key` (Task 10); media matrix rows keep the core `image-matrices-id`.

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
Expected: the panel lists "Key to the species of Adosomus …"; clicking it navigates to `/key/<id>` (the new view), **not** `/keys/<id>`. If the OTU also has an observation matrix, that row goes to `/interactive-key/<id>` after Task 10 (until then that route 404s — acceptable mid-plan, retest in Task 10).

- [ ] **Step 5: Commit**

```bash
git add panels/PanelKeys/
git commit -m "keys: fork panel:keys list card, link dichotomous keys to the local /key route"
```

---

## Task 10: Thin fork of the interactive/matrix key (`modules/interactiveKeys/`)

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

Open an OTU with an observation matrix key via the forked `PanelKeys` panel (Task 9). Click the matrix row.
Expected: it loads at `/interactive-key/<id>` and renders the interactive key exactly as the package version does at `/interactive_keys/<id>` (same layout, same theming). No console errors.

- [ ] **Step 6: Commit**

```bash
git add modules/interactiveKeys/
git commit -m "keys: thin local fork of the interactive/matrix key view for routing + theming ownership"
```

---

## Task 11: Module README + manifest polish

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

## Task 12: Completeness report — grouped, linked, synonym-aware taxon listing (Amendment A8)

> **Execution order:** runs after Task 7, **before Task 8**. Depends on Task 7's
> `lib/completeness.js` (`finestRank`) and its `KeyView.loadCompleteness` scaffolding.

**Asked (A8):** the completeness report should also list the **included** species (not only
missing), every listed taxon a **new-tab** link to its OTU page, and the whole listing
presented like the OTU page's "Descendants" tab — **grouped by subgenus, synonyms shown,
sorted**.

**Files:**
- Modify: `modules/keys/lib/completeness.js` (add `buildCompletenessReport`, pure, Node-tested)
- Modify: `modules/keys/KeyView.vue` (`loadCompleteness` → fetch synonyms + OTU ids, call the new builder, `provide` a synonymy map for Task 13)
- Create: `modules/keys/components/CompletenessReport.vue`
- Modify: `modules/keys/components/KeyHeader.vue` (modal body → `<CompletenessReport>`)
- Test: throwaway `/tmp/keyreport.test.mjs`

**Interfaces:**
- `buildCompletenessReport({ scopeRank, descendants, terminalTnIds, tnIdToOtuId, outOfScopeTerminals }): Report`
  - `scopeRank: string` — rank of the key's scope taxon (e.g. `'genus'`)
  - `descendants: Array<{ id, parentId, rank, name, authorYear, valid, validId }>` — every
    descendant of the scope taxon **including synonyms** (`valid:false`, `validId` = the
    valid taxon-name id it points at); `name` is the bare `cached`, `authorYear` the
    `cached_author_year`
  - `terminalTnIds: number[]` — valid taxon-name ids the key keys out (synonym terminals
    already folded to their valid id)
  - `tnIdToOtuId: Record<number, number>` — taxon-name id → an OTU id (for links); may be
    partial
  - `outOfScopeTerminals: Array<{ label, otuId }>` — key terminals not under the scope taxon
  - **Report** = `{ targetRank, expectedCount, coveredCount, missing: string[], outOfScope: string[], isComplete, groups, ungrouped }`
    — the first six keep `assessCompleteness`'s contract (so `KeyHeader`'s chip is unchanged);
    `missing` / `outOfScope` strings carry authorship (A5).
    - `groups: Array<{ taxon: TaxRef, members: Member[] }>` — one per grouping-rank taxon
      (the rank between `scopeRank` and `targetRank` that actually parents target-rank taxa),
      sorted by `taxon.name`
    - `ungrouped: Member[]` — target-rank taxa whose parent is the scope itself
    - `Member = { taxon: TaxRef, status: 'included'|'missing', synonyms: TaxRef[] }`, members
      sorted by `taxon.name`
    - `TaxRef = { id, otuId: number|null, name, authorYear }`
- `CompletenessReport.vue` props `{ report: Object }`.
- `KeyView` adds `provide('keySynonymy', <ref/computed of Record<otuId,{validName}>>)` for
  Task 13 (built from `descendants` synonyms whose valid target is a key terminal / any
  terminal OTU that resolves to a synonym name).

- [ ] **Step 1: Write the failing test** — `/tmp/keyreport.test.mjs`

```js
import assert from 'node:assert/strict'
import { buildCompletenessReport } from '/home/jakobj/Data/01Aktuelle_Projekte/0_TaxonWorks/TaxonPagesDev/taxa/modules/keys/lib/completeness.js'

// genus "Aus" -> 2 subgenera, 3 species, 1 synonym of species 12
const descendants = [
  { id: 20, parentId: 1,  rank: 'subgenus', name: 'Aus (Aus)',  authorYear: 'L., 1900', valid: true,  validId: 20 },
  { id: 21, parentId: 1,  rank: 'subgenus', name: 'Aus (Bus)',  authorYear: 'L., 1901', valid: true,  validId: 21 },
  { id: 11, parentId: 20, rank: 'species',  name: 'Aus aus',    authorYear: '(Fabr., 1777)', valid: true, validId: 11 },
  { id: 12, parentId: 20, rank: 'species',  name: 'Aus bus',    authorYear: 'Voss, 1937',    valid: true, validId: 12 },
  { id: 13, parentId: 21, rank: 'species',  name: 'Aus cus',    authorYear: 'Heller, 1923',  valid: true, validId: 13 },
  { id: 99, parentId: 20, rank: 'species',  name: 'Aus vetus',  authorYear: 'Old, 1850',     valid: false, validId: 12 }
]
const r = buildCompletenessReport({
  scopeRank: 'genus',
  descendants,
  terminalTnIds: [11, 13],                 // key keys out aus + cus, NOT bus
  tnIdToOtuId: { 11: 511, 12: 512, 13: 513, 20: 520, 21: 521, 99: 599 },
  outOfScopeTerminals: [{ label: 'Xus xus L.', otuId: 700 }]
})

assert.equal(r.targetRank, 'species')
assert.equal(r.expectedCount, 3)
assert.equal(r.coveredCount, 2)
assert.deepEqual(r.missing, ['Aus bus Voss, 1937'])
assert.deepEqual(r.outOfScope, ['Xus xus L.'])
assert.equal(r.isComplete, false)

// grouped by subgenus, sorted
assert.deepEqual(r.groups.map((g) => g.taxon.name), ['Aus (Aus)', 'Aus (Bus)'])
const ausGrp = r.groups[0]
assert.deepEqual(ausGrp.members.map((m) => [m.taxon.name, m.status]),
  [['Aus aus', 'included'], ['Aus bus', 'missing']])
assert.equal(ausGrp.members[0].taxon.otuId, 511)
// synonym attached to its valid species, carries its own otuId + authorship
assert.deepEqual(ausGrp.members[1].synonyms.map((s) => [s.name, s.authorYear, s.otuId]),
  [['Aus vetus', 'Old, 1850', 599]])
assert.deepEqual(r.groups[1].members.map((m) => [m.taxon.name, m.status]), [['Aus cus', 'included']])
assert.equal(r.ungrouped.length, 0)

console.log('All keyreport tests passed.')
```

- [ ] **Step 2: Run it — expect FAIL** (`buildCompletenessReport` not exported).

- [ ] **Step 3: Implement `buildCompletenessReport` in `modules/keys/lib/completeness.js`**

Append (reuse the file's existing `normRank` / `finestRank`):

```js
function taxRef(d, tnIdToOtuId) {
  return { id: d.id, otuId: tnIdToOtuId[d.id] ?? null, name: d.name, authorYear: d.authorYear || '' }
}
const authored = (d) => [d.name, d.authorYear].filter(Boolean).join(' ')

export function buildCompletenessReport({
  scopeRank, descendants, terminalTnIds, tnIdToOtuId = {}, outOfScopeTerminals = []
}) {
  const descs = Array.isArray(descendants) ? descendants : []
  const termSet = new Set((terminalTnIds || []).filter((x) => x != null))
  const byId = new Map(descs.map((d) => [d.id, d]))

  const valid = descs.filter((d) => d.valid)
  const targetRank = finestRank(
    valid.filter((d) => termSet.has(d.id)).map((d) => d.rank)
  ) || finestRank(valid.map((d) => d.rank))
  if (!targetRank) return null

  const norm = (r) => normRank(r)
  const scope = norm(scopeRank)

  const synsByValidId = new Map()
  for (const d of descs) {
    if (!d.valid && d.validId != null) {
      if (!synsByValidId.has(d.validId)) synsByValidId.set(d.validId, [])
      synsByValidId.get(d.validId).push(taxRef(d, tnIdToOtuId))
    }
  }

  const targetTaxa = valid.filter((d) => norm(d.rank) === targetRank)
  const isIncluded = (d) =>
    termSet.has(d.id) || (synsByValidId.get(d.id) || []).some((s) => termSet.has(s.id))

  const mkMember = (d) => ({
    taxon: taxRef(d, tnIdToOtuId),
    status: isIncluded(d) ? 'included' : 'missing',
    synonyms: (synsByValidId.get(d.id) || []).sort((a, b) => a.name.localeCompare(b.name))
  })

  // grouping rank = parent rank of target taxa when that parent is finer than scope
  const groupMap = new Map() // parentId -> { taxon, members }
  const ungrouped = []
  for (const d of targetTaxa) {
    const parent = d.parentId != null ? byId.get(d.parentId) : null
    if (parent && norm(parent.rank) !== scope) {
      if (!groupMap.has(parent.id)) groupMap.set(parent.id, { taxon: taxRef(parent, tnIdToOtuId), members: [] })
      groupMap.get(parent.id).members.push(mkMember(d))
    } else {
      ungrouped.push(mkMember(d))
    }
  }
  const bySortName = (a, b) => a.taxon.name.localeCompare(b.taxon.name)
  const groups = [...groupMap.values()]
    .map((g) => ({ ...g, members: g.members.sort(bySortName) }))
    .sort((a, b) => a.taxon.name.localeCompare(b.taxon.name))
  ungrouped.sort(bySortName)

  const covered = targetTaxa.filter(isIncluded)
  const missing = targetTaxa.filter((d) => !isIncluded(d)).map(authored)
    .sort((a, b) => a.localeCompare(b))
  const outOfScope = (outOfScopeTerminals || []).map((t) => t.label)
    .sort((a, b) => String(a).localeCompare(String(b)))

  return {
    targetRank,
    expectedCount: targetTaxa.length,
    coveredCount: covered.length,
    missing,
    outOfScope,
    isComplete: missing.length === 0 && outOfScope.length === 0,
    groups,
    ungrouped
  }
}
```

- [ ] **Step 4: Run it — expect PASS** (`All keyreport tests passed.`).

- [ ] **Step 5: Rework `loadCompleteness` in `modules/keys/KeyView.vue`**

- Drop `validity=true` from the descendants call so synonyms come back:
  `GET /taxon_names?taxon_name_id[]=<scope>&descendants=true&per=500`.
- Map each descendant row to `{ id, parentId: parent_id, rank, name: cached || name, authorYear: cached_author_year, valid: cached_is_valid !== false, validId: cached_valid_taxon_name_id }`.
- After the terminal-taxon-name fetch, also resolve OTU ids for the links:
  `GET /otus?taxon_name_id[]=<every descendant id, de-duped>&per=500` → build
  `tnIdToOtuId` (`row.taxon_name_id → row.id`; first wins).
- `scopeRank` = the scope taxon-name's `rank` (from the `/taxon_names/:scopeTnId` you can get
  it in the descendants response — the scope row is usually included — or one extra
  `GET /taxon_names/:scopeTnId`).
- `outOfScopeTerminals`: for each terminal OTU whose resolved taxon-name id is **not** among
  `descendants`, `{ label: <the key lead's target_label>, otuId: <the terminal OTU id> }`
  (thread `target_label` through from `nodes`).
- `completeness.value = buildCompletenessReport({ scopeRank, descendants, terminalTnIds, tnIdToOtuId, outOfScopeTerminals })`.
  (`assessCompleteness` may stay exported/tested but `KeyView` now uses the richer builder;
  its first six fields keep the chip working unchanged.)
- Build `synonymyByOtuId`: `{ [terminalOtuId]: { validName } }` for every terminal OTU whose
  taxon-name is a synonym (`valid === false`) — `validName` = `authored(byId.get(validId))`.
  `provide('keySynonymy', computed(() => synonymyByOtuId.value))` (a `ref`, updated in
  `loadCompleteness`, defaulting to `{}`).
- Keep the whole body in one `try/catch → completeness.value = null` (and move the pre-`try`
  lines inside `try`, addressing Task 7's deferred minor).

- [ ] **Step 6: Create `modules/keys/components/CompletenessReport.vue`**

```vue
<template>
  <div class="text-sm [&_i]:italic space-y-3">
    <p class="text-base-content">
      Keyed at <strong>{{ report.targetRank }}</strong> level —
      {{ report.coveredCount }} of {{ report.expectedCount }} in the key's scope
      <span v-if="report.isComplete" class="text-base-soft">(complete)</span>.
    </p>

    <section v-for="g in report.groups" :key="g.taxon.id">
      <h4 class="font-medium text-base-content">
        <TaxLink :taxon="g.taxon" />
      </h4>
      <ul class="ml-4 mt-1 space-y-1">
        <li v-for="m in g.members" :key="m.taxon.id">
          <span :class="m.status === 'included' ? 'text-base-content' : 'text-danger'">
            <span aria-hidden="true">{{ m.status === 'included' ? '✓' : '✗' }}</span>
            <TaxLink :taxon="m.taxon" />
          </span>
          <ul v-if="m.synonyms.length" class="ml-5 text-base-soft">
            <li v-for="s in m.synonyms" :key="s.id">= <TaxLink :taxon="s" /></li>
          </ul>
        </li>
      </ul>
    </section>

    <section v-if="report.ungrouped.length">
      <ul class="ml-4 space-y-1">
        <li v-for="m in report.ungrouped" :key="m.taxon.id">
          <span :class="m.status === 'included' ? 'text-base-content' : 'text-danger'">
            <span aria-hidden="true">{{ m.status === 'included' ? '✓' : '✗' }}</span>
            <TaxLink :taxon="m.taxon" />
          </span>
        </li>
      </ul>
    </section>

    <section v-if="report.outOfScope.length">
      <p class="text-base-soft">Referenced but outside the key's scope:</p>
      <ul class="ml-4 list-disc">
        <li v-for="n in report.outOfScope" :key="n">{{ n }}</li>
      </ul>
    </section>
  </div>
</template>

<script setup>
import { h } from 'vue'

defineProps({ report: { type: Object, required: true } })

// tiny inline component: new-tab OTU link when we have an otuId, else plain italic name
const TaxLink = (props) => {
  const label = [props.taxon.name, props.taxon.authorYear].filter(Boolean).join(' ')
  if (props.taxon.otuId) {
    return h(
      resolveRouterLink(),
      { to: { name: 'otus-id', params: { id: props.taxon.otuId } }, target: '_blank', rel: 'noopener',
        class: 'hover:underline hover:text-secondary' },
      () => [h('i', props.taxon.name), props.taxon.authorYear ? ' ' + props.taxon.authorYear : '']
    )
  }
  return h('span', {}, [h('i', props.taxon.name), props.taxon.authorYear ? ' ' + props.taxon.authorYear : ''])
}
</script>
```

> **Note:** `RouterLink` is a global component — resolve it with `resolveComponent('RouterLink')`
> inside the functional `TaxLink` (import `resolveComponent` from `vue`; replace the
> `resolveRouterLink()` placeholder). If a functional component with `h` proves fiddly, make
> `TaxLink` a normal `<script setup>` child component file
> (`modules/keys/components/TaxRefLink.vue`) with a `taxon` prop and the same
> `RouterLink target="_blank"` / plain-span fallback — either is fine; keep it in `modules/keys/`.

- [ ] **Step 7: Point `KeyHeader.vue`'s completeness modal at the component**

Replace the modal body (the inline "Keyed at … / Missing / outOfScope" markup added in Task 7)
with:

```vue
<VModal v-if="showCompleteness && completeness" @close="showCompleteness = false">
  <template #header><div class="text-sm font-medium">Completeness</div></template>
  <div class="px-4 pb-4">
    <CompletenessReport :report="completeness" />
  </div>
</VModal>
```

Add `import CompletenessReport from './CompletenessReport.vue'`. The chip itself is unchanged
(still reads `completeness.isComplete` / `coveredCount` / `expectedCount` / `targetRank`).

- [ ] **Step 8: Re-run the throwaway test, delete it**

```bash
node /tmp/keyreport.test.mjs   # All keyreport tests passed.
rm /tmp/keyreport.test.mjs
```

- [ ] **Step 9: Compile check** — `npm run build` and `npm run build:ssr` → succeed.

- [ ] **Step 10: Browser check**

`npm run dev`, `http://localhost:5173/#/key/3977`, click the completeness chip.
Expected: the report lists **all** species of *Adosomus*, grouped under the three subgenera
(*Adosomus (Adosomus)*, *Adosomus (Pseudoadosomus)*, *Adosomus (Xeradosomus)*), each species
prefixed ✓ (in the key) or ✗ (missing — *albisquamus*, *grigorievi*), with authorship, and
synonyms listed under `=` beneath their valid species. Every name that has an OTU is a link
that opens the taxon page in a **new tab**.

- [ ] **Step 11: Commit**

```bash
git add modules/keys/
git commit -m "keys: completeness report — grouped by subgenus, synonyms, new-tab links (A8)"
```

---

## Task 13: Synonym suffix on couplet target names (Amendment A6)

> **Execution order:** runs after Task 12 (consumes the `keySynonymy` map it `provide`s).

**Asked (A6):** when a lead references a synonymized name, show it as written in the key (the
synonym), but also indicate the valid name.

**Files:**
- Modify: `modules/keys/components/TaxonLink.vue`

**Interfaces:** consumes `inject('keySynonymy')` — `Record<otuId, { validName: string }>`,
provided by `KeyView` (Task 12). No prop changes; `TaxonLink` already receives `id` (the OTU
id) and `label`.

- [ ] **Step 1: Add the valid-name suffix to `modules/keys/components/TaxonLink.vue`**

```vue
<template>
  <span>
    <RouterLink
      :to="{ name: 'otus-id', params: { id } }"
      target="_blank"
      rel="noopener"
      class="italic text-base-content hover:underline hover:text-secondary"
    >{{ label }}</RouterLink><span
      v-if="validName"
      class="text-base-soft"
    > [= <i>{{ validName }}</i>]</span>
  </span>
</template>

<script setup>
import { inject, computed } from 'vue'

const props = defineProps({
  id: { type: [Number, String], required: true },
  label: { type: String, required: true }
})

const synonymy = inject('keySynonymy', { value: {} })
const validName = computed(() => synonymy.value?.[props.id]?.validName || '')
</script>
```

(The `</RouterLink><span` on one line and the leading space *inside* the suffix span's text
are deliberate — Vue whitespace-condense would otherwise drop the gap. See `CLAUDE.md`.)

- [ ] **Step 2: Compile check** — `npm run build` and `npm run build:ssr` → succeed.

- [ ] **Step 3: Browser check**

If key #3977 has no synonym targets, temporarily hard-code a `keySynonymy` entry in `KeyView`
(`synonymyByOtuId.value = { <some terminal otuId>: { validName: 'Test valid name' } }`) to
confirm the suffix renders as `label [= *Test valid name*]` with the bracket muted, then
remove it. Otherwise navigate to a key/couplet whose target is a known synonym.

- [ ] **Step 4: Commit**

```bash
git add modules/keys/components/TaxonLink.vue
git commit -m "keys: show valid name beside a synonymized couplet target (A6)"
```

---

## Task 14: "Primary source" label + aggregated references list (Amendment A9)

> **Execution order:** runs after Task 5 (needs the `citations` map); slot it after Task 13,
> before Task 8.

**Asked (A9):** the citation attached to the key's metadata should be labelled "primary
source"; the other citations referenced across the couplets should also be viewable as a
list.

**Files:**
- Modify: `modules/keys/KeyView.vue` (derive `allReferences` from the `citations` map)
- Modify: `modules/keys/components/KeyHeader.vue` ("Primary source:" label + a "References
  cited (N)" affordance and modal)

**Interfaces:**
- `KeyView` passes a new prop to `KeyHeader`: `references: Array<{ full: string, short: string, isPrimary: boolean }>` — every **distinct** source used anywhere in the key, deduped by `full` (the `source.cached` HTML string), sorted by `short` (locale). The key-level origin citation (`meta.originCitation`) is included with `isPrimary: true` (matched by string-equality of `full`; if it isn't among the couplet citations, prepend it).
- `KeyHeader` gets prop `references: { type: Array, default: () => [] }`.

- [ ] **Step 1: Derive `allReferences` in `modules/keys/KeyView.vue`**

Add a computed (the `citations` ref is the `{ [leadId]: [{ id, short, full }] }` map from
Task 5; `meta.originCitation` is the key-level HTML string):

```js
const references = computed(() => {
  const byFull = new Map()
  for (const list of Object.values(citations.value || {})) {
    for (const c of list) {
      if (c.full && !byFull.has(c.full)) byFull.set(c.full, { full: c.full, short: c.short, isPrimary: false })
    }
  }
  const primary = meta.value.originCitation
  if (primary) {
    const existing = byFull.get(primary)
    if (existing) existing.isPrimary = true
    else byFull.set(primary, { full: primary, short: 'primary source', isPrimary: true })
  }
  return [...byFull.values()].sort((a, b) => String(a.short).localeCompare(String(b.short)))
})
```

Pass it: `<KeyHeader class="flex-1" :meta="meta" :completeness="completeness" :references="references" />`.

- [ ] **Step 2: "Primary source" label + references modal in `modules/keys/components/KeyHeader.vue`**

- Prefix the existing origin-citation `<p>` with a faint label:

```vue
<p v-if="meta.originCitation" class="mt-2 text-sm text-base-content [&_i]:italic">
  <span class="text-base-soft">Primary source: </span><span
    class="cursor-pointer hover:underline"
    role="button" tabindex="0"
    @click="showCitation = true" @keydown.enter="showCitation = true" @keydown.space.prevent="showCitation = true"
    v-html="meta.originCitation"
  />
</p>
```

(the whole citation stays clickable → the existing `showCitation` `VModal`.)

- Add, in or just after the chip row, a references affordance shown when there is more than
  just the primary:

```vue
<button
  v-if="references.length > 1 || (references.length === 1 && !references[0].isPrimary)"
  type="button"
  class="mt-2 block text-sm text-base-soft hover:underline hover:text-secondary"
  @click="showReferences = true"
>References cited ({{ references.length }})</button>

<VModal v-if="showReferences" @close="showReferences = false">
  <template #header><div class="text-sm font-medium">References cited</div></template>
  <ul class="px-4 pb-4 text-sm leading-relaxed space-y-2 [&_i]:italic">
    <li v-for="(r, i) in references" :key="i">
      <span v-if="r.isPrimary" class="text-base-soft">[primary] </span><span v-html="r.full" />
    </li>
  </ul>
</VModal>
```

Add `const showReferences = ref(false)` and the `references` prop.

- [ ] **Step 3: Compile check** — `npm run build` and `npm run build:ssr` → succeed.

- [ ] **Step 4: Browser check**

`http://localhost:5173/#/key/3977`. The header shows "Primary source: Voss, E. (1937) …".
Key #3977 currently has a couplet citation only on couplet 1 (also Voss 1937) — so
`references` dedupes to a single entry flagged primary, and the "References cited" button is
**hidden** (nothing beyond the primary). Add a second distinct couplet citation in
TaxonWorks (or temporarily inject one into `citations.value`) to see the button + modal list
both sources, the primary tagged `[primary]`.

- [ ] **Step 5: Commit**

```bash
git add modules/keys/
git commit -m "keys: label the key citation 'Primary source' + aggregated references-cited list (A9)"
```

---

## Task 15: Top-level "Keys" tab + auto index page (Amendment A10)

> **Execution order:** after Task 10, before Task 11 (README documents it).

**Asked (A10):** a top-level nav tab "Keys" (between "Search DwC" and "Bibliography") that
automatically lists every key in the project, showing the data from their headers (scope,
citation, description, counts, …).

**Files:**
- Modify: `config/header.yml` (add the nav link)
- Modify: `modules/keys/router/index.js` (add the `/keys` index route)
- Create: `modules/keys/KeysIndex.vue`

**Interfaces:**
- Route `{ name: 'keys-index', path: '/keys' }` — distinct from the core `keys` module's
  `/keys/:id` (which needs a segment) and from our `/key/:id`. Registered alongside the
  existing `dichotomous-key` route in the same `router/index.js` array.
- `KeysIndex.vue` — no props; fetches on mount.

- [ ] **Step 1: Add the nav link in `config/header.yml`**

Insert between the "Search DwC" and "Bibliography" entries:

```yaml
    - label: Keys
      link: /keys
```

- [ ] **Step 2: Register the route — `modules/keys/router/index.js`**

```js
export default [
  {
    name: 'keys-index',
    path: '/keys',
    component: () => import('../KeysIndex.vue')
  },
  {
    name: 'dichotomous-key',
    path: '/key/:id/:couplet?',
    component: () => import('../KeyView.vue')
  }
]
```

- [ ] **Step 3: Create `modules/keys/KeysIndex.vue`**

```vue
<template>
  <div class="container mx-auto py-6">
    <h1 class="text-2xl font-semibold text-base-content mb-4">Keys</h1>

    <VSpinner v-if="loading" />
    <p v-else-if="!keys.length" class="text-base-soft">No public keys in this project.</p>

    <ul v-else class="space-y-4">
      <li
        v-for="k in keys"
        :key="k.id"
        class="rounded-lg border border-base-muted bg-base-foreground p-4 sm:p-5"
      >
        <RouterLink
          :to="{ name: 'dichotomous-key', params: { id: k.id } }"
          class="text-lg text-base-content hover:underline hover:text-secondary [&_i]:italic"
          v-html="k.title"
        />
        <p v-if="k.scope" class="mt-1 text-sm text-base-content [&_i]:italic">
          <span class="text-base-soft">Scope: </span><span v-html="k.scope" />
        </p>
        <p v-if="k.description" class="mt-1 text-sm text-base-content">{{ k.description }}</p>
        <p
          v-if="k.citation"
          class="mt-1 text-sm text-base-content [&_i]:italic"
          v-html="k.citation"
        />
        <div class="mt-2 flex flex-wrap gap-2 text-xs text-base-soft">
          <span v-if="k.coupletsCount" class="border border-base-muted rounded px-2 py-0.5">{{ k.coupletsCount }} couplets</span>
          <span v-if="k.otusCount" class="border border-base-muted rounded px-2 py-0.5">{{ k.otusCount }} taxa</span>
          <span v-if="k.updatedInWords" class="border border-base-muted rounded px-2 py-0.5">updated {{ k.updatedInWords }} ago</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { makeAPIRequest } from '@/utils/request'

const loading = ref(true)
const keys = ref([])

onMounted(async () => {
  try {
    const { data: list } = await makeAPIRequest.get('/leads')
    const rows = Array.isArray(list) ? list : []
    // one metadata call per key (there are only a handful) for scope + citation
    const metas = await Promise.all(
      rows.map((r) =>
        makeAPIRequest.get(`/leads/key/${r.id}`).then((res) => res.data?.metadata || {}).catch(() => ({}))
      )
    )
    keys.value = rows.map((r, i) => ({
      id: r.id,
      title: metas[i].title || r.text || `Key ${r.id}`,
      scope: metas[i].taxonomic_scope || null,
      citation: metas[i].origin_citation || null,
      description: r.description || null,
      coupletsCount: r.couplets_count || null,
      otusCount: r.otus_count || null,
      updatedInWords: r.key_updated_at_in_words || null
    }))
  } catch (e) {
    keys.value = []
  } finally {
    loading.value = false
  }
})
</script>
```

- [ ] **Step 4: Compile check** — `npm run build` and `npm run build:ssr` → succeed.

- [ ] **Step 5: Browser check**

`npm run dev`, open `http://localhost:5173/#/keys` (also reachable from the new "Keys" nav
item between "Search DwC" and "Bibliography").
Expected: a "Keys" heading and one card — "Key to the species of Adosomus …" — with
`Scope: Adosomus Faust, 1904`, the description line, the Voss 1937 citation, and the three
chips. Clicking the title opens `/key/3977`.

- [ ] **Step 6: Commit**

```bash
git add config/header.yml modules/keys/
git commit -m "keys: top-level Keys tab + auto index page listing every key's header (A10)"
```

> **Distributability note (for Task 11 README):** the module registers the `/keys` route
> itself, but the nav link is a host-project `config/header.yml` edit — document it as a
> one-line install step.

---

## Task 16: Clickable reference URLs + primary source above description (Amendments A12, A14)

> **Execution order:** after Task 8. Touches `KeyHeader.vue`, `CoupletCitation.vue`,
> `KeysIndex.vue`.

**Files:**
- Modify: `modules/keys/components/KeyHeader.vue`
- Modify: `modules/keys/components/CoupletCitation.vue`
- Modify: `modules/keys/KeysIndex.vue`

**Interfaces:** no prop changes. `sanitizeAndLinkifyHtml` is exported from `@/utils` (and
`@/utils/url`) — it sanitises HTML and wraps bare `http(s)://…` (incl. `https://doi.org/…`)
in `<a target="_blank" rel="noopener noreferrer" class="text-secondary">`.

- [ ] **Step 1: A12 — linkify every citation `v-html` in the keys module**

`import { sanitizeAndLinkifyHtml } from '@/utils'` in each of the three files, then replace:
- `KeyHeader.vue` — the primary-source `<p>`'s `v-html="meta.originCitation"` →
  `v-html="sanitizeAndLinkifyHtml(meta.originCitation)"`; the citation `VModal` body
  `v-html="meta.originCitation"` → same; the references `VModal` list item
  `v-html="r.full"` → `v-html="sanitizeAndLinkifyHtml(r.full)"`.
- `CoupletCitation.vue` — `v-html="citation.full"` → `v-html="sanitizeAndLinkifyHtml(citation.full)"`.
- `KeysIndex.vue` — the citation `<p v-html="k.citation">` → `v-html="sanitizeAndLinkifyHtml(k.citation)"`.
  (Leave `k.title` / `k.scope` as plain `v-html` — those are name strings, not references.)

Optional polish: in `KeyHeader.vue`'s references modal, replace the `[primary]` text tag with
`<VBadge color="blue" shape="pill" size="sm" weight="normal">primary</VBadge>` (global
component; matches `PanelReferences` style). Only if `VBadge` resolves as a global — check
`node_modules/@sfgrp/taxonpages/src/components/` — otherwise keep `[primary]`.

- [ ] **Step 2: A14 — primary source above the description, both places**

Reorder so the sequence is **title → scope → primary source → description → attribution →
chips**:
- `KeyHeader.vue` — move the primary-source `<p>` (the `<span>Primary source: </span>…`
  block) to directly after the scope `<p>` and before the description `<p>`.
- `KeysIndex.vue` — in the card template, move the citation `<p>` above the description `<p>`
  (after the scope `<p>`).

- [ ] **Step 3: Compile check** — `npm run build` and `npm run build:ssr` → succeed.

- [ ] **Step 4: Browser check**

`#/key/3977` and `#/keys` — the Voss 1937 citation still renders (italic journal), the
"Primary source:" line is now above the description, and any URL in a reference is a
clickable link. (Key #3977's Voss citation has no URL — inject a test URL into
`meta.originCitation` briefly, or check against a key/source that has a DOI.)

- [ ] **Step 5: Commit**

```bash
git add modules/keys/
git commit -m "keys: linkify URLs/DOIs in references (A12); primary source above description (A14)"
```

---

## Task 17: Content-agnostic header chips (Amendment A13)

> **Execution order:** after Task 16. Touches `modules/keys/KeyView.vue` (+ maybe
> `modules/keys/lib/tree.js` for an LCA helper).

**Problem:** `KeyView`'s four header chips (`couplets` / `taxa` / `updated` / completeness)
all derive from `listMeta`, populated only by matching the key id against `GET /leads` —
which returns only `is_public` key roots. A non-public key opened by id shows a bare header.

**Files:**
- Modify: `modules/keys/KeyView.vue`
- Modify (maybe): `modules/keys/lib/tree.js` (add `terminalOtus(nodes)` and/or an LCA helper — pure, Node-tested if added)

- [ ] **Step 1: Derive couplets + taxa from the loaded tree**

In `KeyView.vue`, the `meta` computed currently takes `coupletsCount` / `otusCount` from
`listMeta`. Change them to always prefer the tree:
- `coupletsCount`: `couplets.value.length` (the existing `orderedCouplets(nodes.value)` computed).
- `otusCount`: count of **distinct** `targetId` across `nodes` where
  `!isCouplet && targetType === '/api/v1/otus'`. Add `terminalOtus(nodes)` to `lib/tree.js`
  (returns `[{ id, label }]` deduped) if not already trivial — or inline a `Set` in `KeyView`.
- Fall back to `listMeta` values only if the tree is empty.

`KeyHeader.vue` needs no change — it already renders the chips from `meta`.

- [ ] **Step 2: Completeness for non-public keys — resolve the scope taxon from the terminals**

`loadCompleteness` currently needs `listMeta.value.otu_id`. Make it work without:
- If `listMeta.value.otu_id` is present, use it (fast path, unchanged).
- Else: resolve the scope from the key's terminal taxa. After fetching the terminal
  taxon-name rows (the existing `GET /taxon_names?taxon_name_id[]=…` call), fetch each one's
  ancestor chain — `GET /taxon_names?taxon_name_id[]=<terminals>&extend[]=parents` if
  supported, else walk `parent_id` with a batched `/taxon_names?taxon_name_id[]=` per level —
  and take the **lowest common ancestor** taxon-name id. Use that as `scopeTnId` for the
  `descendants=true` query (skip the `/otus/:scopeOtuId` hop entirely in this branch).
- Add a pure `lowestCommonAncestor(chains)` helper to `lib/tree.js` (input: array of
  ancestor-id arrays root→leaf; output: the deepest id present in all) — Node-tested.
- If the ancestor chains can't be resolved, leave `completeness.value = null` (chip hides) —
  same graceful degradation as today.

- [ ] **Step 3: `updated` chip**

`key_updated_at` is genuinely absent from `/leads/key/:id`. Leave the `updated` chip
best-effort from the `listMeta` match; it simply won't render for a non-public key. Add a
one-line code comment saying so.

- [ ] **Step 4: Tests** — if `lib/tree.js` gains `terminalOtus` / `lowestCommonAncestor`,
  TDD them with a throwaway `/tmp/keytree2.test.mjs` (RED → GREEN → delete), per repo
  convention.

- [ ] **Step 5: Compile check** — `npm run build` and `npm run build:ssr` → succeed.

- [ ] **Step 6: Browser check**

`#/key/3977` — chips unchanged (still `7 couplets` / `9 taxa` / `updated …` / `7 / 9
species`, now sourced from the tree for the first two). Then open a **non-public** key by id
(the user will supply one, e.g. the Entimini key): the couplets + taxa chips render from its
structure; completeness renders if the scope resolves.

- [ ] **Step 7: Commit**

```bash
git add modules/keys/
git commit -m "keys: header chips (couplets/taxa) from the key tree, completeness scope from terminals (A13)"
```

---

## Self-review notes

- **Spec §3.1 file layout** — Tasks 1–10 create every file listed except `useKey.js`, which was intentionally dropped: its role (fetch orchestration + derived data) lives in `KeyView.vue` + `lib/tree.js`, matching this repo's "component fetches, `lib/` transforms" pattern (prior plan). No separate store is needed — the Guided view holds no navigation state at all; the current couplet is a pure function of `route.params.couplet` via `coupletByNumber`.
- **Spec §3.2 one URL per couplet + §3.3 SSR** — route `/key/:id/:couplet?` (Task 1); both views take `keyId` + `couplet` props from `route.params` (Tasks 3, 6); no URL hash anywhere (Task 8 Step 4 greps to confirm `#couplet-` appears only as a scroll-target `id`); Guided navigation is `RouterLink`/`router.push` so Back walks up the key; `dev:ssr` deep-link check in Tasks 6 & 11.
- **Spec §4 three calls** — call 1 Task 1, call 2 Task 2, call 3 Task 5.
- **Spec §5 formats + toggle** — Full key Task 3, Guided Task 6, toggle + persistence Task 6, `?format=` override Task 6 (`resolveFormat`, Node-tested); `localStorage` pref applied post-mount (no SSR mismatch).
- **Spec §5.1 "leads to" / no downstream text** — `ReachableTaxa.vue` (Task 6) + `descendantOtus` (Task 1, Node-tested).
- **Spec §5.2 couplet references / back-jumps** — `FullKeyView.vue`: `id="couplet-N"` scroll targets, `<RouterLink>` to the `:couplet` param for couplet-number targets and "from N", scroll-into-view watcher (Task 3).
- **Spec §6 figures + lightbox** — Task 4; `KeyLightbox` is `Teleport` + `ClientOnly`, keyboard + focus-trap, keys-local (no `panels/_shared`).
- **Spec §7 masthead, no modal** — `KeyHeader.vue` (Task 2); title/description/scope/citation always visible; only the *full reference* is behind a click, consistent with `DwcTable`.
- **Design amendment 3 (completeness check)** — `lib/completeness.js` (Task 7, Node-tested `finestRank` + `assessCompleteness`); `KeyView` resolves scope descendants + terminal ranks and passes a `completeness` object to `KeyHeader`; chip + report modal in `KeyHeader` (Task 7). Finest-rank auto-detect; valid descendants only.
- **Spec §8 link-on-hover, reserved emphasis, print** — Task 8. **Ruling (2026-08-29):** the Guided "Go to couplet N →" primary action stays a filled `bg-primary` link — it is the forward CTA of a choice card, not an in-text jump target; the "no standing colour" rule governs breadcrumb steps / "from N" / couplet-number links embedded in prose. Task 8's link audit must NOT re-flag the CTA.
- **Spec §9 PanelKeys fork** — Task 9.
- **Spec §10 interactive-key thin fork** — Task 10 (kept, per approval).
- **Spec §3.4 distributability** — no `panels/`/`config/`/`_shared/` imports in `modules/keys/`; manifest Task 1; README Task 11.
- **Global constraint "links text-coloured until hover"** — enforced in every component and re-audited in Task 8 Step 4 (with the Guided-CTA carve-out above).
- **Type consistency** — `Node` fields (`isCouplet`, `coupletNumber`, `targetType`, `targetId`, `targetLabel`, `targetLink`, `figures`, `children`) defined in Task 1, used unchanged in Tasks 3–9. `coupletByNumber(value, nodes)` (Task 1) consumed by `GuidedView` (Task 6). `keyId` + `couplet` props: `FullKeyView` (Task 3) and `GuidedView` (Task 6) take `keyId: [String, Number]` and `couplet: { type: String, default: null }` (a nullable string — `null`/`undefined` skip Vue's type check; do NOT write `type: [String, null]`, `null` is not a valid type constructor), passed from `route.params.id` / `route.params.couplet ?? null` in `KeyView` — the Task 5 `KeyView` template snippet keeps these props (noted inline). `citations` map shape `{ id, short, full }[]` produced in Task 5, consumed by `LeadText` (Task 3) which tolerates an empty `{}` until then. `format` values `'guided'|'full'` consistent across `format.js`, `FormatToggle`, `KeyView`.
- **Known unverified point** — `figures[]` field names (`figure_label` vs `label`, whether `thumb`/`medium` are directly usable as `<img src>`); code reads both spellings and Task 4 Step 4 is a structural check with a fake figure. Revisit when the first real Lead depiction exists in the data.
- **Route collision** — new paths `/key/:id/:couplet?` and `/interactive-key/:id` deliberately differ from core `/keys/:id` and `/interactive_keys/:id`; core routes remain registered but nothing links to them after Task 9.
