<template>
  <VCard>
    <ClientOnly>
      <VSpinner v-if="isLoading" />
    </ClientOnly>

    <div
      v-if="!isLoading && taxonId === null"
      class="text-xl text-center my-8 w-full"
    >
      No iNaturalist taxon found.
    </div>

    <!-- Upper section: curated taxon photos from /taxa/:id -->
    <template v-if="taxonPhotoImages.length">
      <VCardHeader class="flex items-center gap-3">
        <img
          :src="inatMark"
          alt="iNaturalist"
          class="h-8 w-auto shrink-0"
        />
        <a
          :href="`https://www.inaturalist.org/taxa/${taxonId}`"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:underline grow"
        >
          Curated taxon photos
        </a>
      </VCardHeader>
      <VCardContent>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(400px,1fr))] gap-3">
          <div
            v-for="(image, index) in taxonPhotoImages"
            :key="image.id"
          >
            <div
              class="aspect-[3/2] overflow-hidden rounded cursor-pointer hover:opacity-80 transition"
              @click="openTaxonPhotoViewer(index)"
            >
              <img
                class="w-full h-full object-cover"
                :src="image.thumb"
                :alt="image.attribution.label"
                :title="image.attribution.label"
              />
            </div>
          </div>
        </div>
      </VCardContent>
    </template>

    <!-- Lower section: paginated research-grade observations -->
    <VCardHeader class="flex items-center gap-3">
      <img
        :src="inatMark"
        alt="iNaturalist"
        class="h-8 w-auto shrink-0"
      />
      <a
        v-if="taxonId"
        :href="`https://www.inaturalist.org/observations?taxon_id=${taxonId}&quality_grade=research`"
        target="_blank"
        rel="noopener noreferrer"
        class="hover:underline grow"
      >
        Research-grade observations
      </a>
      <template v-else>
        <span class="grow">Research-grade observations</span>
      </template>
    </VCardHeader>
    <VCardContent class="min-h-[6rem]">
      <div
        v-if="!isLoading && taxonId !== null && !observations.length"
        class="text-xl text-center my-8 w-full"
      >
        No records found.
      </div>

      <div class="grid grid-cols-[repeat(auto-fill,minmax(400px,1fr))] gap-3">
        <div
          v-for="observation in observations"
          :key="observation.id"
        >
          <a
            v-if="observation?.observation_photos[0]"
            :href="`https://www.inaturalist.org/observations/${observation.id}`"
            class="block hover:opacity-80 transition"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div class="aspect-[3/2] overflow-hidden rounded">
              <img
                class="w-full h-full object-cover"
                :src="observation.observation_photos[0].photo.url.replace('square', 'medium')"
              />
            </div>
          </a>
        </div>
      </div>

      <VPagination
        v-if="observations.length"
        class="mt-4"
        v-model="pagination.page"
        :total="pagination.total_results"
        :per="pagination.per_page"
        @update:modelValue="
          (value) => {
            loadObservations({ page: value, per_page: perPage })
          }
        "
      />
    </VCardContent>

    <!-- Shared lightbox for curated taxon photos -->
    <ImageLightbox
      v-if="taxonPhotoViewer.open"
      :index="taxonPhotoViewer.index"
      :images="taxonPhotoImages"
      :next="taxonPhotoViewer.index < taxonPhotoImages.length - 1"
      :previous="taxonPhotoViewer.index > 0"
      @select-index="taxonPhotoViewer.index = $event"
      @next="taxonPhotoViewer.index++"
      @previous="taxonPhotoViewer.index--"
      @close="taxonPhotoViewer.open = false"
    />
  </VCard>
</template>

<script setup>
/**
 * PaneliNaturalist.vue
 *
 * Two sections:
 *
 * UPPER — Curated taxon photos (/v1/taxa/:id)
 * --------------------------------------------
 * Shows the curated representative photos that iNaturalist editors select
 * for the taxon overview page. Fetched from the taxon_photos array.
 * Clicking a photo opens the shared ImageLightbox (panels/_shared/,
 * used by every panel) showing the full-size image with attribution
 * and a link to the photo page on iNaturalist.
 *
 * LOWER — Research-grade observations (/v1/observations)
 * -------------------------------------------------------
 * Paginated grid of research-grade observation photos. The section header
 * links to all research-grade observations on iNaturalist.
 *
 * WHY taxon_id INSTEAD OF taxon_name
 * ------------------------------------
 * The iNaturalist observations API accepts either a taxon_name (fuzzy text
 * search) or a taxon_id (exact match). Using taxon_name is unreliable because:
 *   - It can match the parent genus instead of a subgenus
 *   - It can match unrelated taxa with similar names
 *
 * Instead, we first resolve the TaxonWorks name to an exact iNaturalist
 * taxon_id via the iNat /v1/taxa endpoint, then use that ID for both queries.
 *
 * RANK COMPATIBILITY
 * -------------------
 * TaxonWorks and iNaturalist use the same rank name strings (e.g. "subfamily",
 * "tribe", "genus", "species"), so props.taxon.rank can be passed directly to
 * the iNat taxa search for most ranks.
 *
 * WHY SUBGENERA NEED SPECIAL HANDLING
 * -------------------------------------
 * TaxonWorks stores subgenera explicitly, e.g. "Otiorhynchus (Nihus)".
 * iNaturalist also has subgenera, but not all of them — so we attempt a
 * lookup and show nothing if the subgenus is not found on iNat, rather than
 * silently falling back to showing the whole genus.
 */

