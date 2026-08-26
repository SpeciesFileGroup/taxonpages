# Merge PanelSpecimenRecords + PanelFieldOccurrences — Design

## Problem

`panels/PanelSpecimenRecords/PanelSpecimenRecords.vue` and
`panels/PanelFieldOccurrences/PanelFieldOccurrences.vue` are both wired into the
`specimen_records` tab (`config/taxa_page.yml`) as separate stacked `<VCard>`
panels. Both independently fetch the identical endpoint
`/otus/:otuId/inventory/dwc.json` and filter client-side
(`dwc_occurrence_object_type === 'CollectionObject'`, split further by
`typeStatus` truthiness for the "Type specimens" sub-list, vs.
`=== 'FieldOccurrence'`) — a genuine duplicate network call every time the tab
loads. Their three list components (`ListSpecimens.vue`, `ListTypeSpecimens.vue`,
`ListOccurrences.vue`) are near-identical (differ only in header text and one
`font-medium` class). Label-building and helper code
(`getLocalityData`, `getCountAndSex`, `getCollector`, `getCoordinates`,
`getMediaImages`, institution-name resolution) is duplicated near-verbatim
across both panel files.

Separately, specimen-heavy OTUs can produce long lists where many records
share the same collecting event (e.g. a series of paratypes, or a long run of
specimens from one field trip) — each currently rendered as its own row.

## Goal

Merge both panels into one (`PanelSpecimenOccurrences`), with:
- a single shared fetch,
- a single flat, grouped list instead of two-to-three separate card sections,
- records that share a collecting event collapsed into one row with a count,
- type specimens sorted first.

## Non-goals

- No change to the detail-level shown per row (still the built inline label
  string — institution name, coordinates, collector, etc. — not a switch to
  the shared `DwcTable` modal for row detail). That's a possible future
  follow-up, deliberately deferred.
- No filter control (All / Types / Specimens / Field occurrences). The
  type/CO/FO distinction is not important enough right now to warrant one;
  can be added later if the merged list proves too long in practice.
- No change to `DwcTable.vue`, `specimenRef.js`, or any other panel.

## Data & fetch

One `PanelSpecimenOccurrences.vue` replaces both panels. On mount it fetches:

```js
Promise.all([
  makeAPIRequest.get(`/otus/${otuId}/inventory/dwc.json`),
  makeAPIRequest.get(`/otus/${otuId}/inventory/type_material.json`).catch(...)
])
```

(unchanged from `PanelSpecimenRecords`'s current fetch — the `type_material.json`
cross-reference recovers type specimens whose determination was never updated
after a name change, via `fetchMissingTypeSpecimens`). Media hydration
(`getMediaImages`), the media-first sort, and GRSciColl institution-name
resolution (`resolveInstitutionName`, module-level `instNameCache`) all
carry over unchanged from `PanelSpecimenRecords` and now apply uniformly to
every record in the response (previously `PanelFieldOccurrences` did its own,
separate copy of the same steps).

Label building carries over per record type:
- CollectionObject: `getCountAndSex, getDepositoryData, catalogNumber,
  getLocalityData, getCoordinates, getCollector` (current `makeSpecimenLabel`).
- FieldOccurrence: `getCountAndSex, getLocalityData, getCoordinates,
  getCollector` (current `makeFieldOccurrenceLabel` — no depository/catalog
  number, matching what FieldOccurrence records already lack today).

## Grouping & collapsing

After hydration, split records into two buckets:
- **type bucket**: `dwc_occurrence_object_type === 'CollectionObject' && item.typeStatus`
- **other bucket**: everything else (regular CollectionObject records + all FieldOccurrence records)

Each bucket is grouped by a composite key:

```
(dwc_occurrence_object_type, typeStatus, country, stateProvince, county,
 verbatimLocality, eventDate, recordedBy)
```

- `typeStatus` is part of the key so a holotype and its paratypes from the same
  event never merge (different status), but multiple paratypes from the same
  event do merge into one group.
- `dwc_occurrence_object_type` is part of the key so a CollectionObject and a
  FieldOccurrence never merge into the same group even if every other field
  happens to match.
- Records with no locality/date/collector at all (all key fields empty) are
  never grouped with each other — each renders as its own row. (Grouping
  entirely-empty keys together would silently merge unrelated specimens that
  just happen to be missing the same data.)

A group with exactly one record renders exactly like today's row (unchanged
visual output for the common case). A group with 2+ records renders as one
collapsed row:
- shared label fields (locality, coordinates, collector, and — for CO groups —
  depository) rendered once, using the same label-building helpers against the
  group's first record,
- an aggregated count + noun in place of the single record's `getCountAndSex`
  output: sum of every member's `individualCount`; sex shown only if every
  member has the same `sex` value, otherwise omitted (falls back to the plain
  noun: "N specimens" / "N occurrences" / "N paratypes" etc., pluralizing the
  type status word for type groups),
- combined media thumbnails: the concatenation of every member's
  `associatedMedia` (already-hydrated image objects) passed to the existing
  `GalleryThumbnailList` / `ImageViewer` flow unchanged,
- for CO groups with more than one distinct `catalogNumber`, a small
  disclosure (reusing the existing `IconPlusCircle` "show more" row affordance
  already used for list pagination) revealing the individual catalog numbers.

Render order: all type groups first (each bucket internally sorted
media-present-first, same tiebreak `PanelSpecimenRecords` uses today), then
all other groups (same tiebreak). The existing `MAX = 10` / "show all" paging
applies over the final merged, grouped row list.

## Components

- `panels/PanelSpecimenOccurrences/PanelSpecimenOccurrences.vue` — fetch,
  hydration, grouping (computed), `ImageViewer` wiring. Replaces
  `PanelSpecimenRecords.vue` + `PanelFieldOccurrences.vue`.
- `panels/PanelSpecimenOccurrences/components/ListRecords.vue` — single list
  component (one `<VCard>` titled "Specimen records") replacing
  `ListSpecimens.vue`, `ListTypeSpecimens.vue`, `ListOccurrences.vue`. Renders
  both single-record and collapsed-group rows (row type distinguished by a
  `count > 1` field on each list item).
- `panels/PanelSpecimenOccurrences/main.js` — registers `panel:specimen-occurrences`.

Old folders `panels/PanelSpecimenRecords/` and `panels/PanelFieldOccurrences/`
are deleted entirely (including their `components/` subfolders).

## Config wiring

`config/taxa_page.yml`, `specimen_records.panels`, replace:
```yaml
- - - panel:specimen-records
- - - panel:field-occurrences
```
with:
```yaml
- - - panel:specimen-occurrences
```

## Testing

No automated test suite covers panels in this repo (manual verification is
the norm here — see `CLAUDE.md`: "For UI or frontend changes... test the
feature in a browser"). Verification plan:
- `npm run dev`, load an OTU with type specimens, plain specimens, and field
  occurrences (confirm which OTU has all three via a quick API check before
  testing).
- Confirm: type specimens render first; a holotype and paratypes from the
  same event stay as separate rows; multiple paratypes from the same event
  collapse into one row with a correct count; regular specimens from a shared
  event collapse; field occurrences collapse independently of specimens even
  when co-located; media thumbnails on a collapsed row open `ImageViewer`
  correctly across all merged images; "show all" paging still works.
- Confirm network tab shows exactly one `dwc.json` fetch for the tab (not two).
- Confirm the old panel ids are gone from the rendered page with no console
  errors from `taxa_page.yml` referencing a missing panel.
