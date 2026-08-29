# Dichotomous key redesign — amendments log

Companion to `2026-08-29-dichotomous-key-panel-redesign-design.md` (spec) and
`../plans/2026-08-29-dichotomous-key-panel-redesign.md` (plan). Every change requested
*after* the plan was approved, so it can be checked off once implemented.

**Branch:** `keys-panel-redesign`. **Status legend:** `planned` → `built` (implementer done,
in review) → `verified` (review clean + controller/user confirmed in the browser).

Each amendment: what was asked · the design decision · which plan task carries it · how to
review that it landed satisfactorily.

---

## A1 — One URL per couplet (SSR- and CSR-safe)

**Asked:** a distinct URL for each couplet; navigating a couplet creates that "anchor"; it
must work under both SSR and client-side rendering.

**Decision:** route is `/key/:id/:couplet?` — the couplet number is a **path segment**, never
a URL hash (the fragment is not sent to the server, so a hash couplet would misrender every
deep link under SSR). Both views derive their position from `route.params.couplet` via
`coupletByNumber`. Guided-mode navigation is `RouterLink` / `router.push`, so browser **Back
walks up the key**. `?format=` stays a query param (also SSR-visible). SPA dev runs in
hash-mode so the live URL is `#/key/:id/:couplet` — the path segment still parses identically.

**Task(s):** 1 (route + `coupletByNumber`), 3 (Full-key reads `couplet`), 6 (Guided view is a
pure function of the route param, no local state).

**Review check:**
- `/key/3977/4` (or `#/key/3977/4`) loads with couplet 4 selected — Guided shows couplet 4
  with breadcrumb `1 › 3 › 4`; Full key scrolls to couplet 4.
- In Guided, choosing an option changes the URL to `/key/3977/<n>`; browser Back returns to
  the previous couplet.
- `npm run dev:ssr` → `/key/3977/4` renders without a hydration-mismatch warning.
- `grep -rn "#couplet" modules/keys` shows `#couplet-` only as an `id=` scroll target, never
  in a `:to`/`:href`.

**Status:** built (Tasks 1, 3, 6 complete & reviewed) — needs the browser confirmation above.

---

## A2 — Full-key: mark the current couplet + a "return to it" control

**Asked:** after clicking "couplet 7" you're at couplet 7; scrolling around loses your place.
Mark the current couplet visually, and give a persistent control that jumps back to it.

**Decision:** in `FullKeyView.vue`, driven by the existing `couplet` prop:
- the current couplet's `<section>` gets `data-current` + a highlight (`ring-2 ring-secondary
  ring-offset-2 ring-offset-base-foreground bg-secondary/5`);
- a fixed, `key-print-hide` button (bottom-right) "↑ Couplet N", shown only while a couplet
  is active, calls `scrollToCouplet(currentCoupletNumber)`.

**Task:** 8, Step 1 (1b marker, 1c return control).

**Review check:**
- Open `#/key/3977/4` in Full-key format → couplet 4's block has a visible ring/tint.
- Scroll away → a "↑ Couplet 4" pill stays fixed bottom-right; clicking it scrolls back to
  couplet 4.
- No pill when the URL has no `:couplet` (`#/key/3977`).
- Pill and ring are hidden / absent in print (`?format=full`, print preview).

**Status:** planned (Task 8).

---

## A3 — Dark-mode readable surface

**Asked:** white text on the dark page background is hard to read; other TaxonPages panels
put content on a grey (elevated) surface in dark mode. Match that.

**Decision:** wrap `KeyView.vue`'s loaded content (`v-else` branch) in an elevated panel —
`rounded-lg border border-base-muted bg-base-foreground p-4 sm:p-6` — keeping the outer
`container mx-auto py-4`. Because `GuidedChoice` cards were also `bg-base-foreground`, they
drop to `bg-base` (or `/60`) + keep their border so they still read as raised against the
new backing. Theme tokens only.

**Task:** 8, Step 2.

