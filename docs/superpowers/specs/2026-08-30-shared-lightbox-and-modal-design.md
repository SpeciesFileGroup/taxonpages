# Shared specimen modal + shared lightbox — design

Date: 2026-08-30
Branch: `lightbox-consolidation`

## Goal

1. **Specimen modal** — every panel that summarises a CollectionObject / FieldOccurrence
   record uses the one component in `panels/_shared/` (`DwcTable.vue`), never a private copy.
2. **Lightbox** — one identical fullscreen image viewer everywhere. It also opens when an
   image thumbnail in the specimen modal is clicked. The launching panel hands it the list
   of images to show.
3. **Docs** — panels with a `panels/_shared/` dependency record it in their own readme.

## Findings (pre-work state)

### Modal
All five call sites already import `panels/_shared/DwcTable.vue`:
`PanelMapV2.vue`, `PanelMapV2/components/Search/OtuSearch.vue`,
`PanelGallery/GalleryViewer.vue`, `PanelBiologicalAssociationsV2.vue`,
`PanelSpecimenOccurrences/components/SingleSpeciesOccurrences.vue`. No private copies exist.
→ **Step 1 is verify + document only.**

### Lightbox — three implementations
| Component | Contract | Consumers |
|---|---|---|
| package global `ImageViewer.global.vue` | props `index, images, next, previous`; emits `close, next, previous, selectIndex` | PaneliNaturalist, PanelBiologicalAssociationsV2, PanelSpecimenOccurrences |
| `PanelGallery/GalleryViewer.vue` (local fork) | **same contract** + DWC type-status resolution, ⓘ→DwcTable, citation sub-modal, OTU-validity resolution | PanelGallery only |
| `modules/keys/components/KeyLightbox.vue` | props `figures, index`; emits `close, update:index`; different image shape (`original_png`, HTML captions) | keys module `LeadFigures.vue` (not a panel) |

GBIF panels (`PanelGbifImages`, `PanelGbifTypeSpecimens`) have inline card carousels, not
fullscreen lightboxes — **out of scope**.

`DwcTable.vue` media thumbnails are currently plain `<a target="_blank">` to the raw file.

## Decisions

- **Canonical lightbox** = the richer `GalleryViewer`, promoted to
  `panels/_shared/ImageLightbox.vue` (via `git mv`, history kept). Prop/emit contract is
  already identical to the package `ImageViewer`, so the three panels switch by changing the
  tag + adding an import.
- **Extras ON everywhere.** Consequences:
  - Specimen panel: CO/FO media images gain the type-status line + ⓘ→DwcTable (panel already
    uses DwcTable elsewhere — coherent).
  - iNaturalist panel: shows the parsed taxon name instead of the raw depiction label; no new
    API calls.
  - BA panel: see "BA figure_label fix" below.
- **DwcTable thumbnails** open `<ImageLightbox>` in-app with the modal's `mediaImages`
  (`{ id, thumb, original, medium }`) as the list + the clicked index.
  - Imported via `defineAsyncComponent(() => import('./ImageLightbox.vue'))` — `ImageLightbox`
    statically imports `DwcTable`, so a static import back would be a cycle; async also defers
    loading until a thumbnail is clicked.
  - The ⓘ button is **hidden** in this nested instance (new optional prop, shown by default)
    to prevent `DwcTable → lightbox → DwcTable → …` recursion.
  - The `target="_blank"` raw-file links are removed — right-click on the full-resolution
    image covers save / open-in-tab.
- **Keys module** folds in too, but as **Phase B** with its own design pass (captions are
  HTML + linkified there; the shared lightbox italicises plain-text captions — needs
  reconciliation). Stop after Phase A for review.

### BA `figure_label` fix

Live data (`/depictions?depiction_object_type=BiologicalAssociation`):
`figure_label: "Adosomus roridus feeding on Achillea millefolium"`, `caption: "This is a caption"`.

Today `makeGalleryImage` builds `depictions: [{ label: figure_label }]` and the package viewer
prints the label as a plain `<p>`. The shared lightbox, lacking a `depiction_object_type`,
would run that string through `splitName()` → *"Adosomus roridus feeding on"* italic +
*"Achillea millefolium"* upright, shown in the taxon-name slot. Wrong.

Fix: `makeGalleryImage` sets real top-level fields `figure_label` + `caption` (no fake
depiction). `ImageLightbox` gets a caption block for images that have **no** OTU/CO/FO
depiction structure: **`figure_label` in bold**, `caption` on the line below. This passthrough
is also what keys needs in Phase B.

## Phase A steps (commit after each)

1. `git mv panels/PanelGallery/GalleryViewer.vue panels/_shared/ImageLightbox.vue`; update
   `PanelGallery.vue` import + `PanelGallery/ARCHITECTURE.md` + `README.md`; update
   `DwcTable.vue` header comment path.
2. `ImageLightbox.vue`: add the bold-label + caption block for non-OTU/CO/FO images
   (`image.figure_label` / `image.caption`); add optional prop to hide the ⓘ button.
3. `PaneliNaturalist.vue` → `<ImageLightbox>`.
4. `PanelSpecimenOccurrences/components/SingleSpeciesOccurrences.vue` → `<ImageLightbox>`.
5. `PanelBiologicalAssociationsV2.vue` → `<ImageLightbox>` + `makeGalleryImage` sets real
   `figure_label` / `caption`.
6. `DwcTable.vue`: media thumbnails → async `<ImageLightbox>` with `mediaImages`; drop
   `target="_blank"`; pass the hide-ⓘ prop.
7. Docs: `panels/_shared/readme.md` gains an `ImageLightbox.vue` section (contract, image
   shape, "Depended on by" table); update the `DwcTable.vue` "Depended on by" row; add a
   "Shared deps" line to each consuming panel's readme (create short readmes for
   `PaneliNaturalist` / `PanelSpecimenOccurrences` if missing).
8. `npm run build` (SSR) to exercise the async-component / former-circular path; manual
   walkthrough of every lightbox entry point.

## Testing

No test runner in this repo (`npm test` absent; keys `lib/` has no test files). Regression
checks are manual via `npm run dev` + a production `npm run build`.

## Not doing

- GBIF carousels — left as inline carousels.
- Keys module — Phase B, separate design.
- Any change to the modal's contents or the lightbox's existing gallery behavior beyond what
  is listed above.
