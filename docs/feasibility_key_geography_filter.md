# Feasibility — filter a dichotomous key by geography

Investigation for `docs/Task_toDo.md` → "Task Scope by Geography". Probed against
`sfg.taxonworks.org` API v1, 2026-08-30, using key **3977** (Adosomus, 9 species) as the
sample. No code written.

## Verdict

**Feasible, client-side, with a normalization layer.** There is no server-side "species in
country X" query, so the module fetches all distribution data for the key's taxa and filters
in the browser. The main work is turning TaxonWorks' heterogeneous distribution *shapes* into
countries. Region-level statements ("Caucasus") stay fuzzy.

## What the API gives us

### Asserted distributions (the curated statement) — one batched call

`GET /asserted_distributions?otu_id[]=<every terminal OTU>&per=1000`

- Accepts many `otu_id[]`; **key/3977's 8 terminals → 53 records in one call.**
- Each record inlines `asserted_distribution_shape`:
  - `type`: `"GeographicArea"` **or** `"Gazetteer"` (Gazetteer shapes are newer, added 2026, and increasingly used)
  - `name` (e.g. `"Ukraine"`, `"Caucasus"`, `"European Russia"`, `"Austria"`)
  - `iso_3166_a2` — present for country-type areas and *some* gazetteers, absent for many
  - `geographic_area_type.name` — `"Country"`, `"TDWG Level 2"`, `"TDWG Level 4"`, …
  - `level0_id` — the country-level geo-area id, **only** for GeographicArea rows that carry it
  - `parent` — `{ name }`, one level up
- `is_absent` — must be filtered out (a "does NOT occur here" statement).
- `citations[]` — sources, already inlined.
- Also `GET /asserted_distributions?taxon_name_id[]=<scopeTN>&descendants=true&per=1000` →
  every descendant's ADs in one call. This is the primitive for **re-scoping completeness**.

**No server-side geo filter.** `geographic_area_id[]` on `/asserted_distributions` is silently
ignored (total stays 51 426 with or without it). All geo filtering is client-side.

### Specimen / field-occurrence records — one call per taxon

`GET /otus/:id/inventory/dwc.json` → rows with a plain DwC **`country`** string
(`"Ukraine"`, …), covering material citations, specimens **and** AssertedDistribution rows
(`dwc_occurrence_object_type` distinguishes them). 36 rows for OTU 732686.

- **One request per terminal OTU** — fine for a 9-taxon key, ~30 calls for a big multi-series
  key. Concurrency helps; still, make the specimen layer **opt-in / lazy** or ship AD-only first.
- The project-wide `GET /dwc_occurrences` endpoint filters on `country=<name>` (scalar) but
  **ignores `otu_id[]` and `country[]`** — so it can't be scoped to a key's taxon set. Not
  usable here; the per-OTU inventory endpoint is the reliable path.

### Country lookup

`/geographic_areas/:id` and `/geographic_areas?name=` both 404 — there is no public
country-directory endpoint. Not needed: the country list is built from the `name` /
`iso_3166_a2` on the shapes we already fetch.

## The hard part — shape → country normalization

One OTU (732686) carries ADs at four different granularities at once:

| shape type | example | maps to a country? |
|---|---|---|
| Country | Ukraine, Armenia, Kazakhstan | yes — `name` / `iso_3166_a2` directly |
| TDWG Level 4 | `"11AUT-AU"` (an Austrian subdivision) | yes — `parent.name` is usually the country |
| TDWG Level 2 | `"Caucasus"` | **no** — spans ~5 countries |
| Gazetteer | `"European Russia"`, `"Illyria"` | partial — some have `iso_3166_a2`, many don't |

Needs a small normalization layer:
- Country type → use as-is.
- TDWG L4 → `parent.name`, fallback to a `tdwgID`-prefix table.
- TDWG L1/L2 region → a static TDWG-region → member-countries table, or treat "occurs in
  Caucasus" as matching **any** country in that region.
- Gazetteer → `iso_3166_a2` if present, else best-effort by name, else ignored (documented gap).

## Proposed shape (for a later build — not started)

1. `terminalOtus(nodes)` already gives the endpoint OTU ids.
2. Batched `GET /asserted_distributions?otu_id[]=…&per=1000` → `{ otuId: Set<countryCode> }`
   via the normalization layer (drop `is_absent`).
3. Optional lazy per-OTU `inventory/dwc.json` pass to add specimen-derived countries.
4. UI: a country multi-select + hard-coded presets (`Western Palearctic`, `Central Europe`,
   `Neotropical`, …) defined as country-code sets in the module — no API support needed.
5. Terminals whose country set doesn't intersect the selection render greyed / de-emphasised
   (don't remove — the key structure must stay intact).
6. Completeness: `GET /asserted_distributions?taxon_name_id[]=<scope>&descendants=true` →
   restrict the `expected` set in `buildCompletenessReport` to descendants that occur in the
   selected countries; mark in-key-but-out-of-area terminals.

## Caveats to accept up front

- All filtering is client-side over a full fetch (no server geo filter).
- Region-level ADs (TDWG L1/L2, vague gazetteers) are approximate — a species stated only for
  "Caucasus" will match a filter for any Caucasus country.
- Specimen-derived countries cost one call per taxon; AD-only is the cheap, curated default.
- `is_absent` ADs and Gazetteer shapes without ISO codes need explicit handling.
- Distribution data completeness varies wildly by taxon — a "no countries known" terminal
  should be shown as *unknown*, not *out of area*.
