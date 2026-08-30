# PanelGallery — Architecture & Decision Trees

Panel id: `panel:gallery-v2`  
Entry point: `main.js` → registers `PanelGallery.vue`  
Lightbox: `panels/_shared/ImageLightbox.vue` — the shared fullscreen viewer (a fork of the
vanilla `ImageViewer`, formerly this panel's local `GalleryViewer.vue`; moved to `_shared/`
2026-08-30 and now used by PaneliNaturalist, PanelBiologicalAssociationsV2,
PanelSpecimenOccurrences and the `DwcTable` media strip too). Its internals are documented in
the sections below and in `panels/_shared/readme.md`.

---

## Component tree

```
PanelGallery.vue
├── GalleryMainImage        (package, @/components/Gallery/GalleryMainImage.vue)
├── thumbnail strip         (inline <div> loop)
└── ImageLightbox.vue     (panels/_shared/, shared fork)
    ├── ControlImagePrevious / ControlImageNext   (package)
    ├── DwcTable            (shared from panels/_shared/DwcTable.vue)
    └── VModal (Teleport)   (citation detail popup)
```

---

## Image-source decision tree (`PanelGallery.vue`)

This is the first and most important decision: where do the images come from?

```mermaid
flowchart TD
    A([Component mounted / SSR prefetch]) --> B[store.loadImages otuId\n→ GET /otus/:id/inventory/images.json]
    B --> C{store.images\nreturned?}
    C -- "length > 0" --> D[✅ Use TaxonWorks images\n twImages = store.images]
    C -- "length === 0" --> E{taxon.id\navailable?}
    E -- No --> G
    E -- Yes --> F[fetchSubordinateFallback\n→ GET /images?taxon_name_id\[]=taxon.id]
    F --> F2{any sub-taxon\nimages found?}
    F2 -- Yes --> H[✅ Use subordinate-taxon images\n subImages]
    F2 -- No --> G{taxon.expanded_name\navailable?}
    G -- No --> Z([No images — card hidden])
    G -- Yes --> I[fetchInatFallback\n→ resolve iNat taxon id\n→ GET curated photos + observations]
    I --> J{iNat returned\nimages?}
    J -- Yes --> K[✅ Use iNaturalist images\n inatImages]
    J -- No --> Z

    D --> ACTIVE
    H --> ACTIVE
    K --> ACTIVE
    ACTIVE([activeImages\npriority: twImages → subImages → inatImages])
```

`activeImages` is the live computed that the gallery and viewer both read from:

```js
// priority order (first non-empty wins)
if (twImages.length)   return twImages
if (subImages.length)  return subImages
return inatImages
```

---

## Data-depiction exclusion

The gallery is OTU-scoped, so it must not surface **data depictions**
(`is_metadata_depiction` — TW's own UI label: *"Is data depiction"*: a label
photo, a shot of handwritten notes, a ledger page) that belong to a
CollectionObject / FieldOccurrence. Those are viewable in the CO/FO detail modal
(`DwcTable`, via DWC `associatedMedia`). A data depiction attached **directly to
the OTU** is kept.

`GET /otus/:id/inventory/images` does **not** serialize `is_metadata_depiction`,
and `GET /images?metadata_depiction=false` is unusable (TW's filter does
`where.not(is_metadata_depiction: true)`, which also drops the NULL-flag rows that
are the overwhelming majority). So the flag is fetched separately:

```mermaid
flowchart TD
    A[onMounted / onServerPrefetch] --> B["GET /depictions?otu_id[]=X\n&otu_scope[]=all&otu_scope[]=coordinate_otus&per=500"]
    B --> C[dropIdsFromDepictions rows]
    C --> D{"image has ANY depiction\nwith is_metadata_depiction === true ?"}
    D -- no --> K[keep]
    D -- yes --> E{"...and at least one\nof those is on an Otu ?"}
    E -- yes --> K
    E -- no --> X[add id to dataDepictionDropIds]
    X --> F["twImages = store.images\n.map(normalizeImage)\n.filter(img ⇒ !dropIds.has(img.id))"]
```

An image counts as a data depiction if **any** of its depictions carries the
flag — an unflagged `Otu` depiction on the same image does not rescue it (that
happens routinely: a label photo gets attached to both the CollectionObject *and*
the OTU, but only the CO depiction is ticked). It's shown only when the flag is
on an `Otu` depiction.

`otu_scope` matches what `useImageStore` sends, so the depiction rows cover the
same image-id universe as the inventory endpoint (TW's Depiction and Image otu
scope facets share code). On any failure the drop set stays empty → no filtering,
same as before. The same `dropIdsFromDepictions()` is applied to the
subordinate-taxa fallback (keyed by `image_id[]` of the sampled images).

---

## Subordinate-taxa fallback — fetch strategy

3 requests, 2 sequential round trips. Each data page fetches `ceil(subMaxImages / 2)` images (`perPage`):

