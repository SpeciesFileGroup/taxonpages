<template>
  <div class="flex flex-col gap-3">
    <template v-if="selected">
      <button
        type="button"
        class="self-start text-xs text-secondary hover:underline flex items-center gap-1 cursor-pointer"
        @click="selected = null"
      ><span aria-hidden="true">←</span> Back to species list</button>
      <RouterLink
        :to="{ name: 'otus-id', params: { id: selected.otuId } }"
        class="text-base font-medium hover:text-secondary hover:underline w-fit"
      ><span v-html="selected.fullNameHtml || selected.name" /></RouterLink>
      <SingleSpeciesOccurrences
        :otu-id="selected.otuId"
        :direct-only="!!selected.isOwnTaxon"
        :preloaded-data="selected.otuId === props.otuId ? genusRawData : null"
      />
    </template>

    <VCard v-else>
      <VCardHeader>Specimen &amp; field occurrences per species</VCardHeader>
      <VCardContent>
        <!--
          The genus/subgenus grand total — its own fetch (loadOwnTaxonSpecimens)
          runs fully independently of the species-list fetch below (which
          gates everything else in this card behind isLoadingList/VSpinner),
          so it's rendered unconditionally here rather than nested inside
          that gate. Nested, this row's appearance timing depended on which
          of the two unrelated fetches happened to finish first: for a small
          taxon the grand total could finish WHILE the spinner was still up,
          so it'd appear instantly, fully loaded, the moment the spinner
          cleared — for a mega-genus (its fetch is much slower, see below)
          the spinner clears first and this pops in later — inconsistent
          either way. Decoupled, it always follows its own timeline: nothing
          → "Computing…" → the row, regardless of species-list progress.

          Pinned above the sortable per-species list (not mixed into it, and
          not scaled against maxCount like the bars below) since it isn't
          "one species among many," it's the reference whole they're all
          parts of. Labeled "Otiorhynchus: all" specifically to not be
          confused with the narrower "(not identified to species)" row in
          the list below — see loadOwnTaxonSpecimens for how the two counts
          are told apart.
        -->
        <div v-if="allTotal" class="mb-2 border-b border-base-muted">
          <div
            class="relative flex items-center gap-2 py-1 px-1.5 rounded cursor-pointer hover:bg-base-muted"
            @click="selected = allTotal"
          >
            <span class="absolute inset-y-0 left-0 right-0 bg-secondary/15 rounded" />
            <span class="relative text-sm font-medium flex-1 min-w-0 truncate">{{ allTotal.name }}</span>
            <span class="relative text-xs font-medium tabular-nums shrink-0">{{ allTotal.count }}</span>
          </div>
          <div class="px-1.5 pb-1.5 text-[11px] opacity-50">
            Total specimen &amp; occurrence records across the whole taxon, fetched in one query directly from the
            genus/subgenus's own record — not summed from the per-species list below, so it doesn't wait on that
            list to finish (and won't match its running total until every species there has been checked).
          </div>
        </div>
        <!--
          This fetch can take a while on a mega-genus — the TaxonWorks
          endpoint it needs doesn't stay fast at that scale (see
          loadOwnTaxonSpecimens) and there's no way around paying for it
          once — so this placeholder is the only thing that would otherwise
          look like nothing is happening.
        -->
        <div v-else-if="isLoadingOwnTaxon" class="pb-2 text-xs opacity-50 animate-pulse border-b border-base-muted">
          Fetching the total specimen count for the whole taxon (a single query, separate from the per-species
          check below)…
        </div>

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
          <div class="px-2 pb-2 text-xs opacity-50">
            Looked up specimen &amp; occurrence records one species at a time for {{ checkedCount }} of
            {{ allSpecies.length }} species so far — {{ sortedResults.length }} of those have at least one record on
            file (shown below as bars, sorted by count).
          </div>

          <div v-if="isFetchingBatch || isLoadingAll" class="px-2 pb-2 text-xs opacity-50 animate-pulse">
            Fetching records for species {{ checkedCount }} of {{ isLoadingAll ? allSpecies.length : activeBatchEnd }},
            one request per species…
          </div>
          <div v-else-if="hasMore" class="px-2 pb-2 flex items-center gap-2">
            <VButton size="sm" variant="secondary" ghost @click="loadNextBatch">
              Load {{ nextBatchSize }} more ({{ allSpecies.length - loadedCount }} remaining)
            </VButton>
            <VButton size="sm" variant="secondary" ghost @click="loadAllRemaining">
              Load all
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

