<template>
  <div class="tp-keys mx-auto w-full max-w-5xl py-4">
    <VSpinner v-if="loading" />
    <div v-else-if="error" class="text-danger">Could not load key {{ route.params.id }}.</div>
    <div v-else class="rounded-lg border border-base-muted bg-base-foreground p-4 sm:p-6">
      <div class="flex items-start justify-between gap-4">
        <KeyHeader class="flex-1" :meta="meta" :completeness="completeness" :references="references" :primary-citation="primaryCitation" />
        <FormatToggle v-model="format" class="mt-1 shrink-0 key-print-hide" />
      </div>

      <GuidedView
        v-if="format === 'guided'"
        :key-id="route.params.id"
        :couplet="route.params.couplet ?? null"
        :nodes="nodes"
        :citations="citations"
        @open-citation="activeCitation = $event"
      />
      <FullKeyView
        v-else
        :key-id="route.params.id"
        :couplet="route.params.couplet ?? null"
        :couplets="couplets"
        :nodes="nodes"
        :citations="citations"
        @open-citation="activeCitation = $event"
      />

      <CoupletCitation
        v-if="activeCitation"
        :citation="activeCitation"
        @close="activeCitation = null"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, provide } from 'vue'
import { useRoute } from 'vue-router'
import { makeAPIRequest } from '@/utils/request'
import { buildNodes, orderedCouplets, terminalOtus, lowestCommonAncestor } from './lib/tree.js'
import { useKeyImages } from './composables/useKeyImages.js'
import { useKeyTaxonNames } from './composables/useKeyTaxonNames.js'
import KeyHeader from './components/KeyHeader.vue'
import FullKeyView from './components/FullKeyView.vue'
import GuidedView from './components/GuidedView.vue'
import FormatToggle from './components/FormatToggle.vue'
import CoupletCitation from './components/CoupletCitation.vue'
import { readFormat, writeFormat } from './lib/format.js'
import { buildCompletenessReport, finestRank } from './lib/completeness.js'

const route = useRoute()

// { [terminalOtuId]: { validName } } for key terminals that key out a junior synonym.
// Built in loadCompleteness, consumed by TaxonLink via inject (Task 13 / A6).
const synonymyByOtuId = ref({})
provide('keySynonymy', computed(() => synonymyByOtuId.value))

const format = ref('guided')
// ?format= comes from the router query (in hash mode the URL search string is empty, so it
// must not be read off the location object); the localStorage default applies post-mount (F2).
onMounted(() => { format.value = readFormat(route.query.format) })
watch(format, (v) => writeFormat(v))

// Monotonic request generation. Every shared-ref write in load / loadCitations /
// loadCompleteness is guarded by `myGen === loadGen`, so a slow load(A) can't clobber
// refs after the user navigated to key B (F6).
let loadGen = 0

const loading = ref(true)
const error = ref(false)
const rawMeta = ref({})
const listMeta = ref({})
const nodes = ref({})

const couplets = computed(() => orderedCouplets(nodes.value))
const terminalOtuList = computed(() => terminalOtus(nodes.value))

// Per-lead taxon-image loader (OTU inventory → iNaturalist fallback), consumed by
// LeadFigures via inject. KeyView is reused across /key/:id navigations, so its
// caches are cleared explicitly in load() (keyImages.reset()).
const keyImages = useKeyImages(terminalOtuList)
provide('keyImages', keyImages)

// Scientific-name rendering for lead-target pills: name italic, author + year roman
// (matches the vanilla OTU page's cached_html / cached_author_year split).
const keyTaxonNames = useKeyTaxonNames(terminalOtuList)
provide('keyTaxonNames', keyTaxonNames)
const citations = ref({})
const activeCitation = ref(null)
const completeness = ref(null)
// Scope taxon for the header — resolved by loadScope() independently of the (slower)
// completeness pipeline. `scopeTaxonName.html` is the taxon's `full_name_tag` (the same
// field TaxonPages renders its page title from: name parts italic, author roman);
// until it arrives the header shows the plain `metadata.taxonomic_scope` string.
const resolvedScopeOtuId = ref(null)
const scopeTaxonName = ref(null)

