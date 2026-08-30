<template>
  <VCard v-if="showCard">
    <VCardHeader
      v-if="subImages.length && !twImages.length"
    >
      No depictions for this taxon — showing a random sample from subordinate taxa
    </VCardHeader>
    <VCardHeader
      v-if="inatImages.length"
      class="flex items-center gap-3"
    >
      <img
        :src="inatMark"
        alt="iNaturalist"
        class="h-8 w-auto shrink-0"
      />
      <span class="text-warning grow">
        No images found on TaxonWorks, fetched from iNaturalist instead
      </span>
    </VCardHeader>
    <VCardContent>
      <VSpinner v-if="isLoadingInat || isLoadingSub" />
      <template v-else-if="currentImage">
        <GalleryMainImage
          :image="currentImage"
          @open:viewer="isViewerOpen = true"
        />
        <div class="flex flex-row overflow-x-auto gap-1.5 pt-2 pb-2">
          <div
            v-for="(image, index) in activeImages"
            :key="image.id"
            class="w-24 h-20 flex-shrink-0 cursor-pointer rounded-md border overflow-hidden hover:opacity-80 transition"
            :class="galleryIndex === index ? 'border-secondary' : 'border-base-muted'"
            @click="galleryIndex = index"
          >
            <img
              class="w-24 h-20 object-contain"
              :src="image.thumb"
              :alt="image.depictions?.map((d) => d.label).join(';')"
            />
          </div>
        </div>
        <ImageLightbox
          v-if="isViewerOpen"
          :index="galleryIndex"
          :images="activeImages"
          :next="galleryIndex < activeImages.length - 1"
          :previous="galleryIndex > 0"
          @select-index="galleryIndex = $event"
          @next="galleryIndex++"
          @previous="galleryIndex--"
          @close="isViewerOpen = false"
        />
      </template>
    </VCardContent>
  </VCard>
</template>

<script setup>
import { computed, watch, ref, onServerPrefetch, onMounted, onBeforeUnmount } from 'vue'
import axios from 'axios'
import { useImageStore } from '@/modules/otus/store/useImageStore'
import { makeAPIRequest } from '@/utils/request'
import GalleryMainImage from '@/components/Gallery/GalleryMainImage.vue'
import ImageLightbox from '../_shared/ImageLightbox.vue'
import inatMark from '../PaneliNaturalist/inat-mark.svg'

const INAT_MAX = 10
const SUB_IMAGE_TIMEOUT_MS = 8000

const props = defineProps({
  otuId: {
    type: [String, Number],
    required: true
  },
  sort_order: {
    type: Array,
    default: () => []
  },
  taxon: {
    type: Object,
    default: undefined
  },
  otu: {
    type: Object,
    default: undefined
  },
  subMaxImages: {
    type: Number,
    default: 10
  }
})

function normalizeImage(img) {
  const { url, project_token } = __APP_ENV__
  return {
    id: img.id,
    thumb: img.thumb,
    medium: img.medium,
    original: img.original_png
      ? `${url}/${img.original_png.substring(8)}?project_token=${project_token}`
      : img.original,
    attribution: img.attribution || { label: '' },
    source: img.source || { label: '' },
    citations: img.citations || [],
    depictions: img.depictions || []
  }
}

const store = useImageStore()

// Image ids to hide from this OTU-scoped gallery: images tied to the OTU scope
// ONLY through a data depiction (is_metadata_depiction — a label photo, a shot of
// handwritten notes, …) on a CollectionObject/FieldOccurrence. A data depiction
// attached directly to the OTU is kept. The /otus/:id/inventory/images endpoint
// doesn't serialize is_metadata_depiction, so the flag comes from /depictions.
const dataDepictionDropIds = ref(new Set())

const twImages = computed(() =>
  (store.images || [])
    .map(normalizeImage)
    .filter((img) => !dataDepictionDropIds.value.has(img.id))
)

const subImages = ref([])
const isLoadingSub = ref(false)

const inatImages = ref([])
const isLoadingInat = ref(false)

const activeImages = computed(() => {
  if (twImages.value.length) return twImages.value
  if (subImages.value.length) return subImages.value
  return inatImages.value
})

