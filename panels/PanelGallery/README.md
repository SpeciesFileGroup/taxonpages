# PanelGallery (`panel:gallery-v2`)

Image gallery panel for OTU pages. Falls back to subordinate-taxa images, then iNaturalist, when no direct TaxonWorks images exist.

**Data depictions** (`is_metadata_depiction` — label photos, ledger pages, etc.) attached to a CollectionObject / FieldOccurrence are excluded from this OTU-scoped gallery; they remain visible in the specimen detail modal. A data depiction attached directly to the OTU is shown. See [ARCHITECTURE.md](./ARCHITECTURE.md#data-depiction-exclusion).

## Shared dependencies

- `../_shared/ImageLightbox.vue` — the project-wide fullscreen viewer (this panel is where it originated, as `GalleryViewer.vue`). Rendered with the ⓘ / DWC extras on.
- `../_shared/DwcTable.vue` — reached through `ImageLightbox`'s ⓘ button.

See [`../_shared/readme.md`](../_shared/readme.md).

---

## Configuration

In `config/taxa_page.yml`, register the panel as an object and pass options under `bind:`:

```yaml
- - - id: panel:gallery-v2
      bind:
        subMaxImages: 10
```

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `subMaxImages` | Number | `10` | Maximum images shown when falling back to subordinate-taxa images. Increase for higher-level taxa where more variety is wanted; decrease to reduce API load. |

> **Changing `subMaxImages`** only affects the subordinate-taxa fallback (triggered when the OTU has no direct images). TaxonWorks images and iNaturalist images are not limited by this setting.

---

For a full breakdown of the decision tree, data flow, and component structure, see [ARCHITECTURE.md](./ARCHITECTURE.md).
