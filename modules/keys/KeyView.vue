<template>
  <div class="container mx-auto py-4">
    <VSpinner v-if="loading" />
    <div v-else-if="error" class="text-danger">Could not load key {{ route.params.id }}.</div>
    <div v-else>
      <div class="flex items-start justify-between gap-4">
        <KeyHeader class="flex-1" :meta="meta" :completeness="completeness" />
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
import { buildNodes, orderedCouplets, childChoices } from './lib/tree.js'
import KeyHeader from './components/KeyHeader.vue'
import FullKeyView from './components/FullKeyView.vue'
import GuidedView from './components/GuidedView.vue'
import FormatToggle from './components/FormatToggle.vue'
import CoupletCitation from './components/CoupletCitation.vue'
import { readFormat, writeFormat } from './lib/format.js'
import { buildCompletenessReport } from './lib/completeness.js'

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
  updatedInWords: listMeta.value.key_updated_at_in_words || null,
  coupletsCount: listMeta.value.couplets_count || null,
  otusCount: listMeta.value.otus_count || null
}))

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

async function loadCompleteness(scopeOtuId, nodeMap) {
  try {
    completeness.value = null
    synonymyByOtuId.value = {}

    // key terminals that point at an OTU, deduped by OTU id (first target_label wins)
    const termByOtuId = new Map()
    for (const n of Object.values(nodeMap)) {
      if (n.isCouplet || n.targetType !== '/api/v1/otus' || n.targetId == null) continue
      if (!termByOtuId.has(n.targetId)) {
        termByOtuId.set(n.targetId, { otuId: n.targetId, label: String(n.targetLabel || '') })
      }
    }
    const terminals = [...termByOtuId.values()]
    if (!scopeOtuId || !terminals.length) return

    // scope OTU -> its taxon-name id
    const { data: scopeOtu } = await makeAPIRequest.get(`/otus/${scopeOtuId}`)
    const scopeTnId = scopeOtu?.taxon_name_id
    if (!scopeTnId) return

    // all descendants of the scope taxon INCLUDING synonyms (no validity filter)
    const dq = new URLSearchParams()
    dq.append('taxon_name_id[]', scopeTnId)
    dq.set('descendants', 'true')
    dq.set('per', '500')
    const { data: descRaw } = await makeAPIRequest.get(`/taxon_names?${dq.toString()}`)
    const descendants = (Array.isArray(descRaw) ? descRaw : []).map((d) => ({
      id: d.id,
      parentId: d.parent_id,
      rank: d.rank,
      name: d.cached || d.name,
      authorYear: d.cached_author_year,
      valid: d.cached_is_valid !== false,
      validId: d.cached_valid_taxon_name_id
    }))
    const descById = new Map(descendants.map((d) => [d.id, d]))
    const descIds = new Set(descendants.map((d) => d.id))
    const authored = (d) => (d ? [d.name, d.authorYear].filter(Boolean).join(' ') : '')

    // scope taxon-name rank
    let scopeRank = descById.get(scopeTnId)?.rank || null
    if (!scopeRank) {
      const { data: scopeTn } = await makeAPIRequest.get(`/taxon_names/${scopeTnId}`)
      scopeRank = scopeTn?.rank || null
    }

    // terminal OTUs -> their taxon-name ids
    const oq = new URLSearchParams()
    terminals.forEach((t) => oq.append('otu_id[]', t.otuId))
    oq.set('per', '500')
    const { data: otuRaw } = await makeAPIRequest.get(`/otus?${oq.toString()}`)
    const otuIdToTnId = new Map()
    for (const o of Array.isArray(otuRaw) ? otuRaw : []) {
      if (o.taxon_name_id != null) otuIdToTnId.set(o.id, o.taxon_name_id)
    }
    const rawTnIds = [...new Set([...otuIdToTnId.values()])]
    if (!rawTnIds.length) return

    // resolve those taxon-names (validity + valid target) so synonym terminals fold to
    // their valid id
    const tq = new URLSearchParams()
    rawTnIds.forEach((id) => tq.append('taxon_name_id[]', id))
    tq.set('per', '500')
    const { data: tnRaw } = await makeAPIRequest.get(`/taxon_names?${tq.toString()}`)
    const tnRowById = new Map((Array.isArray(tnRaw) ? tnRaw : []).map((t) => [t.id, t]))

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
    dq2.set('per', '500')
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
