# PaneliNaturalist

> **Compatibility:** `@sfgrp/taxonpages` ≥ 0.5.4 (npm package setup)

Displays iNaturalist photos for a taxon in two sections: curated taxon photos and paginated research-grade observations.

Adapted from the Orthoptera Species File repository. Adapting it to only show research-grade observations and adjusting the image size, shape, and grid layout was done with assistance of ChatGPT. Fixing the taxon matching problem, extending support to all taxonomic ranks, and adding the curated taxon photos section was done by vibe coding with Claude.ai without human coding input. The code for the GBIF panel was uploaded to Claude as inspiration, as it resolved API requests more accurately.

## Sections

### Curated taxon photos (upper)

Fetched from the iNaturalist `/v1/taxa/:id` endpoint via the `taxon_photos` array. These are photos manually selected by iNaturalist editors as representative of the taxon. They are shown in a responsive grid; clicking any photo opens the shared `../_shared/ImageLightbox.vue` with the full-size image, attribution, and a link to the photo page on iNaturalist. The section header links to the taxon page on iNaturalist. The section is hidden entirely if no curated photos are available.

Note: for higher-rank taxa (genus, tribe, etc.), the curated photos show individual species within the taxon without labeling which species is depicted. This is a limitation of the iNaturalist API — the `taxon_photos` endpoint does not return the source observation or species name for individual photos, and no reliable reverse lookup from photo ID to observation is available.

### Research-grade observations (lower)

Paginated grid of research-grade observation photos. Each photo links to its individual observation on iNaturalist. The section header links to all research-grade observations for the taxon on iNaturalist. Observations without photos are skipped.

## Changes from the original

- Images open in a new tab (`target="_blank" rel="noopener noreferrer"`)
- Hover opacity on image links
- Only research-grade observations shown (`quality_grade: 'research'`) for better photo quality
- Responsive image grid: `grid-cols-[repeat(auto-fill,minmax(400px,1fr))]`
- Image size changed from `square` to `medium` for better resolution
- Panel is no longer restricted to genus and species group ranks — it now works at any rank (family, subfamily, tribe, genus, subgenus, species, etc.)
- Curated taxon photos section added above observations, opening the shared lightbox

## Shared dependencies

- `../_shared/ImageLightbox.vue` — the project-wide fullscreen image viewer (curated-photos click). See [`../_shared/readme.md`](../_shared/readme.md).

## Taxon matching (documentation written by Claude AI)

### Why taxon_id instead of taxon_name

The original code passed `taxon_name` directly to the iNaturalist observations API, which does a fuzzy text search. This caused two problems:

1. A subgenus like *Otiorhynchus (Nihus)* would match the whole genus *Otiorhynchus* on iNaturalist, returning observations that don't belong to the subgenus.
2. Taxa with similar names in unrelated groups could also be matched.

The fix is a two-step lookup:

1. Parse `expanded_name` to detect the rank and name components (genus, subgenus, epithet).
2. Query the iNaturalist `/v1/taxa` endpoint for an **exact taxon ID**, passing the rank from `props.taxon.rank` directly — TaxonWorks and iNaturalist use the same rank name strings, so this works for any rank. For subgenera, the parent genus is also verified via the ancestors list to avoid false matches.
3. Use `taxon_id` (exact) instead of `taxon_name` (fuzzy) for all queries.

If a taxon is not found on iNaturalist (e.g. a subgenus that iNat doesn't recognise), a "No iNaturalist taxon found" message is shown instead of silently falling back to a broader taxon.

### Rank compatibility

TaxonWorks and iNaturalist use the same rank name strings (e.g. `subfamily`, `tribe`, `genus`, `species`), so `props.taxon.rank` can be passed directly to the iNat taxa search for most ranks. The panel therefore works at any rank.

### Subgenus handling

TaxonWorks stores subgenera explicitly, e.g. *Otiorhynchus (Nihus)*. iNaturalist also has subgenera, but not all of them. The panel attempts an exact subgenus lookup and shows nothing if the subgenus is not found on iNat, rather than silently falling back to showing the whole genus.

## Known risks and limitations

**Taxon mismatch at species level within a subgenus.** When the TaxonWorks name is *Genus (Subgenus) epithet*, the subgenus is stripped and the plain binomial *Genus epithet* is used for the iNat lookup. If iNaturalist places the species under a different genus (e.g. due to a recent synonymy that hasn't been applied in both databases), the lookup will fail silently and show no results, which is the safe outcome. A greater risk is that the name matches a different species in iNaturalist's taxonomy — for example if the species was transferred to another genus and the original combination is now a synonym in iNat. Always verify that the iNat taxon page link in the section header points to the expected taxon.

**Taxonomic divergence between TaxonWorks and iNaturalist.** The two databases are curated independently and may disagree on synonymies, generic placements, or rank assignments. A name that is valid in TaxonWorks may be a synonym in iNaturalist (or vice versa), causing the lookup to fail or to return the wrong taxon. There is no cross-database identifier mapping — the match is purely by name and rank string.

**iNaturalist taxonomy changes.** If iNaturalist renames or splits a taxon after the panel is deployed, the name-based lookup may stop working or silently match the wrong taxon. Periodic manual spot-checks are recommended for important taxa.

**Subgenus ancestors not returned.** The iNat `/v1/taxa` search does not always return ancestor data. If the `ancestors` array is empty for a subgenus result, the parent genus cannot be verified and the first name match is accepted. This could in theory cause a false match if two genera have a subgenus with the same name.

**No results vs. wrong results.** The panel is designed to fail visibly (showing "No iNaturalist taxon found") rather than silently showing wrong data. However, a name collision — where the lookup returns a correctly-spelled match that is taxonomically the wrong taxon — cannot be detected automatically.
