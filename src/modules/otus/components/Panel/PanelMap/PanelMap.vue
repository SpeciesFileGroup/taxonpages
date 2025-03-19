<template>
  <VCard>
    <div class="relative">
      <ClientOnly>
        <VSpinner v-if="isLoading" />
        <VMap
          class="h-96 max-h-96"
          dragging
          :cluster="cluster"
          :zoom="zoom"
          :zoom-bounds="8"
          :geojson="store.distribution.geojson"
          :cluster-icon-create-function="makeClusterIconFor"
          :geojson-options="geojsonOptions"
          @geojson:ready="() => (isLoading = false)"
        />
        <div ref="popupElement">
          <MapPopup
            v-if="popupItem"
            :items="popupItem.base"
            @selected="dwcTableRef.show"
          />
        </div>
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
          :class="['w-3', 'h-3', 'm-1', 'rounded-sm', LEGEND[type].background]"
        />
        <span>{{ LEGEND[type].label }}</span>
      </div>
    </div>
    <DwcTable ref="dwcTableRef" />
  </VCard>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useDistributionStore } from './store/useDistributionStore.js'
import { makeClusterIconFor } from './clusters'
import { useGeojsonOptions } from './composables/useGeojsonOptions.js'
import { LEGEND } from './constants'
import MapPopup from './components/MapPopup.vue'
import CachedMap from './components/CachedMap.vue'
import OtuSearch from './components/Search/OtuSearch.vue'
import DwcTable from './components/DwcTable.vue'

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
  },

  cluster: {
    type: Boolean,
    default: true
  }
})

const zoom = 2
const isLoading = ref(true)
const isOtuSearchVisible = ref(false)
const dwcTableRef = ref(null)
const store = useDistributionStore()
const popupElement = ref(null)
const { popupItem, geojsonOptions } = useGeojsonOptions({ popupElement })

onMounted(() => {
  isLoading.value = true

  store.loadDistribution({
    otuId: props.otuId,
    rankString: props.taxon.rank_string
  })
})

onBeforeUnmount(() => {
  store.resetRequest()
  store.$reset()
})
</script>
