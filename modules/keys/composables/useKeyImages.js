// Per-lead taxon-image loader for the key views.
//
// A dichotomous-key lead can carry its own figures (`lead.figures`) but in practice
// no key in this project does. So for a lead that keys out an OTU we fall back to
// images OF that taxon, mirroring the OTU Gallery panel:
//   1. GET /otus/:id/inventory/images.json  → OTU + CollectionObject + FieldOccurrence
//      depiction images in one call
//   2. if that is empty → iNaturalist (curated taxon photos, then research-grade
//      observations), same logic as panels/PanelGallery/PanelGallery.vue
//
// Instantiated once in KeyView and provided as `keyImages`; LeadFigures injects it.
// Results are cached + de-duped per OTU id. KeyView is reused across /key/:id
// navigations, so KeyView.load() calls `reset()` on each load — without it the
// per-instance `metaMap` (iNaturalist fallback) and `entries` cache would resolve a
// later key's leads against the first key's taxa.

import { reactive } from 'vue'
import axios from 'axios'
import { makeAPIRequest } from '@/utils/request'
import { finestRank } from '../lib/completeness.js'
import { normalizeKeyImages, indexTaxonMeta } from '../lib/images.js'

const INAT_MAX = 10

// ── iNaturalist helpers — ported from PanelGallery.vue ────────────────────────

function parseName(expandedName) {
  const subgenusMatch = String(expandedName).match(/^(\S+)\s+\((\S+)\)(?:\s+(\S+))?$/)
  if (subgenusMatch) {
    return {
      genus: subgenusMatch[1],
      subgenus: subgenusMatch[2],
      epithet: subgenusMatch[3] || null
    }
  }
  const parts = String(expandedName).trim().split(/\s+/)
  return { genus: parts[0], subgenus: null, epithet: parts[1] || null }
}

async function resolveInatTaxonId(name, rank) {
  if (!name) return null
  const { genus, subgenus, epithet } = parseName(name)

  if (subgenus && !epithet) {
    const { data } = await axios.get('https://api.inaturalist.org/v1/taxa', {
      params: { q: subgenus, rank: 'subgenus', per_page: 10, all_names: true }
    })
    const match = (data.results || []).find((t) => {
      if (t.name.toLowerCase() !== subgenus.toLowerCase()) return false
      if (t.ancestors?.length) {
        return t.ancestors.some(
          (a) => a.rank === 'genus' && a.name.toLowerCase() === genus.toLowerCase()
        )
      }
      return true
    })
    return match ? match.id : null
  }

  const plainName = subgenus && epithet ? `${genus} ${epithet}` : name
  const params = { q: plainName, per_page: 10 }
  if (rank) params.rank = rank
  const { data } = await axios.get('https://api.inaturalist.org/v1/taxa', { params })
  const match = (data.results || []).find(
    (t) => t.name.toLowerCase() === plainName.toLowerCase()
  )
  return match ? match.id : null
}

function makeTaxonPhotoImage(taxonPhoto) {
  const photo = taxonPhoto.photo
  const photoUrl = `https://www.inaturalist.org/photos/${photo.id}`
  const taxonName = taxonPhoto.taxon?.name || ''
  return {
    id: photo.id,
    thumb: photo.medium_url || photo.url.replace('square', 'medium'),
    medium: photo.medium_url || photo.url.replace('square', 'medium'),
    original: photo.original_url || photo.large_url || photo.url.replace('square', 'original'),
    attribution: { label: photo.attribution || '' },
    source: {
      label: `<a href="${photoUrl}" target="_blank" rel="noopener noreferrer" class="text-secondary hover:underline">${photoUrl}</a>`
    },
    depictions: taxonName ? [{ label: taxonName }] : []
  }
}

function makeObservationImage(obs, photo) {
  const obsUrl = `https://www.inaturalist.org/observations/${obs.id}`
  return {
    id: photo.id,
    thumb: photo.url.replace('square', 'medium'),
    medium: photo.url.replace('square', 'medium'),
    original: photo.url.replace('square', 'original'),
    attribution: { label: photo.attribution || '' },
    source: {
      label: `<a href="${obsUrl}" target="_blank" rel="noopener noreferrer" class="text-secondary hover:underline">${obsUrl}</a>`
    },
    depictions: obs.taxon?.name ? [{ label: obs.taxon.name }] : []
  }
}

// ── loader ───────────────────────────────────────────────────────────────────

