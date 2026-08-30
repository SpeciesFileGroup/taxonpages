# PanelMapV2

> **Compatibility:** `@sfgrp/taxonpages` ≥ 0.5.4 (npm package setup)

This panel is a fork of the vanilla TaxonPages map panel, branched from the state of the codebase on **2026-03-21**. It is a drop-in replacement and accepts the same props (`otuId`, `otu`, `taxon`, `cluster`).

## Key improvements over the original

### More informative popup windows (`components/MapPopup.vue`)

The original popup showed bare item labels for all feature types. This version renders each type differently:

**Collection Object / Field Occurrence**
- Type label ("Collection object" / "Field occurrence") displayed as a muted heading
- Species name on a second line: epithet in italics, author in plain text
- Entire row is a clickable link (blue, hover underline) that opens the full DarwinCore record

**Asserted Distribution / Asserted Absent**
- Type label as a muted heading
- Geographic area name in bold (extracted from the feature label)
- Species name the distribution refers to (italic epithet, plain author)
- Short citations fetched lazily on popup open and displayed as clickable links
- Clicking a citation opens the full reference in a modal overlay
- Citations are cached at the module level so repeated opens are instant

### Full DarwinCore record modal (`../_shared/DwcTable.vue`)

Clicking a Collection Object or Field Occurrence row in the popup opens a structured modal with all available DwC fields, grouped into sections:

- Record
- Identification
- Collection event
- Location
- Elevation / Depth
- Coordinates (with OpenStreetMap link)
- Other
- Specimen (shown last)

Empty fields are hidden. All labels share a single grid column so values align cleanly across sections.

> This component lives in `panels/_shared/DwcTable.vue` so `PanelGallery` (via `ImageLightbox`), `PanelBiologicalAssociationsV2`, `PanelSpecimenOccurrences`, and this panel (`PanelMapV2.vue` + `Search/OtuSearch.vue`) all use the one modal instead of duplicate copies. See [`../_shared/readme.md`](../_shared/readme.md) for the full list of dependents.

## Directory layout

```
PanelMapV2/
  PanelMapV2.vue          # Root component; handles map, popup, citation modal
  main.js                 # Panel entry point
  clusters/               # Leaflet cluster icon logic
  components/
    CachedMap.vue         # Fallback cached-map image
    MapPopup.vue          # Popup rendered into the Leaflet popup element
    Search/               # OTU search overlay
  composables/
    useGeojsonOptions.js  # Wires Leaflet popup events to popupItem ref
  constants/              # Legend definitions
  store/
    useDistributionStore.js  # Pinia store; fetches GeoJSON distribution data
  utils/
    removeDuplicateShapes.js  # Deduplicates features sharing the same geographic shape
    makeGeoJSONFeature.js
    makeSegmentedCircle.js
    isRankGroup.js
```
