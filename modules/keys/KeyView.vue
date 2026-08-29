<template>
  <div class="container mx-auto py-4">
    <VSpinner v-if="loading" />
    <div v-else-if="error" class="text-danger">Could not load key {{ route.params.id }}.</div>
    <div v-else class="rounded-lg border border-base-border bg-base-foreground p-4 sm:p-6">
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
import { buildNodes, orderedCouplets, childChoices, rootId, terminalOtus, lowestCommonAncestor } from './lib/tree.js'
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
onMounted(() => { format.value = readFormat() })
watch(format, (v) => writeFormat(v))

const loading = ref(true)
const error = ref(false)
const rawMeta = ref({})
const listMeta = ref({})
const nodes = ref({})

const couplets = computed(() => orderedCouplets(nodes.value))
const terminalOtuList = computed(() => terminalOtus(nodes.value))
const childrenOf = (id) => childChoices(id, nodes.value)
const citations = ref({})
const activeCitation = ref(null)
const completeness = ref(null)

const meta = computed(() => ({
  title: rawMeta.value.title || listMeta.value.text || '',
  taxonomicScope: rawMeta.value.taxonomic_scope || null,
  originCitation: rawMeta.value.origin_citation || null,
  attribution: rawMeta.value.attribution || null,
  description: listMeta.value.description || null,
  otuId: listMeta.value.otu_id || null,
  // key_updated_at / *_in_words is only in the public GET /leads row, never in
  // GET /leads/key/:id — so this chip renders for public keys only (A13 Step 3).
  updatedInWords: listMeta.value.key_updated_at_in_words || null,
  // couplets + taxa always come from the loaded key tree; the /leads row is only
  // a fallback for the brief moment before nodes populate (A13 Step 1).
  coupletsCount: couplets.value.length || listMeta.value.couplets_count || null,
  otusCount: terminalOtuList.value.length || listMeta.value.otus_count || null
}))

const primaryCitation = computed(() => {
  if (meta.value.originCitation) return meta.value.originCitation
  if (!Object.keys(nodes.value).length) return null
  const rootCites = citations.value[String(rootId(nodes.value))] || []
  return rootCites[0]?.full || null
})

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
  loading.value = true
  error.value = false
  listMeta.value = {}
  try {
    const keyReq = makeAPIRequest.get(`/leads/key/${id}`)
    const listReq = makeAPIRequest.get('/leads').catch(() => ({ data: [] }))
    const { data } = await keyReq
    rawMeta.value = data.metadata || {}
    nodes.value = buildNodes(data.data.entries || {}, data.data.leads || {})
    loadCitations(Object.keys(nodes.value))
    const { data: list } = await listReq
    listMeta.value = (Array.isArray(list) ? list : []).find((r) => r.id === Number(id)) || {}
    loadCompleteness(listMeta.value.otu_id, nodes.value)
  } catch (e) {
    error.value = true
  } finally {
    loading.value = false
  }
}

async function loadCitations(leadIds) {
  if (!leadIds.length) return
  const qs = new URLSearchParams()
  qs.set('citation_object_type', 'Lead')
  qs.append('extend[]', 'source')
  leadIds.forEach((id) => qs.append('citation_object_id[]', id))
  try {
    const { data } = await makeAPIRequest.get(`/citations?${qs.toString()}`)
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
  } catch (e) {
    citations.value = {}
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

async function loadCompleteness(scopeOtuId, nodeMap) {
  try {
    completeness.value = null
    synonymyByOtuId.value = {}

    // key terminals that point at an OTU, deduped by OTU id (first target_label wins)
    const terminals = terminalOtus(nodeMap).map((t) => ({ otuId: t.id, label: t.label }))
    if (!terminals.length) return

    // terminal OTUs -> their taxon-name ids (resolved early: the non-public-key
    // branch derives the scope taxon from these)
    const oq = new URLSearchParams()
    terminals.forEach((t) => oq.append('otu_id[]', t.otuId))
    oq.set('per', '1000')
    const { data: otuRaw } = await makeAPIRequest.get(`/otus?${oq.toString()}`)
    const otuIdToTnId = new Map()
    for (const o of Array.isArray(otuRaw) ? otuRaw : []) {
      if (o.taxon_name_id != null) otuIdToTnId.set(o.id, o.taxon_name_id)
    }
    const rawTnIds = [...new Set([...otuIdToTnId.values()])]
    if (!rawTnIds.length) return

    // scope taxon-name id: fast path from the public /leads row's scope OTU;
    // otherwise the lowest common ancestor of the key's own terminals (A13 Step 2)
    let scopeTnId = null
    if (scopeOtuId) {
      const { data: scopeOtu } = await makeAPIRequest.get(`/otus/${scopeOtuId}`)
      scopeTnId = scopeOtu?.taxon_name_id || null
    } else {
      scopeTnId = await resolveScopeFromTerminals(rawTnIds)
    }
    if (!scopeTnId) return

    // resolve the terminal taxon-names (validity + valid target) BEFORE the descendants
    // fetch — their ranks drive a rank-scoped descendants query so a large tribe/family
    // scope (Lixini: 557 descendants) isn't silently truncated by a per-page cap (A16).
    const tq = new URLSearchParams()
    rawTnIds.forEach((id) => tq.append('taxon_name_id[]', id))
    tq.set('per', '1000')
    const { data: tnRaw } = await makeAPIRequest.get(`/taxon_names?${tq.toString()}`)
    const tnRowById = new Map((Array.isArray(tnRaw) ? tnRaw : []).map((t) => [t.id, t]))

    // distinct terminal ranks as bare words (finestRank([raw]) normalises a single rank);
    // targetRank is the finest of them, the rest are coarser ranks the key also keys out.
    const terminalRankWords = [...new Set(
      [...tnRowById.values()].map((t) => finestRank([t.rank])).filter(Boolean)
    )]
    const targetRank = finestRank(terminalRankWords)
    if (!targetRank) return

    // descendants of the scope taxon, rank-scoped to [targetRank, ...coarser terminal
    // ranks], synonyms included (no validity filter — synonym folding still needs them)
    const mapRow = (d) => ({
      id: d.id,
      parentId: d.parent_id,
      rank: d.rank,
      name: d.cached || d.name,
      authorYear: d.cached_author_year,
      valid: d.cached_is_valid !== false,
      validId: d.cached_valid_taxon_name_id
    })
    const dq = new URLSearchParams()
    dq.append('taxon_name_id[]', scopeTnId)
    dq.set('descendants', 'true')
    terminalRankWords.forEach((r) => dq.append('rank', r))
    dq.set('per', '1000')
    const { data: descRaw } = await makeAPIRequest.get(`/taxon_names?${dq.toString()}`)
    const descendants = (Array.isArray(descRaw) ? descRaw : []).map(mapRow)
    const descById = new Map(descendants.map((d) => [d.id, d]))
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

    completeness.value = buildCompletenessReport({
      scopeRank,
      descendants,
      terminalTnIds: [...new Set(terminalTnIds)],
      tnIdToOtuId,
      outOfScopeTerminals
    })
  } catch (e) {
    completeness.value = null
  }
}

watch(() => route.params.id, (id) => id && load(id), { immediate: true })
</script>

<style>
@media print {
  .key-print-hide { display: none !important; }
  .container { max-width: none !important; }
  a { text-decoration: none !important; color: inherit !important; }
}
</style>