const meta = computed(() => ({
  title: rawMeta.value.title || listMeta.value.text || '',
  taxonomicScope: rawMeta.value.taxonomic_scope || null,
  taxonomicScopeHtml: scopeTaxonName.value?.html || null,
  originCitation: rawMeta.value.origin_citation || null,
  attribution: rawMeta.value.attribution || null,
  description: listMeta.value.description || null,
  otuId: listMeta.value.otu_id || resolvedScopeOtuId.value || null,
  // key_updated_at / *_in_words is only in the public GET /leads row, never in
  // GET /leads/key/:id — so this chip renders for public keys only (A13 Step 3).
  updatedInWords: listMeta.value.key_updated_at_in_words || null,
  // couplets + taxa always come from the loaded key tree; the /leads row is only
  // a fallback for the brief moment before nodes populate (A13 Step 1). /leads
  // otus_count also counts the root's scope OTU (otu_id) when the key has one, so
  // drop that to match terminalOtuList (which is already scope-free).
  coupletsCount: couplets.value.length || listMeta.value.couplets_count || null,
  otusCount:
    terminalOtuList.value.length ||
    (listMeta.value.otus_count
      ? listMeta.value.otus_count - (listMeta.value.otu_id ? 1 : 0)
      : null)
}))

// Primary source = the citation the curator flagged `is_original` in TaxonWorks
// (exposed as metadata.origin_citation). No fallback: a key that only cites
// sources for individual couplets but is otherwise original TaxonWorks-team work
// legitimately has NO primary source — those per-couplet citations still show
// under "References cited".
const primaryCitation = computed(() => meta.value.originCitation || null)

const references = computed(() => {
  const byFull = new Map()
  for (const list of Object.values(citations.value || {})) {
    for (const c of list) {
      if (c.full && !byFull.has(c.full)) byFull.set(c.full, { full: c.full, short: c.short, isPrimary: false })
    }
  }
  const primary = primaryCitation.value
  if (primary) {
    const existing = byFull.get(primary)
    if (existing) existing.isPrimary = true
    else byFull.set(primary, { full: primary, short: 'primary source', isPrimary: true })
  }
  return [...byFull.values()].sort((a, b) => String(a.short).localeCompare(String(b.short)))
})

async function load(id) {
  const myGen = ++loadGen
  loading.value = true
  error.value = false
  listMeta.value = {}
  rawMeta.value = {}
  resolvedScopeOtuId.value = null
  scopeTaxonName.value = null
  keyImages.reset()
  keyTaxonNames.reset()
  try {
    const keyReq = makeAPIRequest.get(`/leads/key/${id}`)
    const listReq = makeAPIRequest.get('/leads').catch(() => ({ data: [] }))
    const { data } = await keyReq
    if (myGen !== loadGen) return
    rawMeta.value = data.metadata || {}
    nodes.value = buildNodes(data.data.entries || {}, data.data.leads || {})
    loadCitations(Object.keys(nodes.value), myGen)
    const { data: list } = await listReq
    if (myGen !== loadGen) return
    listMeta.value = (Array.isArray(list) ? list : []).find((r) => r.id === Number(id)) || {}
    loadScope(listMeta.value.otu_id, nodes.value, myGen)
    loadCompleteness(listMeta.value.otu_id, nodes.value, myGen)
  } catch {
    if (myGen === loadGen) error.value = true
  } finally {
    if (myGen === loadGen) loading.value = false
  }
}