```mermaid
flowchart TD
    P["Probe: GET /images per=1\n→ pagination-total header only"] --> C{totalPages > 1?}
    C -- No\none page exists --> D1["GET /images page=random, per=perPage"]
    C -- Yes --> D2["GET /images page=randomA, per=perPage\nGET /images page=randomB, per=perPage\n(parallel, distinct pages)"]
    D1 --> E["Combine → GET /depictions?image_id[]=…\ndrop data depictions (see above)\nslice to subMaxImages\nnormalizeImage each → subImages"]
    D2 --> E
```

The probe uses `per=1` to minimise transferred data — only the `pagination-total` header is needed. `totalPages` is then computed as `ceil(total / perPage)`. The two data requests are fired in parallel via `Promise.all`.

For taxa with only one page of results (`totalPages = 1`) a single data request is made instead.

Constant: `SUB_IMAGE_TIMEOUT_MS = 8000`.

### Configuring `subMaxImages` via YAML

`subMaxImages` is passed as a prop through the framework's `bind:` mechanism in `config/taxa_page.yml`:

```yaml
- - - id: panel:gallery-v2
      bind:
        subMaxImages: 10
```

Any key under `bind:` is spread onto the panel component via `v-bind` in `PageLayout.vue`. Change the number there; no code change needed.

---

## iNaturalist fallback — name resolution

`taxon.expanded_name` (e.g. `"Curculio (Curculio) glandium"`) is parsed before querying iNat, because iNat does not use the subgenus notation.

```mermaid
flowchart TD
    N1[parseName expanded_name] --> N2{subgenus present?}
    N2 -- "Yes, e.g. Genus (Sub) sp" --> N3{epithet present?}
    N3 -- No → subgenus-only taxon --> N4[Search iNat: q=subgenus rank=subgenus\nMatch by name + ancestor genus]
    N3 -- Yes → species in subgenus --> N5[Flatten to 'Genus epithet'\nSearch iNat: q=plainName rank=taxon.rank\nMatch by exact name]
    N2 -- No --> N5
    N4 --> R[resolved taxon id]
    N5 --> R

    R --> P1[GET /taxa/:id\n→ curated taxon_photos up to 10]
    P1 --> P2{slots remaining\n< 10?}
    P2 -- Yes --> P3[GET /observations?taxon_id\nquality_grade=research\nfill remaining slots]
    P2 -- No --> DONE
    P3 --> DONE([inatImages array])
```

Each iNat image is normalized to the same shape as a TW image so the rest of the gallery is source-agnostic:

```
{ id, thumb, medium, original, attribution, source, depictions: [{ label: taxonName }] }
```

---

## Depiction type inference (`ImageLightbox.vue`)

The `/inventory/images.json` endpoint does not always serialize `depiction_object_type`. `inferDepictionType` reconstructs it from the label string format:

```mermaid
flowchart TD
    D1{dep.depiction_object_type\nexplicitly set?} -- Yes --> D_RET[return it as-is]
    D1 -- No --> D2{label starts with\n'CollectionObject '?}
    D2 -- Yes --> D_CO[return 'CollectionObject']
    D2 -- No --> D3{label starts with\n'FieldOccurrence '?}
    D3 -- Yes --> D_FO[return 'FieldOccurrence']
    D3 -- No --> D4{label contains ': '?}
    D4 -- Yes --> D_OTU[return 'Otu']
    D4 -- No --> D5{dep.depiction_object_id\nexists?}
    D5 -- Yes --> D_OTU
    D5 -- No --> D_NULL[return null\n synthetic / iNat image]
```

---

## imageDisplay computed — name & metadata assembly

For each image shown in the viewer, `imageDisplay` collects all metadata into one object. It runs three name-resolution passes in priority order:

```mermaid
flowchart TD
    IMG[current image's depictions\[]]

    IMG --> P1{OTU depiction\nfound?}
    P1 -- Yes --> P1A[Parse label before ': '\nsplitName → italic + plain\nRead otuValidCache for link target]
    P1 -- No --> P2{CO/FO depiction found\nAND in dwcCache?}
    P2 -- Yes --> P2A[Use dwcCache scientificName\nsplitName → italic + plain\nOTU link from dwcCache.otuId]
    P2 -- No --> P3{synthetic dep\nnull type with label?}
    P3 -- Yes --> P3A[Use label directly as name\n no OTU link]
    P3 -- No --> P3B[name = null\n nothing shown]

    P1A --> OUT
    P2A --> OUT
    P3A --> OUT
    P3B --> OUT

    OUT[imageDisplay:\n name italic + plain\n otuId for RouterLink\n hasOtu flag\n otuDesc figure label\n coEntries\[]\n]
```

`coEntries` — one entry per CO/FO depiction:

| Field | Source |
|---|---|
| `typeStatus` | `dwcCache[id].typeStatus` |
| `figureLabel` | `dep.figure_label` |
| `caption` | `dep.caption` |
| `dwcOk` | cache entry exists and no error |
| `dwcLoading` | cache entry is `null` (request in flight) |

