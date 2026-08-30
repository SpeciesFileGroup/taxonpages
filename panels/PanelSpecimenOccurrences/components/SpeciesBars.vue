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
        :preloaded-data="selected.otuId === props.otuId ? genusRawData : (selected.records || null)"
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
          <div v-if="allTotal.isFallback" class="px-1.5 pt-1.5 text-xs opacity-50">
            <strong>Query 1 failed — showing Query 2's total instead:</strong> sum of every species Query 2 found;
            may not include specimens identified only to this taxon itself.
          </div>
          <div v-else class="px-1.5 pt-1.5 text-xs opacity-50">
            <strong>Query 1 result:</strong> total specimen &amp; occurrence records across the whole taxon.
          </div>
          <div
            class="relative flex items-center gap-2 py-1 px-1.5 rounded cursor-pointer hover:bg-base-muted"
            @click="selected = allTotal"
          >
            <span class="absolute inset-y-0 left-0 right-0 bg-secondary/15 rounded" />
            <span class="relative text-sm font-medium flex-1 min-w-0 truncate">{{ allTotal.name }}</span>
            <span class="relative text-xs font-medium tabular-nums shrink-0">{{ allTotal.count }}</span>
          </div>
        </div>
        <!--
          This fetch can take a while on a mega-genus — the TaxonWorks
          endpoint it needs doesn't stay fast at that scale (see
          loadOwnTaxonSpecimens) and there's no way around paying for it
          once — so this placeholder is the only thing that would otherwise
          look like nothing is happening.
        -->
        <div v-else-if="isLoadingOwnTaxon" class="pb-2 text-xs opacity-50 border-b border-base-muted flex items-center gap-1.5">
          <span><strong>Query 1:</strong> Fetching all specimen at once. This may take several minutes.</span>
          <!-- A moving dot rather than the line-wide animate-pulse used
               elsewhere — this wait can run for minutes, and a single dot
               cycling through 3 fixed positions is a cheap (pure CSS, no
               JS timer) "still alive" signal that doesn't ask the reader to
               keep re-reading the sentence to tell it apart from a static
               one. -->
          <span class="loading-dots" aria-hidden="true"><span /><span /><span /></span>
        </div>
        <div v-else-if="ownTaxonError" class="pb-2 text-xs border-b border-base-muted">
          <strong class="text-danger">Query 1 failed:</strong>
          <span class="opacity-70"> couldn't compute the whole-taxon total — the request {{ ownTaxonError }}. This
          gets more likely at higher taxonomic ranks (family, tribe). Query 2 below is unaffected and keeps working
          through the per-species list on its own.</span>
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
          <div v-if="query2Stopped" class="px-2 pb-2 text-xs opacity-50">
            <strong>Query 2:</strong> stopped — Query 1 already answered this, so its complete result is shown
            below instead.
          </div>
          <div
            v-else
            class="px-2 pb-2 text-xs opacity-50"
            :class="{ 'animate-pulse': isFetchingBatch || isLoadingAll }"
          >
            <strong>Query 2:</strong> Fetching all specimen one species at a time — checked {{ checkedCount }} of
            {{ allSpecies.length }} species so far — {{ sortedResults.length }} of those have at least one record on
            file (shown below as bars, sorted by count){{ failedSpeciesCount ? `; ${failedSpeciesCount} species could not be checked (request failed or timed out)` : '' }}{{ isFetchingBatch || isLoadingAll ? '…' : '.' }}
          </div>

          <div v-if="!query2Stopped && !isFetchingBatch && !isLoadingAll && hasMore" class="px-2 pb-2 flex items-center gap-2">
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

