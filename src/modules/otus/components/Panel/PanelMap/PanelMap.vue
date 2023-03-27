<template>
  <VCard>
    <VSpinner v-if="isLoading" />
    <div class="relative">
      <VMap
        ref="map"
        class="h-96 max-h-96"
        dragging
        :zoom="zoom"
        :geojson="geojson"
        @geojson:ready="isLoading = false"
      />

      <VButton
        class="h-6 text-sm absolute right-3 top-3 z-[3000]"
        primary
        @click="() => (isOtuSearchVisible = true)"
      >
        Search
      </VButton>
      <OtuSearch
        v-if="isOtuSearchVisible"
        :otu="otu"
        :shapes="geojson"
        @close="() => (isOtuSearchVisible = false)"
      />
    </div>
    <div
      v-if="false"
      class="text-sm flex flex-row justify-around"
    >
      <div class="flex flex-row items-center p-2">
        <div class="w-3 h-3 bg-map-georeference m-1" />
        <span>Georeference</span>
      </div>
      <div class="flex flex-row items-center p-2">
        <div class="w-3 h-3 m-1 bg-map-asserted" />
        <span>Asserted distribution</span>
      </div>
    </div>
  </VCard>
</template>

<script setup>
import { ref, watch } from 'vue'
import TaxonWorks from '../../../services/TaxonWorks'
import OtuSearch from '../../Search/OtuSearch.vue'

const props = defineProps({
  otuId: {
    type: [String, Number],
    required: true
  },

  otu: {
    type: Object,
    required: true
  }
})

const zoom = 2
const geojson = ref(undefined)
const isLoading = ref(true)
const isOtuSearchVisible = ref(false)

watch(
  () => props.otuId,
  (newId, oldId) => {
    if (newId === oldId) return
    isLoading.value = true

    TaxonWorks.getOtuDistribution(props.otuId).then(({ data }) => {
      geojson.value = data.request_too_large ? null : data
    })
  },
  { immediate: true }
)
</script>
