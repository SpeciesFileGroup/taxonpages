<template>
  <div class="flex flex-col gap-3">
    <template v-if="selected">
      <button
        type="button"
        class="self-start text-xs text-secondary hover:underline flex items-center gap-1 cursor-pointer"
        @click="selected = null"
      ><span aria-hidden="true">←</span> Back to species list</button>
      <SingleSpeciesOccurrences :otu-id="selected.otuId" :direct-only="!!selected.isOwnTaxon" />
    </template>

    <VCard v-else>
      <VCardHeader>Species</VCardHeader>
      <VCardContent>
        <VSpinner v-if="isLoadingList" />

        <template v-else-if="!allSpecies.length">
          <div class="text-sm opacity-50 py-4 px-2">No species found for this taxon.</div>
        </template>

        <template v-else>
          <!--
            Load more / checking-progress sits ABOVE the bars, not below —
            with a mega-genus like Otiorhynchus the list can run to dozens
            of screens, and re-finding a "Load more" button buried at the
            bottom of that on every click would be a real nuisance.
          -->
          <div class="flex items-center justify-between px-2 pb-2 text-xs opacity-50">
            <span>{{ checkedCount }} of {{ allSpecies.length }} species checked · {{ sortedResults.length }} with specimens</span>
          </div>

          <div v-if="isFetchingBatch" class="px-2 pb-2 text-xs opacity-50 animate-pulse">
            Checking species {{ checkedCount }} of {{ activeBatchEnd }}…
          </div>
          <div v-else-if="hasMore" class="px-2 pb-2">
            <VButton size="sm" variant="secondary" ghost @click="loadNextBatch">
              Load {{ nextBatchSize }} more ({{ allSpecies.length - loadedCount }} remaining)
            </VButton>
          </div>

          <div class="flex flex-col gap-0.5 px-2">
            <div
              v-for="sp in sortedResults"
              :key="sp.otuId"
              class="relative flex items-center gap-2 py-1 px-1.5 rounded cursor-pointer hover:bg-base-muted"
              @click="selected = sp"
            >
              <span
                class="absolute inset-y-0 left-0 bg-secondary/15 rounded"
                :style="{ width: `${(sp.count / maxCount) * 100}%` }"
              />
              <span class="relative italic text-sm flex-1 min-w-0 truncate">{{ sp.name }}</span>
              <span class="relative text-xs font-medium tabular-nums shrink-0">{{ sp.count }}</span>
            </div>
          </div>
        </template>
      </VCardContent>
    </VCard>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { makeAPIRequest } from '@/utils'
import SingleSpeciesOccurrences from './SingleSpeciesOccurrences.vue'

const props = defineProps({
  taxonId: {
    type: Number,
    required: true
  },

  // The page's own OTU — for a genus/subgenus page this OTU represents the
  // higher taxon itself, which can carry specimens determined only that far
  // (e.g. "Otiorhynchus sp.", never resolved to species). Excluded from the
  // species/subspecies descendant list below (rank-filtered on purpose), so
  // it's fetched separately as one extra row rather than silently dropped.
  otuId: {
    type: Number,
    required: true
  },

  taxon: {
    type: Object,
    default: () => ({})
  }
})

// Species/specimen counts aren't cheap to fetch at higher-taxon scale (see
// project memory — a mega-genus like Otiorhynchus has 1000+ valid species,
// and there's no batched/aggregate endpoint that stays fast past a few
// hundred explicit ids). So this fans out to the exact per-OTU dwc.json
// fetch the single-species view already uses, one request per species,
// through a small concurrency-limited queue — capped per batch, with a
// "Load more" to continue, rather than ever firing hundreds of requests at
// once.
const BATCH_SIZE = 150
const CONCURRENCY = 12

const isLoadingList = ref(false)
const allSpecies = ref([]) // [{ otuId, taxonNameId, name }], alphabetical
const loadedCount = ref(0) // how many of allSpecies have been through a batch
const checkedCount = ref(0) // resolved (success or fail) within the active batch
const isFetchingBatch = ref(false)
const results = ref([]) // [{ otuId, taxonNameId, name, count }] — only species with count > 0
const selected = ref(null)

const sortedResults = computed(() => [...results.value].sort((a, b) => b.count - a.count))
const maxCount = computed(() => Math.max(...results.value.map((r) => r.count), 1))
const hasMore = computed(() => loadedCount.value < allSpecies.value.length)
// Absolute index the active/next batch runs up to — checkedCount (also
// absolute, see loadNextBatch) is compared against this directly in the
// template, so both must share the same basis.
const activeBatchEnd = computed(() => Math.min(loadedCount.value + BATCH_SIZE, allSpecies.value.length))
const nextBatchSize = computed(() => Math.min(BATCH_SIZE, allSpecies.value.length - loadedCount.value))