// Mirrors SingleSpeciesOccurrences.vue's splitScientificName exactly (kept
// as a local duplicate, same reasoning as that file's own escHtml/typeStatusHtml
// comments) — used only to build display names for species Query 1's
// complete result adds/replaces once it supersedes Query 2 (see
// loadOwnTaxonSpecimens), since those species may not have gone through
// Query 2's own name lookup (taxon_names.json) at all.
function splitScientificName(name) {
  const words = (name || '').trim().split(/\s+/)
  let i = 1
  while (i < words.length) {
    const w = words[i]
    if (/^[a-z]/.test(w)) {
      i++
      continue
    }
    if (/^\(/.test(w) && /^[a-z]/.test(words[i + 1] || '')) {
      i++
      continue
    }
    if (/^\[/.test(w)) {
      i++
      continue
    }
    break
  }
  return { italic: words.slice(0, i).join(' '), plain: words.slice(i).join(' ') }
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
const ownTaxonError = ref('') // set on Query 1 failure/timeout — see loadOwnTaxonSpecimens
const failedSpeciesCount = ref(0) // Query 2 requests that failed/timed out — see fetchSpeciesCount
const genusRawData = ref(null) // raw dwc.json rows for props.otuId, cached so expanding "all"/"not identified" doesn't re-fetch them
const selected = ref(null)
// Set once Query 1 completes with data — from that point every species'
// count is already known from Query 1's own response (see
// loadOwnTaxonSpecimens), so Query 2's remaining per-species requests would
// only be redundant network traffic. Checked between batch items (an
// item's own in-flight request still finishes normally) and before
// starting a new batch at all.
const query2Stopped = ref(false)

// Lookup tables for resolving a raw occurrence otu_id (which can point to
// ANY rank, or a synonym) to the OTU of the valid species it should be
// attributed to — see resolveSpeciesOtuId. Built once by Query 2's list
// fetch and reused by Query 1's own grouping too, so the two queries always
// agree on the same set of species bars instead of Query 1 creating a
// separate bar for every distinct determination target (which could
// otherwise collide in DISPLAY NAME with an unrelated species, or leave
// the per-species bars not summing back to "…: all"). Plain Maps, not
// refs — read only from JS logic below, never rendered directly.
const taxonNameById = new Map() // taxonNameId -> raw taxon_names.json record
const taxonNameIdByOtuId = new Map() // otuId -> taxonNameId
const otuIdByTaxonNameId = new Map() // taxonNameId -> otuId
let resolveListReady
// Query 1 awaits this before finalizing its grouping — see its own comment
// for why that coupling is an acceptable trade-off (Query 2's list fetch
// is fast, ~1-2s even at huge scale, and Query 1 always takes at least
// several seconds, so in practice this almost never adds a visible wait).
const listReady = new Promise((resolve) => {
  resolveListReady = resolve
})

// Mirrors loadOwnTaxonSpecimens' "not identified to species" logic one
// level down: walks a subspecies/lower-rank name up via parent_id until it
// reaches species rank, and resolves a synonym via cached_valid_taxon_name_id
// first — matching exactly the rules Query 2's own species list already
// applies (rank === 'species' && cached_is_valid), so a record whose raw
// otu_id points at neither ends up on the SAME bar a direct species-level
// determination would. Returns null (record dropped, not its own bar) if
// resolution can't reach a species-rank ancestor within a sane number of
// hops — an orphaned/malformed record, not something worth inventing a bar
// for.
function resolveSpeciesOtuId(rawOtuId) {
  let tn = taxonNameById.get(taxonNameIdByOtuId.get(rawOtuId))
  if (!tn) return null

  if (tn.cached_valid_taxon_name_id && tn.cached_valid_taxon_name_id !== tn.id) {
    tn = taxonNameById.get(tn.cached_valid_taxon_name_id) || tn
  }

  let depth = 0
  while (tn && tn.rank !== 'species' && depth < 20) {
    tn = taxonNameById.get(tn.parent_id)
    depth++
  }

  return tn && tn.rank === 'species' ? otuIdByTaxonNameId.get(tn.id) : null
}

// makeAPIRequest has no default timeout (see @sfgrp/taxonpages/src/utils/
// request.js). Applied only to Query 2's per-species requests below — a
// genuinely hung one there would permanently tie up one of the worker
// pool's CONCURRENCY slots, stalling the batch for no benefit. Query 1
// deliberately gets NO timeout: it's expected to legitimately take minutes
// at high taxonomic ranks, and cutting it off after an arbitrary interval
// would misreport "still working" as "failed". Both still surface a
// visible error message on genuine failure (network error, server error)
// — see loadOwnTaxonSpecimens's catch block.
const REQUEST_TIMEOUT_MS = 60000

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

    names.forEach((n) => taxonNameById.set(n.id, n))
    otus.forEach((o) => {
      if (!o.taxon_name_id) return
      taxonNameIdByOtuId.set(o.id, o.taxon_name_id)
      otuIdByTaxonNameId.set(o.taxon_name_id, o.id)
    })

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

  resolveListReady()
  loadNextBatch()
}

// Returns the actual records, not just a count — kept on each results.value
// entry (see loadNextBatch) so that if Query 1 never succeeds, its records
// across every species Query 2 checked can stand in for Query 1's own
// dataset (see maybeBuildFallbackTotal), enabling the same drill-down
// (list/phenology/timeline) for the combined "…: all" that Query 1's real
// result already gets. The memory cost of holding every found species'
// full record set is the trade-off for that capability — acceptable at
// the scale this feature is meant for (see project memory), since it's
// bounded by actual specimen count, not the (potentially much larger)
// species-list size.
async function fetchSpeciesRecords(sp) {
  const { data } = await makeAPIRequest.get(`/otus/${sp.otuId}/inventory/dwc.json`, {
    timeout: REQUEST_TIMEOUT_MS
  })
  return data.filter(
    (d) =>
      d.dwc_occurrence_object_type === 'CollectionObject' ||
      d.dwc_occurrence_object_type === 'FieldOccurrence'
  )
}

// A small worker pool rather than Promise.all(batch.map(...)) — that would
// fire the whole batch (up to BATCH_SIZE) at once, and results streams in
// (pushed as each request resolves, not awaited as a group) so bars pop in
// progressively instead of appearing all at once when the batch finishes.
async function loadNextBatch() {
  if (query2Stopped.value) return
  const start = loadedCount.value
  const end = Math.min(start + BATCH_SIZE, allSpecies.value.length)
  const batch = allSpecies.value.slice(start, end)
  if (!batch.length) return

  isFetchingBatch.value = true
  checkedCount.value = start

  let cursor = 0
  async function worker() {
    while (cursor < batch.length && !query2Stopped.value) {
      const sp = batch[cursor++]
      try {
        const records = await fetchSpeciesRecords(sp)
        // Query 1 may have completed (and replaced results.value wholesale
        // with its own complete data) while this specific request was still
        // in flight — don't re-add a now-superseded/duplicate entry.
        if (records.length > 0 && !query2Stopped.value) {
          results.value.push({ ...sp, count: records.length, records })
        }
      } catch {
        // One species failing (or timing out after REQUEST_TIMEOUT_MS)
        // shouldn't block the rest of the batch — but it should be visible
        // rather than silently vanishing from the "checked" count, so
        // Query 2's summary line reports how many were skipped this way.
        failedSpeciesCount.value++
      } finally {
        checkedCount.value++
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, batch.length) }, worker))
  loadedCount.value = end
  isFetchingBatch.value = false
  maybeBuildFallbackTotal()
}

// If Query 1 has definitively failed (not just still running — it's still
// worth waiting for the authoritative result while there's a chance),
// AND Query 2 has now checked every species with nothing left to load,
// its own accumulated records already amount to everything findable this
// way. Called from both the end of a batch (covers Query 2 finishing
// after Query 1 already failed) and Query 1's own catch block (covers
// Query 1 failing after Query 2 already finished) — whichever happens
// last is what actually triggers this.
//
// This can never see specimens determined only to the higher taxon's own
// rank (e.g. "Otiorhynchus sp.") — finding those requires exactly the
// single-OTU fetch that just failed, and there's no per-species
// equivalent for something that isn't attached to any species. Labeled
// accordingly rather than silently presented as equivalent to a real
// Query 1 result.
function maybeBuildFallbackTotal() {
  if (allTotal.value || !ownTaxonError.value) return
  if (hasMore.value || isFetchingBatch.value || isLoadingAll.value) return

  const combinedRecords = results.value.flatMap((r) => r.records || [])
  if (!combinedRecords.length) return

  const name = props.taxon?.cached || props.taxon?.name || 'This taxon'
  const nameHtml = props.taxon?.cached_html || escHtml(name)
  const authorYear = props.taxon?.cached_author_year ? ' ' + escHtml(props.taxon.cached_author_year) : ''

  genusRawData.value = combinedRecords
  allTotal.value = {
    otuId: props.otuId,
    name: `${name}: all (from Query 2)`,
    fullNameHtml: `${nameHtml}${authorYear}: all <span class="opacity-60">(from Query 2)</span>`,
    count: combinedRecords.length,
    isFallback: true
  }
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
    while (hasMore.value && !query2Stopped.value) {
      await loadNextBatch()
    }
  } finally {
    isLoadingAll.value = false
    // loadNextBatch's own trailing call to maybeBuildFallbackTotal() always
    // sees isLoadingAll still true while called from inside this loop (it
    // only flips back to false here, after the loop exits) — so on the
    // batch that finally clears hasMore, that call bails out and nothing
    // else ever calls it again. This is the one that actually gets to run
    // with the flag correctly cleared.
    maybeBuildFallbackTotal()
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
// whose CURRENT determination (otu_id) is this OTU itself, the count
// actually determined only that far ("not identified to species") — more
// reliable than checking for a blank specificEpithet, since otu_id reflects
// the actual determination TaxonWorks used to decide "self AND descendants"
// scope in the first place. Labeled distinctly ("Otiorhynchus: all"
// vs "Otiorhynchus (not identified to species)") so the two aren't
// conflated the way the unfiltered fetch alone was before this fix.
async function loadOwnTaxonSpecimens() {
  isLoadingOwnTaxon.value = true
  ownTaxonError.value = ''
  try {
    // No timeout — see REQUEST_TIMEOUT_MS's doc comment.
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

      // Query 1's response already carries every species' own otu_id, so
      // its complete per-species breakdown can be derived right here —
      // no need for Query 2 to keep fetching species one at a time to
      // discover what this response already answered. Stop it now (before
      // the resolver-table wait below, since we don't need per-species
      // batching regardless of how long that wait takes) and replace
      // whatever partial results it had accumulated with the complete,
      // accurate set (see query2Stopped's doc comment and its guards in
      // loadNextBatch/loadAllRemaining).
      query2Stopped.value = true

      // resolveSpeciesOtuId needs Query 2's lookup tables (taxon_names.json
      // + otus.json) to have been built — awaiting them here is the one
      // place Query 1 isn't fully independent of Query 2 (see listReady's
      // doc comment for why that's an acceptable trade-off).
      await listReady

      const bySpecies = new Map()
      for (const d of occurrences) {
        // No current determination (no otu_id) → nothing to attribute this
        // record to. This taxon's own otu_id → the "not identified to
        // species" bucket built separately just below, not a species bar.
        if (!d.otu_id || d.otu_id === props.otuId) continue
        const speciesOtuId = resolveSpeciesOtuId(d.otu_id)
        if (!speciesOtuId) continue
        if (!bySpecies.has(speciesOtuId)) bySpecies.set(speciesOtuId, [])
        bySpecies.get(speciesOtuId).push(d)
      }
      results.value = [...bySpecies.entries()].map(([speciesOtuId, records]) => {
        const tn = taxonNameById.get(taxonNameIdByOtuId.get(speciesOtuId))
        // tn is guaranteed present — resolveSpeciesOtuId only returns an
        // otuId it found via this same table — but fall back to the raw
        // scientificName just in case a record's own otu_id IS the species
        // (the common case, no resolution needed) yet somehow isn't in the
        // table (e.g. Query 2 found zero species at all for this taxon).
        if (!tn) {
          const { italic, plain } = splitScientificName(records[0].scientificName)
          return {
            otuId: speciesOtuId,
            name: italic,
            fullNameHtml: plain ? `<em>${escHtml(italic)}</em> ${escHtml(plain)}` : `<em>${escHtml(italic)}</em>`,
            count: records.length
          }
        }
        return {
          otuId: speciesOtuId,
          name: tn.cached,
          fullNameHtml: `${tn.cached_html || escHtml(tn.cached)}${tn.cached_author_year ? ' ' + escHtml(tn.cached_author_year) : ''}`,
          count: records.length
        }
      })
    }

    const unidentifiedCount = occurrences.filter((d) => d.otu_id === props.otuId).length
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
  } catch (e) {
    // No client-side timeout is set on this request (see REQUEST_TIMEOUT_MS's
    // doc comment), so ECONNABORTED here means something upstream (the
    // browser, a proxy) gave up — not that we imposed an arbitrary limit.
    ownTaxonError.value =
      e?.code === 'ECONNABORTED'
        ? 'was aborted (took too long for the browser or network to keep waiting)'
        : e?.response?.status
          ? `failed (server responded ${e.response.status})`
          : 'failed (no response from the server)'
    // Covers the ordering where Query 2 already finished checking every
    // species before Query 1 got around to failing — see
    // maybeBuildFallbackTotal's own doc comment for the other ordering.
    maybeBuildFallbackTotal()
  } finally {
    isLoadingOwnTaxon.value = false
  }
}

onMounted(() => {
  loadOwnTaxonSpecimens()
  loadDescendantSpecies()
})
</script>

<style scoped>
/* Three fixed positions, one dot fading in across them in sequence — reads
   as movement without any JS timer/interval. */
.loading-dots {
  display: inline-flex;
  width: 1.5em;
  justify-content: space-between;
}
.loading-dots span {
  width: 0.25em;
  height: 0.25em;
  border-radius: 9999px;
  background: currentColor;
  opacity: 0.2;
  animation: loading-dots-fade 1.2s infinite;
}
.loading-dots span:nth-child(2) {
  animation-delay: 0.2s;
}
.loading-dots span:nth-child(3) {
  animation-delay: 0.4s;
}
@keyframes loading-dots-fade {
  0%, 80%, 100% {
    opacity: 0.2;
  }
  40% {
    opacity: 1;
  }
}
</style>
