<template>
  <div class="container mx-auto py-4">
    <VSpinner v-if="loading" />
    <div v-else-if="error" class="text-danger">Could not load key {{ route.params.id }}.</div>
    <div v-else>
      <h1 class="text-xl mb-4">{{ metadata.title }}</h1>
      <ol>
        <li v-for="c in couplets" :key="c.id" class="mb-3">
          <strong>Couplet {{ c.coupletNumber }}</strong>
          <ul class="ml-4 list-disc">
            <li v-for="choice in childrenOf(c.id)" :key="choice.id">
              {{ choice.text }}
              — <em>{{ choice.isCouplet ? 'couplet ' + choice.coupletNumber : choice.targetLabel }}</em>
            </li>
          </ul>
        </li>
      </ol>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { makeAPIRequest } from '@/utils/request'
import { buildNodes, orderedCouplets, childChoices } from './lib/tree.js'

const route = useRoute()

const loading = ref(true)
const error = ref(false)
const metadata = ref({})
const nodes = ref({})

const couplets = computed(() => orderedCouplets(nodes.value))
const childrenOf = (id) => childChoices(id, nodes.value)

async function load(id) {
  loading.value = true
  error.value = false
  try {
    const { data } = await makeAPIRequest.get(`/leads/key/${id}`)
    metadata.value = data.metadata || {}
    nodes.value = buildNodes(data.data.entries || {}, data.data.leads || {})
  } catch (e) {
    error.value = true
  } finally {
    loading.value = false
  }
}

watch(() => route.params.id, (id) => id && load(id), { immediate: true })
</script>