// Fetches every page of a paginated index endpoint — otus.json and
// taxon_names.json both stay fast (~1-2s) even at thousands of rows for a
// plain descendant listing (unlike dwc_occurrences.json/collection_objects
// with a taxon join, which do not — see project memory), so pulling the
// full list up front is safe.
async function fetchAllPages(url, params) {
  const per = 500
  const first = await makeAPIRequest.get(url, { params: { ...params, per, page: 1 } })
  const totalPages = Number(first.headers['pagination-total-pages']) || 1
  const pages = [first.data]
  if (totalPages > 1) {
    const rest = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) =>
        makeAPIRequest.get(url, { params: { ...params, per, page: i + 2 } })
      )
    )
    pages.push(...rest.map((r) => r.data))
  }
  return pages.flat()
}

// otus.json?descendants=true returns OTUs at every rank in the subtree
// (including the higher taxon's own placeholder OTU) — only species/
// subspecies-rank, currently-valid names should become bars. Synonyms are
// excluded: their determinations already resolve to the valid name's OTU,
// so a synonym's own OTU (if one even exists) would only ever double-count
// or return nothing.
async function loadDescendantSpecies() {
  isLoadingList.value = true
  try {
    const [names, otus] = await Promise.all([
      fetchAllPages('/taxon_names.json', { 'taxon_name_id[]': props.taxonId, descendants: true }),
      fetchAllPages('/otus.json', { 'taxon_name_id[]': props.taxonId, descendants: true })
    ])

    const validSpeciesNames = new Map(
      names
        .filter((n) => (n.rank_string || '').includes('Species') && n.cached_is_valid)
        .map((n) => [n.id, n.cached])
    )

    allSpecies.value = otus
      .filter((o) => o.taxon_name_id && validSpeciesNames.has(o.taxon_name_id))
      .map((o) => ({ otuId: o.id, taxonNameId: o.taxon_name_id, name: validSpeciesNames.get(o.taxon_name_id) }))
      .sort((a, b) => a.name.localeCompare(b.name))
  } finally {
    isLoadingList.value = false
  }

  loadNextBatch()
}

async function fetchSpeciesCount(sp) {
  const { data } = await makeAPIRequest.get(`/otus/${sp.otuId}/inventory/dwc.json`)
  return data.filter(
    (d) =>
      d.dwc_occurrence_object_type === 'CollectionObject' ||
      d.dwc_occurrence_object_type === 'FieldOccurrence'
  ).length
}

// A small worker pool rather than Promise.all(batch.map(...)) — that would
// fire the whole batch (up to BATCH_SIZE) at once, and results streams in
// (pushed as each request resolves, not awaited as a group) so bars pop in
// progressively instead of appearing all at once when the batch finishes.
async function loadNextBatch() {
  const start = loadedCount.value
  const end = Math.min(start + BATCH_SIZE, allSpecies.value.length)
  const batch = allSpecies.value.slice(start, end)
  if (!batch.length) return

  isFetchingBatch.value = true
  checkedCount.value = start

  let cursor = 0
  async function worker() {
    while (cursor < batch.length) {
      const sp = batch[cursor++]
      try {
        const count = await fetchSpeciesCount(sp)
        if (count > 0) results.value.push({ ...sp, count })
      } catch {
        // one species failing to load shouldn't block the rest of the batch
      } finally {
        checkedCount.value++
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, batch.length) }, worker))
  loadedCount.value = end
  isFetchingBatch.value = false
}

// Fetched immediately, outside the batch queue — it's a single extra
// request (not part of the potentially-thousands-large descendant list),
// so it doesn't need to wait behind the alphabetical batching below.
//
// /otus/:id/inventory/dwc.json for a genus/subgenus OTU returns its ENTIRE
// descendant subtree (TaxonWorks' scoped_by_otu passes descendants: false,
// which despite its own "include self" comment actually means "self AND
// descendants" — see SingleSpeciesOccurrences.vue's directOnly prop doc),
// identical to what every species bar already fetches. specificEpithet is
// the reliable signal for "was this determined only to genus/subgenus
// rank" — filtering on it recovers the count this row's label promises,
// and `isOwnTaxon` tells the template to apply the same filter on expand.
async function loadOwnTaxonSpecimens() {
  try {
    const { data } = await makeAPIRequest.get(`/otus/${props.otuId}/inventory/dwc.json`)
    const count = data.filter(
      (d) =>
        (d.dwc_occurrence_object_type === 'CollectionObject' ||
          d.dwc_occurrence_object_type === 'FieldOccurrence') &&
        !d.specificEpithet
    ).length
    if (count > 0) {
      results.value.push({
        otuId: props.otuId,
        taxonNameId: props.taxonId,
        name: `${props.taxon?.cached || props.taxon?.name || 'This taxon'} (not identified to species)`,
        count,
        isOwnTaxon: true
      })
    }
  } catch {}
}

onMounted(() => {
  loadOwnTaxonSpecimens()
  loadDescendantSpecies()
})
</script>