import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'
import inatMark from './inat-mark.svg'
import ImageLightbox from '../_shared/ImageLightbox.vue'

const props = defineProps({
  taxon: {
    type: Object,
    required: true
  },

  perPage: {
    type: Number,
    default: 12
  },

  parameters: {
    type: Object,
    default: () => {}
  }
})

const isLoading = ref(false)
const observations = ref([])
const taxonPhotoImages = ref([])

/**
 * taxonId states:
 *   undefined = not yet looked up (initial state)
 *   null      = lookup done but taxon not found on iNaturalist
 *   number    = valid iNaturalist taxon ID
 */
const taxonId = ref(undefined)

const pagination = ref({
  page: 1,
  per_page: props.perPage,
  total_results: 0
})

// ImageLightbox state for curated taxon photos
const taxonPhotoViewer = reactive({
  open: false,
  index: 0
})

function openTaxonPhotoViewer(index) {
  taxonPhotoViewer.index = index
  taxonPhotoViewer.open = true
}

/**
 * Converts a raw iNaturalist taxon_photo entry into the image object shape
 * expected by the shared ImageLightbox:
 *   { id, thumb, original, attribution: { label }, source: { label }, depictions: [] }
 *
 * Since taxon photos are not linked to a specific observation, the source
 * points to the photo page on iNaturalist (inaturalist.org/photos/:id).
 */
function makeTaxonPhotoImage(taxonPhoto) {
  const photo = taxonPhoto.photo
  const photoUrl = `https://www.inaturalist.org/photos/${photo.id}`
  const taxonName = taxonPhoto.taxon?.name || ''
  return {
    id: photo.id,
    thumb: photo.medium_url || photo.url.replace('square', 'medium'),
    original: photo.original_url || photo.large_url || photo.url.replace('square', 'original'),
    attribution: { label: photo.attribution || '' },
    source: {
      label: `<a href="${photoUrl}" target="_blank" rel="noopener noreferrer" class="text-secondary hover:underline">${photoUrl}</a>`
    },
    depictions: taxonName ? [{ label: taxonName }] : []
  }
}

/**
 * Parses a TaxonWorks expanded_name into its components.
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

/**
 * Resolves the TaxonWorks taxon name to an iNaturalist taxon ID.
 * Returns the iNat taxon ID (number), or null if not found.
 */
async function resolveInatTaxonId() {
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

  const plainName = subgenus && epithet ? `${genus} ${epithet}` : props.taxon.expanded_name

  const { data } = await axios.get('https://api.inaturalist.org/v1/taxa', {
    params: { q: plainName, rank: props.taxon.rank, per_page: 10 }
  })

  const match = data.results.find(
    (t) => t.name.toLowerCase() === plainName.toLowerCase()
  )
  return match ? match.id : null
}

/**
 * Fetches the curated taxon photos from /v1/taxa/:id and converts them
 * into ImageLightbox-compatible image objects.
 */
async function loadTaxonPhotos() {
  if (!taxonId.value) return

  try {
    const { data } = await axios.get(
      `https://api.inaturalist.org/v1/taxa/${taxonId.value}`
    )
    const photos = data.results?.[0]?.taxon_photos || []
    taxonPhotoImages.value = photos.map(makeTaxonPhotoImage)
  } catch (e) {
    // fail silently
  }
}

/**
 * Fetches research-grade observations from iNaturalist using the resolved taxon_id.
 * Called on mount and again on pagination changes.
 */
async function loadObservations(params = {}) {
  isLoading.value = true

  try {
    if (taxonId.value === undefined) {
      taxonId.value = await resolveInatTaxonId()
    }

    if (taxonId.value === null) return

    // Load taxon photos and observations in parallel on first load
    const [, obsData] = await Promise.all([
      taxonPhotoImages.value.length ? Promise.resolve() : loadTaxonPhotos(),
      axios.get('https://api.inaturalist.org/v1/observations', {
        params: {
          taxon_id: taxonId.value,
          quality_grade: 'research',
          ...params,
          ...props.parameters
        }
      })
    ])

    observations.value = obsData.data.results
    pagination.value = {
      page: obsData.data.page,
      per_page: obsData.data.per_page,
      total_results: obsData.data.total_results
    }
  } catch (e) {
    // Network or API errors fail silently
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadObservations({ per_page: props.perPage })
})
</script>
