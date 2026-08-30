<template>
  <VCard>
    <VCardHeader class="flex items-center gap-3">
      <img
        :src="gbifMark"
        alt="GBIF"
        class="h-8 w-auto shrink-0"
      />
      <h2 class="text-md grow">This taxon in GBIF</h2>
      <PanelDropdown
        panel-key="panel:gbif-taxon"
        :menu-options="gbifMenuOptions"
      />
    </VCardHeader>
    <VCardContent class="text-sm">
      <VSpinner
        v-if="loading"
        logo-class="w-6 h-6"
        legend=""
      />

      <p
        v-else-if="error"
        class="opacity-60"
      >
        Could not load GBIF match.
      </p>

      <p
        v-else-if="!match"
        class="opacity-60"
      >
        No confident match could be found on GBIF for
        <em>{{ scientificName }}</em
        >.
      </p>

      <div
        v-else
        class="space-y-2"
      >
        <p
          class="text-base"
          v-html="targetUsage.formattedName"
        />

        <p
          v-if="isSynonym"
          class="text-xs opacity-70"
        >
          Synonym:
          <span v-html="match.usage.formattedName" />
        </p>

        <ol
          v-if="classification.length"
          class="flex flex-wrap gap-x-1 text-xs opacity-80"
        >
          <li
            v-for="rank in classification"
            :key="rank.key"
            class="after:content-['›'] after:ml-1 last:after:content-['']"
          >
            <span class="uppercase opacity-60 mr-1">{{ rank.rank }}</span>
            {{ rank.name }}
          </li>
        </ol>

        <p class="text-xs opacity-80">
          <span v-if="occurrenceCount === null">Loading occurrences…</span>
          <span v-else-if="occurrenceCount === undefined">
            Occurrence count unavailable.
          </span>
          <span v-else>
            <a
              :href="occurrenceUrl"
              target="_blank"
              rel="noopener"
              class="text-primary-color underline"
            >
              <strong>{{ formattedOccurrenceCount }}</strong> occurrence{{
                occurrenceCount === 1 ? '' : 's'
              }}
            </a>
            in GBIF
          </span>
        </p>

        <p class="flex justify-end">
          <a
            :href="gbifUrl"
            target="_blank"
            rel="noopener"
            class="inline-block px-3 py-1.5 rounded text-white text-xs font-medium hover:brightness-95"
            :style="{ background: 'var(--pp-gbif)' }"
          >
            View on GBIF.org
          </a>
        </p>
      </div>
    </VCardContent>
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
  GBIF_TAXON_BASE,
  GBIF_OCCURRENCE_BASE
} from '../_gbifShared/useGbifMatch'
import gbifMark from '../_gbifShared/gbif-mark.svg'
import '../_gbifShared/gbif-tokens.css'
import PanelDropdown from '@/modules/otus/components/Panel/PanelDropdown.vue'
import { useOtuPageRequestStore } from '@/modules/otus/store/request'

const GBIF_OCCURRENCE_SEARCH = 'https://api.gbif.org/v1/occurrence/search'

const props = defineProps({
  otuId: { type: [Number, String], required: true },
  taxonId: { type: [Number, String], required: true },
  taxon: { type: Object, default: undefined },
  otu: { type: Object, default: undefined }
})

const scientificName = computed(() => deriveScientificName(props.taxon, props.otu))
const {
  loading,
  error,
  match,
  rawMatch,
  matchUrl,
  isSynonym,
  targetUsage,
  gbifKey,
  classification
} = useGbifMatch(scientificName)

const requestStore = useOtuPageRequestStore()

watch([matchUrl, rawMatch], ([url, data]) => {
  if (url) recordRequest(requestStore, 'panel:gbif-taxon', { url, data })
})

const occurrenceCount = ref(null)

const gbifUrl = computed(() => `${GBIF_TAXON_BASE}/${gbifKey.value}`)
const occurrenceUrl = computed(
  () => `${GBIF_OCCURRENCE_BASE}?taxonKey=${gbifKey.value}`
)
const formattedOccurrenceCount = computed(() =>
  typeof occurrenceCount.value === 'number'
    ? occurrenceCount.value.toLocaleString()
    : ''
)

async function fetchOccurrenceCount(taxonKey) {
  occurrenceCount.value = null

  try {
    const url = new URL(GBIF_OCCURRENCE_SEARCH)
    url.searchParams.set('taxonKey', taxonKey)
    url.searchParams.set('checklistKey', CHECKLIST_KEY)
    url.searchParams.set('limit', '0')

    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const data = await res.json()
    occurrenceCount.value =
      typeof data?.count === 'number' ? data.count : undefined
  } catch (e) {
    occurrenceCount.value = undefined
  }
}

watch(
  gbifKey,
  (key) => {
    if (key) fetchOccurrenceCount(key)
    else occurrenceCount.value = null
  },
  { immediate: true }
)
</script>
