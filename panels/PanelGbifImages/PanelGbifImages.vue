<template>
  <VCard v-if="images.length">
    <VCardHeader class="flex items-center gap-3">
      <img
        :src="gbifMark"
        alt="GBIF"
        class="h-8 w-auto shrink-0"
      />
      <h2 class="text-md grow">Images</h2>
      <PanelDropdown
        panel-key="panel:gbif-images"
        :menu-options="gbifMenuOptions"
      />
    </VCardHeader>
    <div
      class="relative w-full h-80 overflow-hidden bg-base-muted"
    >
      <img
        :key="currentImage.identifier"
        :src="currentImage.identifier"
        :alt="`Occurrence ${currentImage.occurrenceKey}`"
        class="absolute inset-0 w-full h-full object-contain transition-opacity duration-150"
        :class="imageLoading || imageError ? 'opacity-0' : 'opacity-100'"
        loading="lazy"
        @load="onImageLoad"
        @error="onImageError"
      />

      <div
        v-if="imageLoading"
        class="absolute inset-0 flex items-center justify-center"
      >
        <VSpinner
          logo-class="w-6 h-6"
          legend=""
        />
      </div>

      <p
        v-if="imageError"
        class="absolute inset-0 flex items-center justify-center text-xs opacity-70"
      >
        Image failed to load
      </p>

      <button
        v-if="images.length > 1"
        type="button"
        @click="prevImage"
        aria-label="Previous image"
        class="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-base-background/80 border border-base-border shadow hover:bg-base-foreground"
      >
        ‹
      </button>
      <button
        v-if="images.length > 1"
        type="button"
        @click="nextImage"
        aria-label="Next image"
        class="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-base-background/80 border border-base-border shadow hover:bg-base-foreground"
      >
        ›
      </button>

      <a
        :href="currentImageOccurrenceUrl"
        target="_blank"
        rel="noopener"
        class="absolute bottom-2 right-2 px-2 py-1 text-xs rounded bg-base-background/80 border border-base-border shadow hover:bg-base-foreground"
      >
        See details on GBIF.org
      </a>
    </div>

    <p
      class="px-5 py-2 text-xs opacity-70 flex justify-between gap-2 rounded-b"
    >
      <span class="truncate">
        {{ currentImage.rightsHolder || 'Unknown rights holder' }}
        <template v-if="currentImageLicense">
          <span class="opacity-60 mx-1">·</span>
          <a
            :href="currentImageLicense.url"
            target="_blank"
            rel="noopener"
            class="underline"
          >
            {{ currentImageLicense.label }}
          </a>
        </template>
      </span>
      <span class="shrink-0">
        {{ imageIndex + 1 }} / {{ images.length }}
        <a
          :href="galleryUrl"
          target="_blank"
          rel="noopener"
          class="ml-1 underline"
        >
          all
        </a>
      </span>
    </p>
  </VCard>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
  useGbifMatch,
  deriveScientificName,
  recordRequest,
  gbifMenuOptions,
  CHECKLIST_KEY,
  GBIF_OCCURRENCE_BASE,
  GBIF_OCCURRENCE_DETAIL
} from '../_gbifShared/useGbifMatch'
import gbifMark from '../_gbifShared/gbif-mark.svg'
import PanelDropdown from '@/modules/otus/components/Panel/PanelDropdown.vue'
import { useOtuPageRequestStore } from '@/modules/otus/store/request'

const GBIF_MULTIMEDIA_BASE =
  'https://api.gbif.org/v1/occurrence/experimental/multimedia/species'
const IMAGE_LIMIT = 20
const IMAGE_RANKS = new Set([
  'FAMILY',
  'SUBFAMILY',
  'INFRAFAMILY',
  'SUPERTRIBE',
  'TRIBE',
  'SUBTRIBE',
  'INFRATRIBE',
  'SUPERGENUS',
  'GENUS',
  'SUBGENUS',
  'INFRAGENUS',
  'SECTION',
  'SUBSECTION',
  'SERIES',
  'SUBSERIES',
  'SPECIES_AGGREGATE',
  'SPECIES',
  'SUBSPECIES',
  'INFRASUBSPECIFIC_NAME',
  'VARIETY',
  'SUBVARIETY',
  'FORM',
  'SUBFORM',
  'CULTIVAR',
  'CULTIVAR_GROUP',
  'CONVARIETY',
  'GREX',
  'STRAIN',
  'PATHOVAR',
  'BIOVAR',
  'CHEMOVAR',
  'MORPHOVAR',
  'PHAGOVAR',
  'SEROVAR',
  'FORMA_SPECIALIS',
  'ABERRATION',
  'RACE',
  'NATIO',
  'PROLES'
])

