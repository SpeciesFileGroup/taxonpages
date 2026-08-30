// Pure transforms for key lead images. No Vue, no network — Node-testable.
//
// Two upstream shapes get normalised to one:
//   - TaxonWorks inventory images (/otus/:id/inventory/images.json → images[id]):
//     { id, thumb, medium, original_png, attribution:{label}, source:{label},
//       depictions:[{ label, depiction_object_type }] }
//   - iNaturalist images (built in the composable, mirroring PanelGallery):
//     { id, thumb, medium, original, attribution:{label}, source:{label:'<a…>'},
//       depictions:[{ label: taxonName }] }
//
// Output shape is what LeadFigures reads (and maps onto the shared
// panels/_shared/ImageLightbox.vue in `minimal` mode):
//   { id, thumb, medium, original, label, caption, sourceTag }
// - `label`     → the lightbox heading (taxon name)
// - `caption`   → HTML (attribution + source), run through sanitizeAndLinkifyHtml
// - `sourceTag` → 'TaxonWorks' | 'iNaturalist', for the one-line strip caption

const TOKEN =
  (typeof __APP_ENV__ !== 'undefined' && __APP_ENV__.project_token) || ''
const API_URL = (typeof __APP_ENV__ !== 'undefined' && __APP_ENV__.url) || ''

// `original_png` comes back as "/api/v1/<path>"; the package strips the first 8
// chars ("/api/v1/") and re-roots it on __APP_ENV__.url with a token query.
export function resolveOriginalPng(originalPng, { apiUrl = API_URL, token = TOKEN } = {}) {
  if (!originalPng) return ''
  return `${apiUrl}/${String(originalPng).substring(8)}?project_token=${token}`
}

// A CollectionObject / FieldOccurrence / CollectingEvent depiction `label` is a catalog
// identifier ("CollectionObject 123; uuid: …"), never a display name — reject those so
// only a real OTU / iNaturalist depiction name is used as the image heading.
const CATALOG_LABEL_RE = /^(CollectionObject|FieldOccurrence|CollectingEvent)\b/i

function firstDepictionLabel(raw) {
  const list = Array.isArray(raw?.depictions) ? raw.depictions : []
  const hit = list.find((d) => d && d.label && !CATALOG_LABEL_RE.test(String(d.label).trim()))
  return hit ? String(hit.label) : ''
}

function buildCaption(raw) {
  const attribution = raw?.attribution?.label ? String(raw.attribution.label).trim() : ''
  const source = raw?.source?.label ? String(raw.source.label).trim() : ''
  return [attribution, source].filter(Boolean).join(' · ')
}

// sourceTag: 'taxonworks' | 'inaturalist'
export function normalizeKeyImage(raw, { sourceTag = 'taxonworks', apiUrl = API_URL, token = TOKEN } = {}) {
  if (!raw) return null
  const original =
    raw.original ||
    (raw.original_png ? resolveOriginalPng(raw.original_png, { apiUrl, token }) : '')
  const medium = raw.medium || raw.thumb || original
  const thumb = raw.thumb || raw.medium || original
  return {
    id: raw.id,
    thumb,
    medium,
    original,
    label: firstDepictionLabel(raw),
    caption: buildCaption(raw),
    sourceTag: sourceTag === 'inaturalist' ? 'iNaturalist' : 'TaxonWorks'
  }
}

export function normalizeKeyImages(list, opts) {
  return (Array.isArray(list) ? list : [])
    .map((raw) => normalizeKeyImage(raw, opts))
    .filter((img) => img && (img.thumb || img.medium || img.original))
}

// Split a normalised list into the visible preview strip + a "+N more" remainder.
export function pickPreview(list, n = 3) {
  const all = Array.isArray(list) ? list : []
  const count = Math.max(0, Math.floor(n))
  return { preview: all.slice(0, count), rest: Math.max(0, all.length - count) }
}

// Stable identity for a lead figure — the underlying image, ignoring per-lead
// caption / figure_label differences. `original_png` is "/api/v1/images/<id>/…".
export function figureKey(fig) {
  if (!fig) return ''
  const m = String(fig.original_png || '').match(/\/images\/(\d+)/)
  if (m) return `img:${m[1]}`
  return fig.thumb || fig.medium || fig.original || ''
}

// Split a couplet's per-lead figure lists into couplet-level shared figures and
// per-lead individual figures.
//
// A figure is SHARED when every lead of the couplet carries figures and that
// figure (by figureKey) is present on all of them — e.g. one plate added to both
// leads to illustrate the contrast. Anything else stays with its lead.
//
// `leadFigureLists` is an array parallel to the couplet's leads; each item is that
// lead's `figures` array. Returns { shared: figure[], own: figure[][] } where `own`
// is parallel to the input. Shared figures keep a representative object, preferring
// one that has a caption.
export function partitionCoupletFigures(leadFigureLists) {
  const arrs = (Array.isArray(leadFigureLists) ? leadFigureLists : []).map((a) =>
    Array.isArray(a) ? a : []
  )
  const shared = []

  if (arrs.length >= 2 && arrs.every((a) => a.length)) {
    const keySets = arrs.map((a) => new Set(a.map(figureKey)))
    const common = [...keySets[0]].filter(
      (k) => k && keySets.every((s) => s.has(k))
    )
    for (const k of common) {
      let rep = null
      for (const a of arrs) {
        for (const f of a) {
          if (figureKey(f) !== k) continue
          if (!rep) rep = f
          if (f && f.caption) { rep = f; break }
        }
        if (rep && rep.caption) break
      }
      if (rep) shared.push(rep)
    }
  }

  const sharedKeys = new Set(shared.map(figureKey))
  const own = arrs.map((a) => a.filter((f) => !sharedKeys.has(figureKey(f))))
  return { shared, own }
}

// From a batched /taxon_names response, index { otuId → { name, rank } } for the
// iNaturalist fallback. `otuIdByTnId` maps taxon_name_id → otu_id (from /otus).
// `normRank` is injected (lib/completeness.js#finestRank wrapped by the caller) so
// this stays dependency-free and testable.
export function indexTaxonMeta(taxonNameRows, otuIdByTnId, normRank = (r) => r || '') {
  const out = {}
  for (const row of Array.isArray(taxonNameRows) ? taxonNameRows : []) {
    if (!row || row.id == null) continue
    const otuId = otuIdByTnId?.[row.id]
    if (otuId == null) continue
    out[otuId] = {
      name: row.cached || row.name || '',
      rank: normRank([row.rank]) || ''
    }
  }
  return out
}
