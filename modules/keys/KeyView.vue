<template>
  <div class="container mx-auto py-4">
    <VSpinner v-if="loading" />
    <div v-else-if="error" class="text-danger">Could not load key {{ route.params.id }}.</div>
    <div v-else>
      <KeyHeader :meta="meta" />
      <FullKeyView
        :key-id="route.params.id"
        :couplet="route.params.couplet ?? null"
        :couplets="couplets"
        :nodes="nodes"
        :citations="citations"
        @open-citation="() => {}"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { makeAPIRequest } from '@/utils/request'
import { buildNodes, orderedCouplets, childChoices } from './lib/tree.js'
import KeyHeader from './components/KeyHeader.vue'
import FullKeyView from './components/FullKeyView.vue'

const route = useRoute()

const loading = ref(true)
const error = ref(false)
const rawMeta = ref({})
const listMeta = ref({})
const nodes = ref({})

const couplets = computed(() => orderedCouplets(nodes.value))
const childrenOf = (id) => childChoices(id, nodes.value)
const citations = ref({})

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
    const { data: list } = await listReq
    listMeta.value = (Array.isArray(list) ? list : []).find((r) => r.id === Number(id)) || {}
  } catch (e) {
    error.value = true
  } finally {
    loading.value = false
  }
}

watch(() => route.params.id, (id) => id && load(id), { immediate: true })
</script>
