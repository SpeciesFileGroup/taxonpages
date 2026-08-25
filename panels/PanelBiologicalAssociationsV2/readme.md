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

## Differences from the built-in panel

- **Depictions** shown as thumbnails inline in the table; clicking opens the full `ImageViewer` lightbox with figure label, attribution, and source reference
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

## ImageViewer

The lightbox reuses the global `ImageViewer` component. Images are shaped to match its expected format:

- `depictions[0].label` — figure label (caption line)
- `attribution.label` — copyright and license
- `source.label` — full publication reference with clickable URLs

## Notes

- `useOtuPageRequest` is called with key `panel:biological-associations-v2` to avoid cache collisions with the built-in panel
- The `citations` plain string from the basic endpoint is kept as a fallback for rows where no structured citations are found via `/citations`
- The subject/object "ⓘ" button opens `../_shared/DwcTable.vue` (shared with PanelMapV2 and PanelGallery — see `../_shared/readme.md`). A subject/object can be an `AnatomicalPart` wrapping a CollectionObject/FieldOccurrence (e.g. a nidus) rather than the specimen directly; `resolveSpecimenRef()` in `makeBiologicalAssociation.js` parses the wrapped specimen's type+id out of `object_label` so locality/collector lookup and the info button still work for those rows