const galleryIndex = ref(0)
const isViewerOpen = ref(false)
const currentImage = computed(() => activeImages.value[galleryIndex.value])

watch(activeImages, () => { galleryIndex.value = 0 })

const showCard = computed(() =>
  activeImages.value.length > 0 || isLoadingInat.value || isLoadingSub.value
)

// ── TaxonWorks loading ────────────────────────────────────────────────────────

// Given /depictions rows, return the Set of image ids to HIDE from an OTU-scoped
// gallery. An image counts as a data depiction (is_metadata_depiction — a label
// photo, a ledger page, …) if ANY of its depictions is flagged, regardless of
// what else the image is linked to. It's kept only when the flag sits on a
// depiction of the Otu itself; if the flag is only on a CollectionObject /
// FieldOccurrence, the image belongs in that specimen's modal, not here.
function dropIdsFromDepictions(rows) {
  const otuMeta = new Set() // image has a data depiction ON an Otu
  const foreignMeta = new Set() // image has a data depiction on a non-Otu object
  for (const d of rows || []) {
    if (!d.is_metadata_depiction) continue
    if (d.depiction_object_type === 'Otu') otuMeta.add(d.image_id)
    else foreignMeta.add(d.image_id)
  }
  return new Set([...foreignMeta].filter((id) => !otuMeta.has(id)))
}

// is_metadata_depiction isn't serialized by /otus/:id/inventory/images, so pull
// the depiction rows for this OTU scope separately to build the exclusion set.
async function fetchDataDepictionFilter() {
  try {
    const { data } = await makeAPIRequest.get('/depictions', {
      params: {
        'otu_id[]': [props.otuId],
        'otu_scope[]': ['all', 'coordinate_otus'],
        per: 500
      }
    })
    dataDepictionDropIds.value = dropIdsFromDepictions(data)
  } catch {
    // Leave the set empty — show everything, as before.
  }
}

onServerPrefetch(async () => {
  await store.loadImages(props.otuId, { sortOrder: props.sort_order })
})

onMounted(() => {
  if (!store.images) {
    store.loadImages(props.otuId, { sortOrder: props.sort_order })
  }
  // Client-only on purpose: dataDepictionDropIds isn't part of the SSR payload,
  // so filtering twImages during onServerPrefetch would make the server markup
  // (label photo removed) disagree with the first client render (Set still
  // empty) — a hydration mismatch + a flash. Running it here is a post-hydration
  // update, which Vue applies cleanly.
  fetchDataDepictionFilter()
})

onBeforeUnmount(() => {
  store.resetRequest()
  store.$reset()
})

// When TaxonWorks finishes loading with no direct images, try subordinate taxa
// first, then fall back to iNaturalist only if those are also empty.
watch(
  () => store.images,
  async (images) => {
    if (images !== null && images.length === 0) {
      await fetchSubordinateFallback()
      if (!subImages.value.length) {
        fetchInatFallback()
      }
    }
  },
  { immediate: true }
)

// ── Subordinate taxa fallback ─────────────────────────────────────────────────

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), ms)
    )
  ])
}