export function useKeyImages(terminalOtusRef) {
  // otuId -> reactive { state: 'idle'|'loading'|'ready'|'empty'|'error', images: [] }
  const entries = reactive({})
  let metaMap = null // otuId -> { name, rank }, for the iNaturalist fallback
  let metaPromise = null
  let gen = 0 // bumped by reset(); an in-flight resolveMeta() from an older gen must not publish

  function entryFor(otuId) {
    const key = String(otuId)
    if (!entries[key]) entries[key] = { state: 'idle', images: [] }
    return entries[key]
  }

  // Called by KeyView.load() before the next key's tree is built: drop the image
  // cache and force resolveMeta() to rebuild from the new key's terminal OTUs.
  function reset() {
    for (const k of Object.keys(entries)) delete entries[k]
    metaMap = null
    metaPromise = null
    gen++
  }

  // One batched pass (2 requests total, regardless of key size), lazily on first
  // iNaturalist fallback: terminal OTU ids -> taxon-name id -> { name, rank }.
  function resolveMeta() {
    if (metaMap) return Promise.resolve(metaMap)
    if (!metaPromise) {
      const myGen = gen
      metaPromise = (async () => {
        const build = async () => {
          const otuIds = [
            ...new Set((terminalOtusRef?.value || []).map((t) => t.id).filter((v) => v != null))
          ]
          if (!otuIds.length) return {}

          const oq = new URLSearchParams()
          otuIds.forEach((id) => oq.append('otu_id[]', id))
          oq.set('per', '1000')
          const { data: otus } = await makeAPIRequest.get(`/otus?${oq.toString()}`)

          const otuIdByTnId = {}
          const tnIds = []
          for (const o of Array.isArray(otus) ? otus : []) {
            if (o.taxon_name_id != null) {
              otuIdByTnId[o.taxon_name_id] = o.id
              tnIds.push(o.taxon_name_id)
            }
          }
          if (!tnIds.length) return {}

          const tq = new URLSearchParams()
          tnIds.forEach((id) => tq.append('taxon_name_id[]', id))
          tq.set('per', '1000')
          const { data: tns } = await makeAPIRequest.get(`/taxon_names?${tq.toString()}`)

          return indexTaxonMeta(tns, otuIdByTnId, (arr) => finestRank(arr))
        }

        let result
        try {
          result = await build()
        } catch {
          result = {}
        }
        // Superseded by a reset() (key-to-key nav) while we were awaiting — return
        // the value to any current awaiter but don't cache it as this instance's map.
        if (myGen !== gen) return result
        return (metaMap = result)
      })()
    }
    return metaPromise
  }

  async function loadInventory(otuId) {
    const { data } = await makeAPIRequest.get(
      `/otus/${otuId}/inventory/images.json`,
      { params: { extend: ['depictions', 'attribution', 'source', 'citations'] } }
    )
    const order = Array.isArray(data?.image_order) ? data.image_order.filter(Boolean) : []
    const raw = order.map((id) => data?.images?.[id]).filter(Boolean)
    return normalizeKeyImages(raw, { sourceTag: 'taxonworks' })
  }

  async function loadInat(otuId) {
    await resolveMeta()
    const meta = metaMap?.[otuId]
    if (!meta?.name) return []

    const taxonId = await resolveInatTaxonId(meta.name, meta.rank)
    if (!taxonId) return []

    const { data: taxonData } = await axios.get(
      `https://api.inaturalist.org/v1/taxa/${taxonId}`
    )
    const curated = (taxonData.results?.[0]?.taxon_photos || [])
      .slice(0, INAT_MAX)
      .map(makeTaxonPhotoImage)

    let observations = []
    const remaining = INAT_MAX - curated.length
    if (remaining > 0) {
      const { data: obsData } = await axios.get(
        'https://api.inaturalist.org/v1/observations',
        { params: { taxon_id: taxonId, quality_grade: 'research', per_page: remaining } }
      )
      observations = (obsData.results || [])
        .filter((obs) => obs.observation_photos?.[0])
        .map((obs) => makeObservationImage(obs, obs.observation_photos[0].photo))
    }

    return normalizeKeyImages([...curated, ...observations], { sourceTag: 'inaturalist' })
  }

  // Kick off (or return the in-flight/cached) load for one OTU. Idempotent.
  function request(otuId) {
    if (otuId == null) return { state: 'empty', images: [] }
    const e = entryFor(otuId)
    if (e.state !== 'idle') return e
    e.state = 'loading'
    ;(async () => {
      try {
        let images = await loadInventory(otuId)
        if (!images.length) images = await loadInat(otuId)
        e.images = images
        e.state = images.length ? 'ready' : 'empty'
      } catch {
        e.state = 'error'
      }
    })()
    return e
  }

  return { request, entryFor, reset }
}