Entries are filtered out when the DWC fetch failed **and** there is no own content to show (no figure label, no caption) — avoids rendering a broken ⓘ button with nothing beneath it.

---

## DWC prefetch & OTU validity chain

```mermaid
sequenceDiagram
    participant W as watch(index)
    participant FC as fetchDwcForImage
    participant FO as resolveValidOtuForImage
    participant API as TaxonWorks API
    participant DC as dwcCache (reactive)
    participant OC as otuValidCache (reactive)

    W->>FC: images[idx-1, idx, idx+1]
    FC->>API: GET /collection_objects/:id/dwc\nor /field_occurrences/:id/dwc
    API-->>DC: { typeStatus, scientificName, otuId }

    W->>FO: images[idx-1, idx, idx+1]
    FO->>OC: optimistic: cache[otuId] = otuId
    FO->>API: GET /otus/:id → taxon_name_id
    FO->>API: GET /taxon_names/:id → cached_valid_taxon_name_id
    alt validId ≠ taxon_name_id
        FO->>API: GET /otus?taxon_name_id[]=validId
        API-->>OC: otuValidCache[rawId] = validOtuId
    end
```

Because `dwcCache` and `otuValidCache` are `reactive({})`, assigning a key triggers Vue reactivity and causes `imageDisplay` to recompute automatically — no explicit invalidation needed.

---

## Image loading state

`ImageLightbox` tracks whether the full-size image has finished loading:

- `isLoading` starts `true` and is reset to `true` on every index change (before the browser fetches the new src).
- `onMounted` attaches native `load` and `error` listeners to the `<img>` element; either event sets `isLoading = false`.
- A `complete` check runs immediately in `onMounted` to clear the flag when the first image is already in the browser cache.
- While `isLoading` is true: the image renders at `opacity-20` and a `<VSpinner>` overlay is shown, making navigation feedback unambiguous even on slow connections.

---

## Keyboard & lifecycle

| Event | Listener | Action |
|---|---|---|
| `ArrowLeft` | `keyup` | emit `previous` (if `props.previous`) |
| `ArrowRight` | `keyup` | emit `next` (if `props.next`) |
| `Escape` | `keyup` | emit `close` |
| `Tab` / `Shift+Tab` | `keydown` | `trapFocus` — wraps focus within the dialog |
| mount | — | save `document.activeElement`, add listeners, `body.overflow-hidden` |
| unmount | — | remove listeners, restore scroll, restore focus to saved element |

`Tab` is handled on `keydown` (not `keyup`) because the browser moves focus on `keydown`; intercepting on `keyup` would run one step too late to prevent the focus escaping the overlay.

### Focus trap

`trapFocus` queries all focusable elements inside `viewerRef` (`a[href]`, non-disabled `button`, positive `tabindex`) and wraps:
- Tab on the last element → jumps to first
- Shift+Tab on the first element → jumps to last

### Focus restoration

`previouslyFocusedElement` captures `document.activeElement` at mount. On `onUnmounted` it calls `.focus()` on it, returning the user to the element that opened the viewer (typically the thumbnail they clicked).

### ARIA

The root `<div>` carries `role="dialog"`, `aria-modal="true"`, and `aria-label="Image viewer"`. `aria-modal` tells screen readers to treat the rest of the page as inert while the overlay is open.

---

## Data shape — normalized image object

All three sources (TaxonWorks, subordinate taxa, iNaturalist) produce the same shape so the gallery, thumbnail strip, and viewer need no source-awareness:

```ts
{
  id:          number | string,
  thumb:       string,   // URL
  medium:      string,   // URL
  original:    string,   // URL
  attribution: { label: string },
  source:      { label: string },  // may contain <a> HTML for iNat links
  citations:   Citation[],         // TW only; empty array for iNat / sub fallback
  depictions:  Depiction[]         // shape depends on source — see inferDepictionType
}
```

---

## Props summary

### `PanelGallery.vue`

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `otuId` | String\|Number | required | Primary key for TW image fetch |
| `taxon` | Object | `undefined` | Needs `.id` (sub-taxa fallback) and `.expanded_name` (iNat fallback) |
| `otu` | Object | `undefined` | Available but not currently used inside the component |
| `sort_order` | Array | `[]` | Forwarded to `store.loadImages` |
| `subMaxImages` | Number | `10` | Max images returned by the subordinate-taxa fallback. Set via `bind:` in `taxa_page.yml`. |

### `ImageLightbox.vue`

| Prop | Type | Purpose |
|---|---|---|
| `images` | Array | Full image list |
| `index` | Number | Currently displayed index |
| `next` | Boolean | Whether a next image exists |
| `previous` | Boolean | Whether a previous image exists |

Emits: `close`, `next`, `previous`, `selectIndex(i)`
