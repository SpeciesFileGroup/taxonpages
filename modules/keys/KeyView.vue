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
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { makeAPIRequest } from '@/utils/request'
import { buildNodes, orderedCouplets, childChoices } from './lib/tree.js'
import KeyHeader from './components/KeyHeader.vue'
import FullKeyView from './components/FullKeyView.vue'
import GuidedView from './components/GuidedView.vue'
import FormatToggle from './components/FormatToggle.vue'
import CoupletCitation from './components/CoupletCitation.vue'
import { readFormat, writeFormat } from './lib/format.js'
import { assessCompleteness } from './lib/completeness.js'

const route = useRoute()

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
  completeness.value = null
  const terminalOtuIds = [...new Set(Object.values(nodeMap)
    .filter((n) => !n.isCouplet && n.targetType === '/api/v1/otus' && n.targetId != null)
    .map((n) => n.targetId))]
  if (!scopeOtuId || !terminalOtuIds.length) return
  try {
    // scope OTU -> its taxon-name id
    const { data: scopeOtu } = await makeAPIRequest.get(`/otus/${scopeOtuId}`)
    const scopeTnId = scopeOtu?.taxon_name_id
    if (!scopeTnId) return

    // valid descendants of the scope taxon (id + rank + name)
    const dq = new URLSearchParams()
    dq.append('taxon_name_id[]', scopeTnId)
    dq.set('descendants', 'true')
    dq.set('validity', 'true')
    dq.set('per', '500')
    const { data: descRaw } = await makeAPIRequest.get(`/taxon_names?${dq.toString()}`)
    const descendants = (Array.isArray(descRaw) ? descRaw : []).map((d) => ({
      taxonNameId: d.id,
      rank: d.rank,
      name: [d.cached || d.name, d.cached_author_year].filter(Boolean).join(' '),
      valid: d.cached_is_valid !== false
    }))

    // terminal OTUs -> taxon-name ids
    const oq = new URLSearchParams()
    terminalOtuIds.forEach((id) => oq.append('otu_id[]', id))
    oq.set('per', '500')
    const { data: otuRaw } = await makeAPIRequest.get(`/otus?${oq.toString()}`)
    const termTnIds = [...new Set((Array.isArray(otuRaw) ? otuRaw : [])
      .map((o) => o.taxon_name_id).filter(Boolean))]
    if (!termTnIds.length) return

    // ranks for the terminal taxon-names (some may already be in `descendants`, but fetch
    // all so out-of-scope terminals still get a rank)
    const tq = new URLSearchParams()
    termTnIds.forEach((id) => tq.append('taxon_name_id[]', id))
    tq.set('per', '500')
    const { data: tnRaw } = await makeAPIRequest.get(`/taxon_names?${tq.toString()}`)
    const terminals = (Array.isArray(tnRaw) ? tnRaw : []).map((t) => ({
      taxonNameId: t.cached_valid_taxon_name_id || t.id,
      rank: t.rank,
      label: [t.cached || t.name, t.cached_author_year].filter(Boolean).join(' ')
    }))

    completeness.value = assessCompleteness({ terminals, descendants })
  } catch (e) {
    completeness.value = null
  }
}

watch(() => route.params.id, (id) => id && load(id), { immediate: true })
</script>
