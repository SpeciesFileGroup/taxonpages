# PanelBiologicalAssociationsV2

> **Compatibility:** `@sfgrp/taxonpages` ≥ 0.5.4 (npm package setup)

New experimental panel (`panel:biological-associations-v2`) displaying biological associations for a taxon. Based on the built-in `panel:biological-associations` panel.

Added features: with inline depictions, asserted distributions, and citations that can be clicked to show the full reference. URLs in references are clickable both in the citation popup and the image popup. 

> This panel was developed by vibe coding with [Claude.ai](https://claude.ai).

## Setup

Put this directory (PanelBiologicalAssociationsV2) into the panels folder on the setup branch of your TaxonPages. Add the panel to your `taxa_page.yml` layout:

```yaml
- panel:biological-associations-v2
```

## Configuration

Set via `bind:` in `taxa_page.yml`, same mechanism as `subMaxImages` on the gallery panel:

```yaml
- - - id: panel:biological-associations-v2
      bind:
        collapseAboveRank: 'GenusGroup'
        collapseThreshold: 15
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `collapseAboveRank` | String | `'SpeciesGroup'` | Rank-group cutoff, inclusive: this rank and anything narrower (e.g. `'GenusGroup'` → genus, species, infraspecies) shows the flat per-record table by default; anything broader always shows the grouped family/genus summary. One of `'HigherClassificationGroup'`, `'FamilyGroup'`, `'GenusGroup'`, `'SpeciesGroup'`, `'SpeciesAndInfraspeciesGroup'` (same values as `rank_group` elsewhere in `taxa_page.yml`). |
| `collapseThreshold` | Number | `Infinity` | A flat-eligible page still escalates to the grouped summary if its record count exceeds this. `Infinity` (the default) disables the escalation. |

A flat-eligible page (per `collapseAboveRank`) always loads the flat table first; if its total exceeds `collapseThreshold` it then re-fetches as the grouped summary instead. Pages above the rank cutoff go straight to the grouped summary and never pay for the flat fetch.

## Differences from the built-in panel

- **Depictions** shown as thumbnails inline in the table; clicking opens the shared `../_shared/ImageLightbox.vue` with figure label, attribution, and source reference
- **Asserted distributions** shown as a list of area names per row (absent records struck through)
- **Citations** shown as clickable short references (e.g. "Masur & Wartmann, 2025:93"); clicking opens a modal with the full formatted reference, with URLs rendered as clickable links
- Order and Genus columns removed to reduce horizontal clutter
- Object Family column left blank for non-OTU objects (e.g. FieldOccurrence) and when family data is missing in TaxonWorks

## API calls

After loading the associations page (one call to `/biological_associations?extend[]=...`), four additional batch requests are fired in parallel:

1. `/depictions?depiction_object_type=BiologicalAssociation&depiction_object_id[]=...`  
   Returns depiction records for associations on the current page.

2. `/depictions/gallery?depiction_id[]=...`  
   Returns full image data in one call: thumb/original URLs, figure label, and attribution. This is the same endpoint used by the gallery panel internally (`useGallery.js`).  
   Followed by one batch call to `/images?image_id[]=...&extend[]=source` to fetch publication sources for all images at once.

3. `/asserted_distributions?biological_association_id[]=...`  
   Returns asserted distribution records grouped by association ID.

4. `/citations?citation_object_type=BiologicalAssociation&citation_object_id[]=...&extend[]=source`  
   Returns citation records with the full source object embedded — no separate `/sources` call needed.

## Lightbox

The shared `../_shared/ImageLightbox.vue` (see `../_shared/readme.md`). A BA plate is
not an Otu/CO/FO depiction, so `makeGalleryImage()` shapes each image with the plate
text as top-level fields the lightbox renders as a caption block (label bold, caption
beneath) rather than a fake `depictions` entry:

- `figure_label` — plate label, shown bold
- `caption` — free-text caption, shown beneath
- `attribution.label` — copyright and license
- `source.label` — full publication reference with clickable URLs
- `depictions: []` — no Otu/CO/FO structure, so no name block and no ⓘ button

## Notes

- `useOtuPageRequest` is called with key `panel:biological-associations-v2` to avoid cache collisions with the built-in panel
- The `citations` plain string from the basic endpoint is kept as a fallback for rows where no structured citations are found via `/citations`
- The subject/object "ⓘ" button opens `../_shared/DwcTable.vue` (shared with PanelMapV2 and PanelGallery — see `../_shared/readme.md`). A subject/object can be an `AnatomicalPart` wrapping a CollectionObject/FieldOccurrence (e.g. a nidus) rather than the specimen directly; `resolveSpecimenRef()` in `makeBiologicalAssociation.js` parses the wrapped specimen's type+id out of `object_label` so locality/collector lookup and the info button still work for those rows