async function loadCitations(leadIds, myGen) {
  if (!leadIds.length) return
  const qs = new URLSearchParams()
  qs.set('citation_object_type', 'Lead')
  qs.append('extend[]', 'source')
  leadIds.forEach((id) => qs.append('citation_object_id[]', id))
  try {
    const { data } = await makeAPIRequest.get(`/citations?${qs.toString()}`)
    if (myGen !== loadGen) return
    const map = {}
    for (const c of Array.isArray(data) ? data : []) {
      const key = String(c.citation_object_id)
      ;(map[key] ||= []).push({
        id: c.id,
        short: c.citation_source_body || c.source?.author_year || 'reference',
        full: c.source?.cached || c.citation_source_body || ''
      })
    }
    citations.value = map
  } catch {
    if (myGen === loadGen) citations.value = {}
  }
}

// Terminal-OTU → taxon-name resolution + the key's scope taxon, shared by loadScope()
// (header, fast) and loadCompleteness() (slow pipeline). Both previously ran the
// terminal `/otus` batch and the up-to-15-request ancestor walk independently (F1).
// Memoised per load generation; a fresh load() (++loadGen) invalidates it.
// Returns { scopeTnId, scopeOtuId, otuIdToTnId }.
let scopeResolve = { gen: -1, promise: null }
function resolveScope(scopeOtuId, nodeMap, myGen) {
  if (scopeResolve.gen === myGen && scopeResolve.promise) return scopeResolve.promise
  const promise = (async () => {
    const otuIdToTnId = new Map()
    const terminals = terminalOtus(nodeMap)
    if (terminals.length) {
      const oq = new URLSearchParams()
      terminals.forEach((t) => oq.append('otu_id[]', t.id))
      oq.set('per', '1000')
      const { data: otuRaw } = await makeAPIRequest.get(`/otus?${oq.toString()}`)
      for (const o of Array.isArray(otuRaw) ? otuRaw : []) {
        if (o.taxon_name_id != null) otuIdToTnId.set(o.id, o.taxon_name_id)
      }
    }
    const rawTnIds = [...new Set([...otuIdToTnId.values()])]

    let scopeTnId = null
    let resolvedOtuId = scopeOtuId || null
    if (scopeOtuId) {
      // public key: scope OTU is known, one lookup for its taxon-name id
      const { data: o } = await makeAPIRequest.get(`/otus/${scopeOtuId}`)
      scopeTnId = o?.taxon_name_id || null
    } else if (rawTnIds.length) {
      // otherwise: lowest common ancestor of the key's terminals (A13 Step 2)
      scopeTnId = await resolveScopeFromTerminals(rawTnIds)
      if (scopeTnId) {
        const { data: sOtu } = await makeAPIRequest.get(`/otus?taxon_name_id[]=${scopeTnId}&per=1`)
        resolvedOtuId = Array.isArray(sOtu) ? sOtu[0]?.id ?? null : null
      }
    }
    return { scopeTnId, scopeOtuId: resolvedOtuId, otuIdToTnId }
  })()
  scopeResolve = { gen: myGen, promise }
  return promise
}

// Scope taxon for the header — its OTU id (route target) and `full_name_tag` (display).
// Standalone so it isn't blocked behind the completeness pipeline.
async function loadScope(scopeOtuId, nodeMap, myGen) {
  try {
    const { scopeTnId, scopeOtuId: otuId } = await resolveScope(scopeOtuId, nodeMap, myGen)
    if (!scopeTnId || myGen !== loadGen) return

    const { data: sum } = await makeAPIRequest.get(`/taxon_names/${scopeTnId}/inventory/summary`)
    if (myGen !== loadGen) return
    if (otuId != null) resolvedScopeOtuId.value = otuId
    if (sum?.full_name_tag) scopeTaxonName.value = { html: sum.full_name_tag }
  } catch {
    // leave nulls — the header keeps showing the plain metadata.taxonomic_scope string
  }
}

