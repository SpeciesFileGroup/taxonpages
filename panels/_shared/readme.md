# _shared

Not a panel — no `main.js`, so the taxonpages panel loader ignores this directory (same convention as `panels/_gbifShared/`). Holds components shared by multiple panels, imported by relative path.

## DwcTable.vue

Modal showing the full DarwinCore record for a CollectionObject or FieldOccurrence: institution (resolved to full name via GRSciColl), identification, collection event, location, coordinates (with OpenStreetMap link), biological associations, and associated media thumbnails. Fetches `/collection_objects/:id/dwc` or `/field_occurrences/:id/dwc`.

Exposes `show({ id, type })` via `defineExpose`, where `type` is `'CollectionObject'` or `'FieldOccurrence'` (see `@/constants/objectTypes`). Callers hold a `ref` to the component and call `.show(...)` from a click handler; the modal renders itself (a `VModal`).

**Depended on by:**

| Panel | File | Trigger |
|---|---|---|
| PanelMapV2 | `../PanelMapV2/PanelMapV2.vue` | Clicking a Collection Object / Field Occurrence row in a map marker popup |
| PanelMapV2 | `../PanelMapV2/components/Search/OtuSearch.vue` | Clicking a row in the OTU search overlay's map popup |
| PanelGallery (via ImageLightbox) | `./ImageLightbox.vue` | Clicking the ⓘ button on a CO/FO depiction in the lightbox — rendered inside a fixed-position overlay, so the `<DwcTable>` usage is wrapped in `<Teleport to="body">` |
| PanelSpecimenOccurrences | `../PanelSpecimenOccurrences/components/SingleSpeciesOccurrences.vue` | Clicking the ⓘ button on a record row |
| PanelBiologicalAssociationsV2 | `../PanelBiologicalAssociationsV2/PanelBiologicalAssociationsV2.vue` | Clicking the ⓘ button next to a subject/object specimen in the associations table (including an `AnatomicalPart` that wraps a CO/FO — see `resolveSpecimenRef` in that panel's `makeBiologicalAssociation.js`) |

DwcTable itself **opens `./ImageLightbox.vue`** (async import) when a media thumbnail is clicked, passing `:show-info-button="false"` so that lightbox can't re-open a DwcTable (recursion).

If you change this file, sanity-check every call site above — none of them keep their own copy.

**`associatedMedia` URL format**: pipe-separated absolute URLs like `https://sfg.taxonworks.org/api/v1/images/aa7639596f6a04744668dbec7c7493a3` (hex fingerprint, not numeric ID). Fetched via `makeAPIRequest` by extracting the path with `/\/api\/v1(.+)/` and calling `makeAPIRequest.get(m[1], { params: { extend: ['attribution', 'source'] } })`; the response has `{ id, thumb, original, medium, attribution, source }` at the top level.

## ImageLightbox.vue

The one fullscreen image viewer for the whole project (a fork of the package `@/components/ImageViewer` — the richer version that resolves DWC data and links to the specimen modal). Formerly `PanelGallery/GalleryViewer.vue`; moved here 2026-08-30.

Fixed, full-viewport overlay (`fixed inset-0 z-[10000]`, no internal Teleport — wrap it in `<Teleport to="body">` when mounting from inside another fixed overlay). Renders: the current image, prev/next controls, a per-image metadata block, and a thumbnail strip. Keyboard: ←/→ navigate, Esc closes, Tab is focus-trapped.

**Props**

| Prop | Type | Default | |
|---|---|---|---|
| `images` | Array | required | the full list (see image shape below) |
| `index` | Number | required | index of the shown image |
| `next` | Boolean | `false` | a next image exists |
| `previous` | Boolean | `false` | a previous image exists |
| `showInfoButton` | Boolean | `true` | show the ⓘ button that opens `DwcTable` for a CO/FO depiction, and render the nested `DwcTable`. Pass `false` when mounting from within a `DwcTable` to stop the recursion. |
| `minimal` | Boolean | `false` | caption-only: render just the bold label + caption block. No name/OTU block, CO/FO entries, attribution, source, thumbnail strip, ⓘ or DWC fetch. Used by the keys module, whose lead figures only ever carry a label + caption. |

**Emits:** `close`, `next`, `previous`, `selectIndex(i)` — the parent owns `index` and the list.

**Image object shape** (all keys optional except a URL to show):

```ts
{
  id:          number | string,
  thumb:       string,
  medium:      string,
  original:    string,          // shown at full size
  attribution: { label: string },
  source:      { label: string },   // may contain <a> HTML
  citations:   Citation[],          // TW gallery only
  depictions:  Depiction[],         // Otu / CollectionObject / FieldOccurrence — drives the name block + ⓘ
  figure_label: string,             // plain image with no Otu/CO/FO depiction: shown bold …
  caption:      string,             // … plain text, run through the name-italiciser, beneath the label
  captionHtml:  string              // … OR pre-sanitised HTML (keys, URL-linkified) rendered verbatim — wins over `caption`
}
```

If `depictions` has an Otu / CO / FO entry the block shows the parsed taxon name (CO/FO also fetch `/…/dwc` for type status + the ⓘ button). Otherwise, if `figure_label` / `caption` / `captionHtml` are set, they render as a bold-label + caption block. Otherwise just attribution / source. In `minimal` mode only that bold-label + caption block renders.

**Depended on by:**

| Panel | File | Images |
|---|---|---|
| PanelGallery | `../PanelGallery/PanelGallery.vue` | OTU inventory images → subordinate-taxa → iNaturalist fallback (`showInfoButton` on) |
| PaneliNaturalist | `../PaneliNaturalist/PaneliNaturalist.vue` | curated iNaturalist taxon photos |
| PanelBiologicalAssociationsV2 | `../PanelBiologicalAssociationsV2/PanelBiologicalAssociationsV2.vue` | BA plates (`figure_label` / `caption`, no depiction structure) |
| PanelSpecimenOccurrences | `../PanelSpecimenOccurrences/components/SingleSpeciesOccurrences.vue` | specimen `associatedMedia` (depictions carry CO/FO type) |
| DwcTable | `./DwcTable.vue` | the modal's own `associatedMedia` strip (`showInfoButton` off) |
| keys module | `../../modules/keys/components/LeadFigures.vue` | lead figures / "+N more images" (`minimal`, `captionHtml`) |

If you change this file, check all six call sites — the contract is `images` + `index` + the four events; keep it stable.
