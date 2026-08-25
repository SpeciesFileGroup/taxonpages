# _shared

Not a panel — no `main.js`, so the taxonpages panel loader ignores this directory (same convention as `panels/_gbifShared/`). Holds components shared by multiple panels, imported by relative path.

## DwcTable.vue

Modal showing the full DarwinCore record for a CollectionObject or FieldOccurrence: institution (resolved to full name via GRSciColl), identification, collection event, location, coordinates (with OpenStreetMap link), and associated media thumbnails. Fetches `/collection_objects/:id/dwc` or `/field_occurrences/:id/dwc`.

Exposes `show({ id, type })` via `defineExpose`, where `type` is `'CollectionObject'` or `'FieldOccurrence'` (see `@/constants/objectTypes`). Callers hold a `ref` to the component and call `.show(...)` from a click handler; the modal renders itself (a `VModal`).

**Depended on by:**

| Panel | File | Trigger |
|---|---|---|
| PanelMapV2 | `../PanelMapV2/PanelMapV2.vue` | Clicking a Collection Object / Field Occurrence row in a map marker popup |
| PanelMapV2 | `../PanelMapV2/components/Search/OtuSearch.vue` | Clicking a row in the OTU search overlay's map popup |
| PanelGallery | `../PanelGallery/GalleryViewer.vue` | Clicking the ⓘ button on a CO/FO depiction in the image viewer — rendered inside a fixed-position overlay, so wrap the `<DwcTable>` usage's parent in `<Teleport to="body">` |
| PanelBiologicalAssociationsV2 | `../PanelBiologicalAssociationsV2/PanelBiologicalAssociationsV2.vue` | Clicking the ⓘ button next to a subject/object specimen in the associations table (including an `AnatomicalPart` that wraps a CO/FO — see `resolveSpecimenRef` in that panel's `makeBiologicalAssociation.js`) |

If you change this file, sanity-check all four call sites above — none of them keep their own copy.

**`associatedMedia` URL format**: pipe-separated absolute URLs like `https://sfg.taxonworks.org/api/v1/images/aa7639596f6a04744668dbec7c7493a3` (hex fingerprint, not numeric ID). Fetched via `makeAPIRequest` by extracting the path with `/\/api\/v1(.+)/` and calling `makeAPIRequest.get(m[1])`; the response has `{ id, thumb, original, medium, ... }` at the top level.