**Review check:**
- In **dark** mode, `#/key/3977` content sits on a distinctly lighter grey card; body text is
  comfortable to read (this is the reported problem — confirm it's gone).
- Guided choice cards and the A2 current-couplet ring are still visually distinct from the
  panel backing.
- Light mode still looks right; no hard-coded colours (`grep` for hex / `rgb(` in
  `modules/keys` → none).

**Status:** planned (Task 8).

---

## A4 — Taxonomic completeness check

**Asked:** based on the key's scope, does it contain all descendants? Auto-detect the
end-taxon level: if all couplet targets are subgenera → check all subgenera; if it ends at
species but also keys out some subgenera → check species. Applies at every rank. Show it as a
chip next to `[x couplets] [9 taxa] [updated …]`; clicking shows the full report.

**Decision:** `lib/completeness.js` (pure, Node-tested):
- `finestRank(ranks)` — the most-nested rank present among the key's terminal taxa
  (`RANK_ORDER` coarse→fine; unknown ranks ignored; `null` when nothing usable).
- `assessCompleteness({ terminals, descendants })` — `targetRank = finestRank(terminal
  ranks)`; `expected` = **valid** descendants of the scope taxon at `targetRank`; `covered` =
  expected that the key keys out (matched by taxon-name id, synonyms folded to their valid
  id); `missing` = the rest; `outOfScope` = terminals at `targetRank` not under the scope.
  `isComplete` when both lists are empty.
- `KeyView.loadCompleteness()` — fire-and-forget after the key loads: scope OTU → taxon-name;
  `GET /taxon_names?taxon_name_id[]=<scope>&descendants=true&validity=true`; terminal OTUs →
  `GET /otus?otu_id[]=…` → `GET /taxon_names?taxon_name_id[]=…`.
- `KeyHeader.vue` — a fourth chip: `complete (N rank)` in neutral, or `C / E rank` in
  `text-danger`; click → `VModal` report (target rank, covered/expected, missing list,
  out-of-scope list).

**Ruling:** "expected" counts **valid** taxa only, at exactly the rank the key uses (a
species-level key is not marked incomplete for lacking subspecies).

**Task:** 7.

**Review check:**
- `#/key/3977` shows a fourth chip. Key #3977's title says *A. grigorievi* and
  *A. albosquamus* are missing; the chip should be red and read ≈ `7 / 9 species`; the report
  modal lists those two (with authorship — see A5) under "Missing".
- A hypothetical all-subgenus key would show `… subgenus`; a species key with a stray
  subgenus couplet still shows `… species`.
- `lib/completeness.js` has no Vue / network imports; its Node test covered finest-rank
  selection, the valid-only filter, missing, out-of-scope, and the complete case.

**Status:** verified in code — Task 7 complete (commits `b195216`..`abc4330`, review clean
after 1 fix round). Live-chip browser confirmation still owed (final walkthrough).

---

## A5 — Completeness report shows names *with authorship*

**Asked:** the completeness check should give taxon names with authorship — a missing set
that's all "Smith, 2023" flags a key that predates a revision or a specific paper.

**Decision:** in `loadCompleteness()`, build every name as
`[cached, cached_author_year].filter(Boolean).join(' ')` for both the scope descendants and
the terminal (out-of-scope) taxa, so the report modal's "Missing" and "Referenced but outside
scope" lists carry authorship (e.g. *Adosomus (Xeradosomus) grigorievi* (Suvorov, 1912)).

**Task:** 7 (plan text patched post-dispatch; enforced in Task 7's review).

**Review check:** the completeness report modal lists names **with** their author + year, not
bare binomials.

**Status:** done — Task 7 fix round 1 (commit `abc4330`), re-review confirmed both name maps
build `[cached, cached_author_year].filter(Boolean).join(' ')`.

---

## A6 — Synonymized target names

**Asked:** if a lead references a synonymized name, show it as written in the key (the
synonym the author used) but also indicate the valid name.

**Decision:** `KeyView` builds a `synonymy` map `{ [otuId]: { validName } }` from the same
terminal taxon-name data A4 fetches — entries where `cached_is_valid === false`, `validName`
resolved from `cached_valid_taxon_name_id` (one extra `GET /taxon_names?taxon_name_id[]=…`
batch for the valid names). It's exposed with `provide('keySynonymy', ref)`. `TaxonLink.vue`
does `inject('keySynonymy', ref({}))`, looks up its own `id` (the OTU id), and appends a
muted `[= <i>valid name</i>]` suffix after the linked name (built as a span to survive Vue
whitespace-condensing). No changes to `FullKeyView` / `ReachableTaxa` / `GuidedChoice`.
Completeness (A4) already counts a synonym terminal toward its valid name.

**Task:** 13 (consumes the `keySynonymy` map that Task 12 builds & `provide`s).

**Review check:**
- A couplet whose target OTU is a junior synonym renders "*Name as in key* Author
  [= *Valid name*]", the valid part muted.
- A valid target renders with no suffix.
- The completeness chip does not double-count or mark such a taxon missing.

**Status:** planned (Task 13).

---

## A7 — "couplet N" links do not jump

**Asked (bug):** clicking a "couplet x" link in Full-key view does not properly jump to that
couplet.

**Root cause:** the framework router's `scrollBehavior`
(`node_modules/@sfgrp/taxonpages/src/router/index.js:42`) returns `{ top: 0 }` for every
navigation without a secondary `#fragment` — which is every couplet navigation — so the page
scrolls to top and Task 3's `nextTick(scrollIntoView)` loses the race.

**Decision:** in `FullKeyView.scrollToCouplet`, defer the scroll past the router's own scroll
with `nextTick` → double `requestAnimationFrame`. Fixes both the "couplet N" links and the A2
"↑ Couplet N" return button (same function). Guided view is unaffected — there a scroll-to-top
on couplet change is desirable.

**Task:** 8, Step 1a.

**Review check:**
- In Full-key format, clicking "couplet 6" (or "from 3") smoothly scrolls that couplet to the
  top of the viewport — from any starting scroll position, and on a fresh deep-link load.
- The A2 return pill does the same.

**Status:** planned (Task 8).

---

## A8 — Completeness report: full grouped, linked, synonym-aware listing

**Asked:** the completeness report should also list the *included* species (not only missing);
every listed taxon a **new-tab** link to its taxon page; and the whole listing presented like
the OTU page's "Descendants" tab — grouped by subgenus, with synonyms, sorted.

**Decision:** `lib/completeness.js` gains `buildCompletenessReport({ scopeRank, descendants,
terminalTnIds, tnIdToOtuId, outOfScopeTerminals })` (pure, Node-tested) → the existing flat
fields (so the chip is unchanged) **plus** `groups` (one per grouping-rank taxon — the rank
between scope and target, i.e. subgenus here — each with its target-rank `members` marked
`included`/`missing` and their `synonyms`) and `ungrouped`. `KeyView.loadCompleteness` drops
the `validity=true` filter (so synonyms come back), resolves an OTU id per taxon-name
(`GET /otus?taxon_name_id[]=…`) for the links, and also `provide`s a `keySynonymy` map for
A6/Task 13. New `CompletenessReport.vue` renders the tree in the header modal; every name
with an OTU is a `RouterLink target="_blank"` to `otus-id`.

**Task:** 12.

**Review check:**
- Click the completeness chip on `#/key/3977`: all *Adosomus* species listed, grouped under
  the three subgenera, each ✓ (in key) / ✗ (missing), with authorship, synonyms indented
  under `=` beneath their valid species.
- Every name that has an OTU opens the taxon page in a **new tab**.
- `buildCompletenessReport` is pure; its Node test covers grouping, member status,
  synonym attachment, sorting, and out-of-scope.

**Status:** planned (Task 12).

---

## A9 — "Primary source" label + aggregated references list

**Asked:** the citation attached to the key metadata should be labelled "primary source";
the other citations referenced across the couplets should also be viewable as a list.

**Decision:** `KeyView` derives `references` — every **distinct** source used anywhere in the
key (deduped by the `source.cached` HTML string, sorted), with the key-level origin citation
flagged `isPrimary`. `KeyHeader` prefixes the origin citation with a faint "Primary source: "
label, and — when there are couplet citations beyond the primary — shows a "References cited
(N)" button opening a `VModal` list (primary tagged `[primary]`).

**Task:** 14.

**Review check:**
- Header reads "Primary source: Voss, E. (1937) …".
- With ≥2 distinct sources across the key, a "References cited (N)" button opens a modal
  listing them all, the primary marked.
- With only the primary (key #3977's current data), the button is hidden.

**Status:** planned (Task 14).

---

## A10 — Top-level "Keys" tab + auto index page

**Asked:** a top-level nav tab "Keys" (between "Search DwC" and "Bibliography") that
automatically lists every key in the project by the data in their headers (scope, citation,
description, …).

**Decision:** `config/header.yml` gets a `- label: Keys / link: /keys` entry in the right
position. The local module registers a second route `{ name: 'keys-index', path: '/keys' }`
(distinct from core `/keys/:id` and our `/key/:id`). `KeysIndex.vue` fetches `GET /leads`
(every public key root — title, description, counts, updated) and one `GET /leads/key/:id`
per key for `metadata` (scope + origin citation), rendering a card per key on the same
`bg-base-foreground` surface as the key view, each card titled with a link to `/key/:id`.

**Task:** 15.

**Review check:**
- A "Keys" item appears in the header between "Search DwC" and "Bibliography"; it opens
  `/keys`.
- `/keys` lists a card per key with title, `Scope: …`, description, citation, and
  couplet/taxa/updated chips; the title links to `/key/:id`.
- Distributability: the module owns the route; the nav link is a host `config/header.yml`
  edit (README documents it as an install step).

**Not a defect — data gating:** `GET /api/v1/leads` maps to `leads#api_index`, which is
`Lead.roots_with_data(project_id, true).where(is_public: true)` — the public API returns
**only keys whose root lead is flagged publicly accessible**. There is no public endpoint for
non-public keys (`/leads/:id` 404s, `/leads?parent_id` 401s). If the "Keys" page shows fewer
keys than exist in TaxonWorks, the missing ones need their `is_public` flag set in the
TaxonWorks lead editor — no code change. `KeysIndex.vue` already uses the only project-wide
discovery endpoint.

**Status:** built — Task 15 complete (commit `f60f54c`, review clean). Browser confirmation of
`#/keys` owed (final walkthrough).

---

## A11 — Completeness modal: make included vs missing striking

**Asked:** from the rendered modal — the ✓/✗ marks are tiny and every row reads as the same
blue link; you can't tell at a glance which taxa the key covers.

**Decision (folded into Task 8's visual pass):** in `CompletenessReport.vue` —
fixed-width marker column (`✓` `text-success` / `✗` `text-danger`, `font-semibold`); **missing
rows** carry standing emphasis (name in `text-danger font-medium` + a `border-l-2
border-danger` rule); **included rows** stay quiet (normal link, green ✓ only); a small
`(covered / total keyed out)` summary after each group heading; fix the stray space in "… in
the key's scope .". Theme tokens only (`--color-success` exists).

**Task:** 8, Step 3.

**Review check:** opening the completeness chip, missing taxa are immediately obvious (red,
emphasised, left rule) vs the quiet included rows; each group shows an "N / M keyed out"
count.

**Status:** built — Task 8 recovered commit `70dfafa` (implementer's run was cut by a rate
limit before commit; controller committed the completed edits, both builds green). Task review
still owed.

---

## A12 — Clickable URLs / DOIs in references (align with TaxonPages PR #364)

**Asked:** check how other panels handle references and the URLs in them; is there a shared
modal? (ref: `SpeciesFileGroup/taxonpages` PR #364). The "modal with all sources, primary
marked" is liked as-is — just make the URLs clickable.

**Findings:** No drop-in shared "sources modal" component. The package pattern is the
**`sanitizeAndLinkifyHtml(html)` util** (`@/utils` / `@/utils/url.js`) — it sanitises then
turns bare `http(s)://…` (incl. `https://doi.org/…`) into
`<a target="_blank" rel="noopener noreferrer" class="text-secondary">`. PR #364 (and #351)
just apply it wherever `source.cached` is rendered. Related: `ModalCitations.vue` (BA-panel,
`VModal` + `VTable` Reference|Pages), `PanelReferences` (aggregates project references; already
maps `citation_object_type: 'Lead'` → the badge label **"Key"**).

**Decision:** replace every bare `v-html` of citation HTML in the keys module with
`sanitizeAndLinkifyHtml(...)` — `KeyHeader.vue` (primary source line + the references-cited
`VModal`), `CoupletCitation.vue`, `KeysIndex.vue`. Keep our modal layout; optionally swap the
`[primary]` text tag for a `VBadge` pill to match the package look.

**Task:** 16.

**Review check:** a reference containing a DOI/URL renders it as a clickable `text-secondary`
link (new tab) in the primary-source line, the references modal, the per-couplet citation
popup, and the Keys index cards.

**Status:** planned (Task 16).

---

## A13 — Header chips must be content-agnostic (not tied to the public `/leads` row)

**Asked:** `[x couplets] [x taxa] [updated x ago] [x/x species]` don't show for the "Entimini
key" — looks hard-coded for Adosomus. Make it agnostic to content.

**Findings:** not hard-coded — but `KeyView`'s chips read `couplets_count` / `otus_count` /
`key_updated_at_in_words` / scope `otu_id` from `listMeta`, which is populated only by matching
the key id against `GET /leads` — and `/leads` returns **only `is_public` key roots**. For a
key opened by id that isn't public, `listMeta` is `{}` and all four chips vanish (and
`loadCompleteness` early-returns for lack of a scope `otu_id`).

**Decision:**
- **Couplets** and **taxa** chips: derive from the already-loaded key tree —
  `orderedCouplets(nodes).length` and the count of distinct terminal OTU targets. Always
  shown, no `/leads` dependency.
- **Updated** chip: `key_updated_at` is not in the per-key `/leads/key/:id` payload — keep it
  best-effort from the `/leads` match; absent for non-public keys (acceptable, documented).
- **Completeness** chip: needs the scope taxon. Prefer resolving it from the key's terminal
  taxa (lowest common ancestor of the terminal taxon-names) rather than the root lead's
  `otu_id`, so it works for non-public keys too; fall back to `listMeta.otu_id` when available.
  *(If LCA resolution proves fiddly, ship couplets/taxa agnostic now and leave completeness
  gated on a public key, noted.)*

**Task:** 17.

**Review check:** open a non-public key by id — the couplets and taxa chips still render from
its own structure; the completeness chip renders whenever a scope taxon can be resolved.

**Status:** planned (Task 17).

---

## A14 — Primary source above the description

**Asked:** in the keys overview (`KeysIndex`) and the key itself (`KeyHeader`), the primary
source should be shown **above** the description, not below.

**Decision:** move the primary-source `<p>` before the description `<p>` in both
`KeyHeader.vue` and `KeysIndex.vue`. (Order everywhere: title → scope → **primary source** →
description → attribution → chips.)

**Task:** 16 (same files as A12).

**Review check:** in both the Keys index cards and the key header, the primary-source line
sits directly under the scope line and above the description.

**Status:** planned (Task 16).

---

## Cross-cutting notes (not amendments, context for review)

- **SPA is hash-mode** (`config/router.yml` → `hash_mode: true`): test the SPA at
  `http://localhost:5173/#/key/3977`; SSR (`:6173`) is history-mode. Router-agnostic code
  (`RouterLink {name,params}`, `route.params`) — no code impact.
- **Spec wording:** "no hash anywhere" (spec §3.2/§3.3) means no ad-hoc `#couplet-N` fragment
  *state*; the SPA router still uses `#/` as its history transport. (One-line spec
  clarification owed at finish.)
- **Task numbering:** the completeness check was inserted as Task 7; the original
  visual-pass / PanelKeys / interactiveKeys / README tasks became 8 / 9 / 10 / 11. Appended:
  Task 12 = completeness report tree (A8), Task 13 = synonym suffix (A6), Task 14 = primary
  source + references (A9), Task 15 = Keys tab + index (A10). **Execution order** (per the
  SDD ledger, not the numbers): 7 → 12 → 13 → 14 → 8 → 9 → 10 → 15 → 16 → 17 → 11. (Task 16 = A12+A14, Task 17 = A13.)
