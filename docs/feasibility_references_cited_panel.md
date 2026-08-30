# Feasibility — the `panel:references-cited` ("Other references") panel

Investigation for `docs/Task_toDo.md` → "Offtopic". Package panel read from
`node_modules/@sfgrp/taxonpages/src/modules/otus/components/Panel/PanelReferences/`; project
data probed against `sfg.taxonworks.org` API v1, 2026-08-30. No code written.

## Recommendation

**Worth enabling. Zero code, package-maintained, the project has the data.** Add it to
`config/taxa_page.yml` (below). Caveat: it is per-OTU and the citation list is large for
higher taxa.

## How the panel works

- **Endpoint:** `GET /otus/:otuId/inventory/citations` → a list of `{ otu, citations[] }`
  blocks (the OTU plus its related/synonym OTUs). Each citation carries `source`
  (`{id, cached, author_year, year}`), `pages`, `is_original`, `citation_object_type`, and
  `topics[]`.
- **Rendering** (`PanelReferences.vue` + `PanelCitationsRow.vue`): flattens all citations,
  dedupes by `source.id` → one row per source, sorted by year. Shows the first 2, rest behind
  "Show all". Each row = linkified `source.cached` + badges.
- **Blue badges** = the distinct `citation_object_type` values on that source's citations
  (`pages` appended as `Type:page`), with `Lead` relabelled **"Key"**.
- **Yellow badges** = `topics[]` — TaxonWorks controlled-vocabulary tags on the citation
  (e.g. "description", "Distribution", "illustrations").
- `bind: { title: '...' }` overrides the default "References cited" heading.

## Tags vs. automatic — the user's question

**The blue type badges are automatic, not tags.** `citation_object_type` is set by
TaxonWorks to whatever record the citation hangs on:

- a citation on a **TypeMaterial** record → `citation_object_type: "TypeMaterial"` → blue
  "TypeMaterial" badge.
- a citation on an **AssertedDistribution** → "AssertedDistribution" badge.
- on the **TaxonName** / **Otu** / **BiologicalAssociation** / **Lead**(→"Key") /
  **Image** → the corresponding badge.

No curator tagging is needed for these. **Topics (yellow) are the only tag component** and
are optional — they add value where present and are simply absent otherwise.

## Project data (probed 2026-08-30)

Project-wide `GET /citations?citation_object_type=<T>&per=1` → `Pagination-Total`:

| `citation_object_type` | count |
|---|---:|
| AssertedDistribution | 58 152 |
| TaxonName | 30 206 |
| Otu | 17 415 |
| TypeMaterial | 443 |
| BiologicalAssociation | 443 |
| Image | 141 |
| Content | 19 |
| Lead (keys) | 8 |
| CollectionObject | 7 |
| **TaxonDetermination** | **0** |
| FieldOccurrence | 0 |
| **total citations** | **108 790** |
| tags (any) | 3 362 |

Sample OTU pulls via `inventory/citations`:

| OTU | sources | citations | types seen | with topics |
|---|---:|---:|---|---|
| *Adosomus roridus* (732686) | 1 | 16 | Otu 3, AssertedDistribution 12, BiologicalAssociation 1 | 3 (5 tags) |
| *Adosomus* genus (732685) | — | 4 | Otu 2, AssertedDistribution 1, Lead 1 | 2 (4 tags) |
| Entiminae subfamily (712818) | — | 869 | Otu 685, AssertedDistribution 184 | 667 (1198 tags) |

## What that means for usefulness

- **Real content.** 108 k citations; on a species page the panel would show the union of
  sources cited on the name, the distribution statements, biological associations, images and
  any key — a genuine "what's been published on this taxon" list.
- **Type material shows up.** 443 `TypeMaterial` citations → OTUs with types get a
  "TypeMaterial"-badged reference.
- **Topics are actively used**, heavily on the Lixinae/Cleonini side (Meregalli catalog
  import) — the yellow "Distribution / description / illustrations" badges are informative
  there, blank elsewhere. No downside.
- **Gaps:** `TaxonDetermination` = 0 and `CollectionObject` = 7, so the panel shows almost no
  specimen-determination provenance — that data isn't citation-linked in this project. Not a
  blocker, just a note on what the badges won't cover.
- **Higher taxa are heavy:** subfamily Entiminae → 869 sources in one fetch. The panel
  paginates client-side (2 shown, "Show all"), so it's usable, but the request itself is big
  on family/subfamily pages.

## How to enable (no code)

`config/taxa_page.yml` — either its own tab or a panel under an existing one:

```yaml
  references:
    label: 'Other references'
    panels:
      - - - id: panel:references-cited
            bind:
              title: 'Other references'
```

The panel is registered by the package (`id: panel:references-cited`). Reference config:
`node_modules/@sfgrp/taxonpages/templates/config/taxa_page.yml.example` puts it under a
`references:` tab. (`sfg-taxonpages/plecoptera` enables it the same way.)