async function fetchSubordinateFallback() {
  if (!props.taxon?.id) return
  isLoadingSub.value = true
  try {
    const perPage = Math.ceil(props.subMaxImages / 2)
    const params = {
      'taxon_name_id[]': [props.taxon.id],
      per: perPage,
      extend: ['depictions', 'attribution', 'source', 'citations']
    }

    // Lightweight probe (per=1) to get total image count without fetching data.
    const probe = await withTimeout(
      makeAPIRequest.get('/images', {
        params: { 'taxon_name_id[]': [props.taxon.id], per: 1 }
      }),
      SUB_IMAGE_TIMEOUT_MS
    )
    const total = parseInt(probe.headers['pagination-total'] || '0', 10)
    if (!total) return

    const totalPages = Math.ceil(total / perPage)

    // Pick 2 distinct random pages (or 1 if only 1 page exists).
    const pageA = Math.floor(Math.random() * totalPages) + 1
    let pageB = pageA
    if (totalPages > 1) {
      while (pageB === pageA) pageB = Math.floor(Math.random() * totalPages) + 1
    }

    const pages = pageA === pageB ? [pageA] : [pageA, pageB]
    const results = await Promise.all(
      pages.map(page =>
        withTimeout(
          makeAPIRequest.get('/images', { params: { ...params, page } }),
          SUB_IMAGE_TIMEOUT_MS
        )
      )
    )

    const raw = results.flatMap(r => r.data || [])

    // Same rule as the direct gallery: drop images tied only to data depictions
    // (is_metadata_depiction) not on an Otu. /images doesn't return the flag, so
    // fetch the depiction rows for exactly these image ids.
    let drop = new Set()
    if (raw.length) {
      try {
        const { data } = await withTimeout(
          makeAPIRequest.get('/depictions', {
            params: { 'image_id[]': raw.map(i => i.id), per: 500 }
          }),
          SUB_IMAGE_TIMEOUT_MS
        )
        drop = dropIdsFromDepictions(data)
      } catch {
        // keep everything on failure
      }
    }

    subImages.value = raw
      .filter(i => !drop.has(i.id))
      .slice(0, props.subMaxImages)
      .map(normalizeImage)
  } catch {
    // fail silently
  } finally {
    isLoadingSub.value = false
  }
}

// ── iNaturalist fallback ──────────────────────────────────────────────────────

/**
 * Copied verbatim from PaneliNaturalist.vue.
 * Uses props.taxon.expanded_name directly — avoids otu.object_label which
 * may include authorship, breaking the exact-name match against iNat's t.name.
 */
function parseName(expandedName) {
  const subgenusMatch = expandedName.match(/^(\S+)\s+\((\S+)\)(?:\s+(\S+))?$/)
  if (subgenusMatch) {
    return {
      genus: subgenusMatch[1],
      subgenus: subgenusMatch[2],
      epithet: subgenusMatch[3] || null
    }
  }
  const parts = expandedName.trim().split(/\s+/)
  return {
    genus: parts[0],
    subgenus: null,
    epithet: parts[1] || null
  }
}

async function resolveInatTaxonId() {
  if (!props.taxon?.expanded_name) return null

  const { genus, subgenus, epithet } = parseName(props.taxon.expanded_name)

  if (subgenus && !epithet) {
    const { data } = await axios.get('https://api.inaturalist.org/v1/taxa', {
      params: { q: subgenus, rank: 'subgenus', per_page: 10, all_names: true }
    })
    const match = data.results.find((t) => {
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

  const plainName = subgenus && epithet
    ? `${genus} ${epithet}`
    : props.taxon.expanded_name

  const { data } = await axios.get('https://api.inaturalist.org/v1/taxa', {
    params: { q: plainName, rank: props.taxon.rank, per_page: 10 }
  })
  const match = data.results.find(
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

async function fetchInatFallback() {
  if (!props.taxon?.expanded_name) return

  isLoadingInat.value = true
  try {
    const taxonId = await resolveInatTaxonId()
    if (!taxonId) return

    // Curated taxon photos first
    const { data: taxonData } = await axios.get(
      `https://api.inaturalist.org/v1/taxa/${taxonId}`
    )
    const curatedImages = (taxonData.results?.[0]?.taxon_photos || [])
      .slice(0, INAT_MAX)
      .map(makeTaxonPhotoImage)

    const remaining = INAT_MAX - curatedImages.length
    let observationImages = []

    if (remaining > 0) {
      const { data: obsData } = await axios.get(
        'https://api.inaturalist.org/v1/observations',
        {
          params: {
            taxon_id: taxonId,
            quality_grade: 'research',
            per_page: remaining
          }
        }
      )
      observationImages = obsData.results
        .filter((obs) => obs.observation_photos?.[0])
        .map((obs) => makeObservationImage(obs, obs.observation_photos[0].photo))
    }

    inatImages.value = [...curatedImages, ...observationImages]
  } catch {
    // fail silently
  } finally {
    isLoadingInat.value = false
  }
}
</script>

<style scoped>
:deep(.w-24.h-20.cursor-pointer) {
  transition: opacity 150ms;
}
:deep(.w-24.h-20.cursor-pointer:hover) {
  opacity: 0.8;
}
</style>