const props = defineProps({
  otuId: { type: [Number, String], required: true },
  taxonId: { type: [Number, String], required: true },
  taxon: { type: Object, default: undefined },
  otu: { type: Object, default: undefined }
})

const scientificName = computed(() => deriveScientificName(props.taxon, props.otu))
const { targetUsage, gbifKey } = useGbifMatch(scientificName)

const images = ref([])
const imageIndex = ref(0)
const imageLoading = ref(false)
const imageError = ref(false)

const shouldFetchImages = computed(() => {
  const rank = targetUsage.value?.rank
  return rank ? IMAGE_RANKS.has(rank) : false
})

const currentImage = computed(() => images.value[imageIndex.value])

const currentImageOccurrenceUrl = computed(() =>
  currentImage.value?.occurrenceKey
    ? `${GBIF_OCCURRENCE_DETAIL}/${currentImage.value.occurrenceKey}`
    : '#'
)

const currentImageLicense = computed(() =>
  formatLicense(currentImage.value?.license)
)

const galleryUrl = computed(
  () => `${GBIF_OCCURRENCE_BASE}?taxonKey=${gbifKey.value}&view=gallery`
)

function formatLicense(url) {
  if (!url) return null

  const cc = url.match(/creativecommons\.org\/licenses\/([a-z-]+)\/([0-9.]+)/i)
  if (cc) return { label: `CC ${cc[1].toUpperCase()} ${cc[2]}`, url }

  const cc0 = url.match(/creativecommons\.org\/publicdomain\/zero\/([0-9.]+)/i)
  if (cc0) return { label: `CC0 ${cc0[1]}`, url }

  const pdm = url.match(/creativecommons\.org\/publicdomain\/mark\/([0-9.]+)/i)
  if (pdm) return { label: `Public Domain ${pdm[1]}`, url }

  return { label: url.replace(/^https?:\/\//, ''), url }
}

const requestStore = useOtuPageRequestStore()

async function fetchImages(taxonKey) {
  images.value = []
  imageIndex.value = 0

  const url = new URL(`${GBIF_MULTIMEDIA_BASE}/${CHECKLIST_KEY}/${taxonKey}`)
  url.searchParams.set('mediaType', 'stillImage')
  url.searchParams.set('limit', String(IMAGE_LIMIT))
  url.searchParams.set('offset', '0')
  const requestUrl = url.toString()

  try {
    const res = await fetch(requestUrl)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const data = await res.json()
    images.value = (data?.results || []).filter((item) => item.identifier)
    recordRequest(requestStore, 'panel:gbif-images', { url: requestUrl, data })
  } catch (e) {
    images.value = []
    recordRequest(requestStore, 'panel:gbif-images', { url: requestUrl, data: null })
  }
}

function prevImage() {
  if (!images.value.length) return
  imageIndex.value =
    (imageIndex.value - 1 + images.value.length) % images.value.length
}

function nextImage() {
  if (!images.value.length) return
  imageIndex.value = (imageIndex.value + 1) % images.value.length
}

function onImageLoad() {
  imageLoading.value = false
  imageError.value = false
}

function onImageError() {
  imageLoading.value = false
  imageError.value = true
}

watch(
  [gbifKey, shouldFetchImages],
  ([key, eligible]) => {
    if (key && eligible) {
      fetchImages(key)
    } else {
      images.value = []
      imageIndex.value = 0
    }
  },
  { immediate: true }
)

watch(
  () => currentImage.value?.identifier,
  (val) => {
    if (val) {
      imageLoading.value = true
      imageError.value = false
    }
  },
  { immediate: true }
)
</script>