// Batch-walk parent_id upward from the terminal taxon-names, one level per request,
// and return the lowest common ancestor taxon-name id — the scope taxon of a key
// that has no public /leads row (so no scope otu_id). null if it can't be resolved.
async function resolveScopeFromTerminals(tnIds) {
  const parentOf = new Map()
  let frontier = [...new Set(tnIds)]
  for (let level = 0; level < 15 && frontier.length; level++) {
    const q = new URLSearchParams()
    frontier.forEach((id) => q.append('taxon_name_id[]', id))
    q.set('per', '1000')
    const { data } = await makeAPIRequest.get(`/taxon_names?${q.toString()}`)
    const next = []
    for (const r of Array.isArray(data) ? data : []) {
      if (parentOf.has(r.id)) continue
      parentOf.set(r.id, r.parent_id ?? null)
      if (r.parent_id != null && !parentOf.has(r.parent_id)) next.push(r.parent_id)
    }
    frontier = [...new Set(next)]
  }
  // one root -> leaf ancestor chain per terminal
  const chains = []
  for (const start of new Set(tnIds)) {
    const chain = []
    const seen = new Set()
    let cur = start
    while (cur != null && !seen.has(cur)) {
      seen.add(cur)
      chain.push(cur)
      cur = parentOf.has(cur) ? parentOf.get(cur) : null
    }
    chains.push(chain.reverse())
  }
  return lowestCommonAncestor(chains)
}

