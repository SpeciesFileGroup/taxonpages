<template>
  <VCard>
    <div class="relative">
      <ClientOnly>
        <VSpinner v-if="isLoading" />
        <VMap
          class="h-96 max-h-96"
          dragging
          :zoom="zoom"
          :geojson="store.distribution.geojson"
          @geojson:ready="() => (isLoading = false)"
        />

        <VButton
          class="h-6 text-sm absolute right-3 top-3 z-[400]"
          primary
          @click="() => (isOtuSearchVisible = true)"
        >
          Search
        </VButton>

        <OtuSearch
          v-if="isOtuSearchVisible"
          :otu="otu"
          :shapes="store.distribution.geojson"
          @close="() => (isOtuSearchVisible = false)"
        />

        <CachedMap
          v-if="store.distribution.cachedMap"
          :cached-map="store.distribution.cachedMap"
        />
      </ClientOnly>
    </div>
    <div
      v-if="store.distribution.errorMessage"
      class="flex flex-row p-2 text-xs italic"
    >
      * {{ store.distribution.errorMessage }}
    </div>
    <div
      class="flex flex-row p-2 gap-2 text-xs"
      v-if="store.distribution.currentShapeTypes.length"
    >
      <div
        v-for="type in store.distribution.currentShapeTypes"
        :key="type"
        class="flex flex-row items-center"
      >
        <div
          class="w-3 h-3 m-1 rounded-sm"
          :class="LEGEND[type].background"
        />
        <span>{{ LEGEND[type].label }}</span>
      </div>
    </div>
  </VCard>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useOtuStore } from '@/modules/otus/store/store'
import CachedMap from './CachedMap.vue'
import OtuSearch from '../../Search/OtuSearch.vue'

const props = defineProps({
  otuId: {
    type: [String, Number],
    required: true
  },

  otu: {
    type: Object,
    required: true
  },

  taxon: {
    type: Object,
    required: true
  }
})

const zoom = 2
const isLoading = ref(true)
const isOtuSearchVisible = ref(false)
const store = useOtuStore()

const LEGEND = {
  AssertedDistribution: {
    label: 'Asserted distribution',
    background: 'bg-map-asserted'
  },
  Georeference: {
    label: 'Georeference',
    background: 'bg-map-georeference'
  },
  TypeMaterial: {
    label: 'Type material',
    background: 'bg-map-type-material'
  },
  CollectionObject: {
    label: 'Collection object',
    background: 'bg-map-collection-object'
  },
  Aggregate: {
    label: 'Aggregate (Asserted distribution & Georeference)',
    background: 'bg-map-aggregate'
  }
}

onMounted(() => {
  isLoading.value = true

  store.loadDistribution({
    otuId: props.otuId,
    rankString: props.taxon.rank_string
  })
})
</script>