function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

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
const isLoadingAll = ref(false) // true while loadAllRemaining is chaining batches
const results = ref([]) // [{ otuId, taxonNameId, name, count }] — only species with count > 0
const allTotal = ref(null) // { otuId, name, count } — the genus/subgenus grand total, see loadOwnTaxonSpecimens
const isLoadingOwnTaxon = ref(false)
const genusRawData = ref(null) // raw dwc.json rows for props.otuId, cached so expanding "all"/"not identified" doesn't re-fetch them
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
// (including the higher taxon's own placeholder OTU) — only currently-
// valid names at EXACT rank "species" should become bars. Not subspecies
// too, despite the rank_string convention grouping them under the same
// "SpeciesGroup" umbrella (e.g. "...::SpeciesGroup::Subspecies") — a
// species-rank OTU's own fetch already includes its subspecies' specimens
// (same "self AND descendants" semantics as the genus-level bug above, one
// level down), so also listing subspecies as their own bars double-counts
// those specimens. Synonyms are excluded too: their determinations already
// resolve to the valid name's OTU, so a synonym's own OTU (if one even
// exists) would only ever double-count or return nothing.
async function loadDescendantSpecies() {
  isLoadingList.value = true
  try {
    const [names, otus] = await Promise.all([
      fetchAllPages('/taxon_names.json', { 'taxon_name_id[]': props.taxonId, descendants: true }),
      fetchAllPages('/otus.json', { 'taxon_name_id[]': props.taxonId, descendants: true })
    ])

    const validSpeciesNames = new Map(
      names
        .filter((n) => n.rank === 'species' && n.cached_is_valid)
        .map((n) => [
          n.id,
          {
            name: n.cached,
            // cached omits authorship (e.g. "Otiorhynchus (Nihus)
            // carinatopunctatus") — the expanded specimen list's header
            // wants the full name, so keep the italicized HTML TaxonWorks
            // already provides plus the author/year it caches separately.
            fullNameHtml: `${n.cached_html || escHtml(n.cached)}${n.cached_author_year ? ' ' + escHtml(n.cached_author_year) : ''}`
          }
        ])
    )

    allSpecies.value = otus
      .filter((o) => o.taxon_name_id && validSpeciesNames.has(o.taxon_name_id))
      .map((o) => {
        const { name, fullNameHtml } = validSpeciesNames.get(o.taxon_name_id)
        return { otuId: o.id, taxonNameId: o.taxon_name_id, name, fullNameHtml }
      })
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

// Chains batches back-to-back rather than firing one huge batch — still
// goes through the same CONCURRENCY-limited queue per chunk, just without
// waiting for a click between them. isLoadingAll keeps the progress row
// showing continuously across the brief gap between chained batches
// (loadNextBatch toggles isFetchingBatch off then straight back on), so
// the "Load more"/"Load all" buttons don't flash back in for a frame.
async function loadAllRemaining() {
  isLoadingAll.value = true
  try {
    while (hasMore.value) {
      await loadNextBatch()
    }
  } finally {
    isLoadingAll.value = false
  }
}

// Fetched immediately, outside the batch queue — it's a single extra
// request (not part of the potentially-thousands-large descendant list),
// so it doesn't need to wait behind the alphabetical batching below.
//
// /otus/:id/inventory/dwc.json for a genus/subgenus OTU returns its ENTIRE
// descendant subtree (TaxonWorks' scoped_by_otu passes descendants: false,
// which despite its own "include self" comment actually means "self AND
// descendants" — see SingleSpeciesOccurrences.vue's directOnly prop doc) —
// the same one response gives BOTH the genus-wide grand total (allTotal,
// unfiltered — instantly accurate regardless of batch progress, since it's
// not summed from the per-species fetches below) AND, filtered to records
// with no specificEpithet, the count actually determined only that far
// ("not identified to species"). Labeled distinctly ("Otiorhynchus: all"
// vs "Otiorhynchus (not identified to species)") so the two aren't
// conflated the way the unfiltered fetch alone was before this fix.
async function loadOwnTaxonSpecimens() {
  isLoadingOwnTaxon.value = true
  try {
    const { data } = await makeAPIRequest.get(`/otus/${props.otuId}/inventory/dwc.json`)
    // Cached so clicking either "…: all" or "…(not identified to species)"
    // can hand this straight to SingleSpeciesOccurrences instead of making
    // it repeat the same genus-wide fetch it just watched happen.
    genusRawData.value = data
    const occurrences = data.filter(
      (d) => d.dwc_occurrence_object_type === 'CollectionObject' || d.dwc_occurrence_object_type === 'FieldOccurrence'
    )
    const name = props.taxon?.cached || props.taxon?.name || 'This taxon'
    const nameHtml = props.taxon?.cached_html || escHtml(name)
    const authorYear = props.taxon?.cached_author_year ? ' ' + escHtml(props.taxon.cached_author_year) : ''

    if (occurrences.length > 0) {
      allTotal.value = {
        otuId: props.otuId,
        name: `${name}: all`,
        fullNameHtml: `${nameHtml}${authorYear}: all`,
        count: occurrences.length
      }
    }

    const unidentifiedCount = occurrences.filter((d) => !d.specificEpithet).length
    if (unidentifiedCount > 0) {
      results.value.push({
        otuId: props.otuId,
        taxonNameId: props.taxonId,
        name: `${name} (not identified to species)`,
        fullNameHtml: `${nameHtml}${authorYear} (not identified to species)`,
        count: unidentifiedCount,
        isOwnTaxon: true
      })
    }
  } catch {
  } finally {
    isLoadingOwnTaxon.value = false
  }
}

onMounted(() => {
  loadOwnTaxonSpecimens()
  loadDescendantSpecies()
})
</script>