async function loadCompleteness(scopeOtuId, nodeMap, myGen) {
  try {
    if (myGen !== loadGen) return
    completeness.value = null
    synonymyByOtuId.value = {}

    // key terminals that point at an OTU, deduped by OTU id (first target_label wins)
    const terminals = terminalOtus(nodeMap).map((t) => ({ otuId: t.id, label: t.label }))
    if (!terminals.length) return

    // terminal OTU→taxon-name map + scope taxon-name id — resolved once per load
    // generation and shared with loadScope() (F1: the /otus batch and the ancestor
    // walk previously ran in both pipelines).
    const { scopeTnId, otuIdToTnId } = await resolveScope(scopeOtuId, nodeMap, myGen)
    if (myGen !== loadGen) return
    const rawTnIds = [...new Set([...otuIdToTnId.values()])]
    if (!scopeTnId || !rawTnIds.length) return

    // resolve the terminal taxon-names (validity + valid target) BEFORE the descendants
    // fetch — their ranks drive a rank-scoped descendants query so a large tribe/family
    // scope (Lixini: 557 descendants) isn't silently truncated by a per-page cap (A16).
    const tq = new URLSearchParams()
    rawTnIds.forEach((id) => tq.append('taxon_name_id[]', id))
    tq.set('per', '1000')
    const { data: tnRaw } = await makeAPIRequest.get(`/taxon_names?${tq.toString()}`)
    const tnRowById = new Map((Array.isArray(tnRaw) ? tnRaw : []).map((t) => [t.id, t]))

    // Distinct terminal ranks as bare words (finestRank([raw]) normalises a single
    // rank). Every one gets its own rank-scoped descendants fetch below; the actual
    // target rank is chosen inside buildCompletenessReport (modalRank — the rank the
    // key mostly operates at). This is only a "any usable rank at all?" guard.
    const terminalRankWords = [...new Set(
      [...tnRowById.values()].map((t) => finestRank([t.rank])).filter(Boolean)
    )]
    if (!terminalRankWords.length) return

    // descendants of the scope taxon, one rank-scoped fetch per distinct terminal
    // rank, synonyms included (no validity filter — synonym folding still needs them)
    const mapRow = (d) => ({
      id: d.id,
      parentId: d.parent_id,
      rank: d.rank,
      name: d.cached || d.name,
      authorYear: d.cached_author_year,
      valid: d.cached_is_valid !== false,
      validId: d.cached_valid_taxon_name_id
    })
    // GET /taxon_names `rank` is a scalar, last-one-wins param — appending several ranks
    // keeps only the last one. Issue one rank-filtered request per distinct terminal rank
    // and merge, deduping by id (F1).
    const descRaw = (
      await Promise.all(
        terminalRankWords.map((r) => {
          const q = new URLSearchParams()
          q.append('taxon_name_id[]', scopeTnId)
          q.set('descendants', 'true')
          q.set('rank', r)
          q.set('per', '1000')
          return makeAPIRequest.get(`/taxon_names?${q.toString()}`).then((x) => x.data).catch(() => [])
        })
      )
    ).flat()
    const descendants = []
    const descById = new Map()
    for (const raw of Array.isArray(descRaw) ? descRaw : []) {
      if (raw == null || descById.has(raw.id)) continue
      const row = mapRow(raw)
      descendants.push(row)
      descById.set(row.id, row)
    }
    const descIds = new Set(descendants.map((d) => d.id))
    const authored = (d) => (d ? [d.name, d.authorYear].filter(Boolean).join(' ') : '')

    // the rank-scoped result omits the grouping-rank parents buildCompletenessReport
    // needs for its `groups`; fetch the distinct parents and merge them in (dedupe by id)
    const parentIds = [...new Set(descendants.map((d) => d.parentId).filter(Boolean))]
    if (parentIds.length) {
      const pq = new URLSearchParams()
      parentIds.forEach((id) => pq.append('taxon_name_id[]', id))
      pq.set('per', '1000')
      const { data: parentRaw } = await makeAPIRequest.get(`/taxon_names?${pq.toString()}`)
      for (const d of Array.isArray(parentRaw) ? parentRaw : []) {
        if (descById.has(d.id)) continue
        const row = mapRow(d)
        descendants.push(row)
        descById.set(row.id, row)
        descIds.add(row.id)
      }
    }

    // scope taxon-name rank
    let scopeRank = descById.get(scopeTnId)?.rank || null
    if (!scopeRank) {
      const { data: scopeTn } = await makeAPIRequest.get(`/taxon_names/${scopeTnId}`)
      scopeRank = scopeTn?.rank || null
    }

    const terminalTnIds = []
    const outOfScopeTerminals = []
    const synMap = {}
    for (const t of terminals) {
      const rawTnId = otuIdToTnId.get(t.otuId)
      if (rawTnId == null) continue
      const row = tnRowById.get(rawTnId)
      const validId = row?.cached_valid_taxon_name_id || rawTnId
      terminalTnIds.push(validId)
      if (!descIds.has(validId)) outOfScopeTerminals.push({ label: t.label, otuId: t.otuId })
      if (row && row.cached_is_valid === false) {
        synMap[t.otuId] = { validName: authored(descById.get(validId)) }
      }
    }
    if (myGen !== loadGen) return
    synonymyByOtuId.value = synMap

    // an OTU id per descendant taxon-name, for the report's new-tab links
    const tnIdToOtuId = {}
    const dq2 = new URLSearchParams()
    descendants.forEach((d) => dq2.append('taxon_name_id[]', d.id))
    dq2.set('per', '1000')
    const { data: otuRaw2 } = await makeAPIRequest.get(`/otus?${dq2.toString()}`)
    for (const o of Array.isArray(otuRaw2) ? otuRaw2 : []) {
      if (o.taxon_name_id != null && !(o.taxon_name_id in tnIdToOtuId)) {
        tnIdToOtuId[o.taxon_name_id] = o.id
      }
    }

    if (myGen !== loadGen) return
    completeness.value = buildCompletenessReport({
      scopeRank,
      descendants,
      terminalTnIds: [...new Set(terminalTnIds)],
      tnIdToOtuId,
      outOfScopeTerminals
    })
  } catch {
    if (myGen === loadGen) completeness.value = null
  }
}

watch(() => route.params.id, (id) => id && load(id), { immediate: true })
</script>

<style>
/* Unscoped so `.key-print-hide` inside child components still matches; the two broad
   rules are namespaced under `.tp-keys` so they don't leak app-wide once a key opens (F5). */
@media print {
  .key-print-hide { display: none !important; }
  .tp-keys { max-width: none !important; }
  .tp-keys a { text-decoration: none !important; color: inherit !important; }
}
</style>
