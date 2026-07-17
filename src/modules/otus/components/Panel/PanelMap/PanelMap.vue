<template>
  <VCard>
    <ClientOnly>
      <VSpinner v-if="isLoading" />
      <div class="relative">
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
          size="sm"
          class="absolute right-3 top-3 z-400"
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
      </div>

      <div
        v-if="store.distribution.errorMessage"
        class="flex flex-row p-2 text-xs italic"
      >
        * {{ store.distribution.errorMessage }}
      </div>
      <div
        class="flex flex-row p-2 gap-2 text-xs items-center"
        v-else-if="
          store.distribution.currentShapeTypes.length || absences !== 'off'
        "
      >
        <div
          v-for="type in store.distribution.currentShapeTypes"
          :key="type"
          class="flex flex-row items-center"
        >
          <div
            :class="[
              'w-3',
              'h-3',
              'm-1',
              'rounded-sm',
              LEGEND[type].background
            ]"
          />
          <span>{{ $t(LEGEND[type].labelKey) }}</span>
        </div>
        <VToggle
          v-if="absences !== 'off'"
          v-model="showAbsences"
          size="sm"
          class="ml-auto"
          :disabled="isLoadingAbsent"
        >
          <span class="text-xs">{{
            isLoadingAbsent ? $t('panel.map.loading') : $t('panel.map.absences')
          }}</span>
        </VToggle>
      </div>
    </ClientOnly>
    <DwcTable ref="dwcTableRef" />
  </VCard>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useDistributionStore } from './store/useDistributionStore.js'
import { makeClusterIconFor } from './clusters'
import { useGeojsonOptions } from './composables/useGeojsonOptions.js'
import { LEGEND } from './constants'
import MapPopup from './components/Popup/MapPopup.vue'
import CachedMap from './components/CachedMap.vue'
import OtuSearch from './components/Search/OtuSearch.vue'
import DwcTable from './components/DwcModal/DwcTable.vue'

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
  },

  absences: {
    type: String,
    default: 'auto',
    validator: (v) => ['off', 'manual', 'auto'].includes(v)
  }
})

const zoom = 2
const isLoading = ref(true)
const isOtuSearchVisible = ref(false)
const dwcTableRef = ref(null)
const store = useDistributionStore()
const popupElement = ref(null)
const { popupItem, geojsonOptions } = useGeojsonOptions({ popupElement })
const SHOW_ABSENCES_KEY = 'panel:map:show-absences'

function readStoredShowAbsences() {
  if (typeof sessionStorage === 'undefined') return null
  const value = sessionStorage.getItem(SHOW_ABSENCES_KEY)
  return value === null ? null : value === 'true'
}

const stored = readStoredShowAbsences()
const showAbsences = ref(
  props.absences === 'off'
    ? false
    : stored !== null
      ? stored
      : props.absences === 'auto'
)
const isLoadingAbsent = ref(false)

watch(showAbsences, async (visible) => {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(SHOW_ABSENCES_KEY, String(visible))
  }

  if (!visible) {
    store.hideAbsences()
    return
  }

  isLoadingAbsent.value = true
  try {
    await store.showAbsences(props.otuId)
  } finally {
    isLoadingAbsent.value = false
  }
})

onMounted(() => {
  isLoading.value = true

  store.loadDistribution({
    otuId: props.otuId,
    rankString: props.taxon.rank_string,
    withAbsences: showAbsences.value
  })
})

onBeforeUnmount(() => {
  store.resetRequest()
  store.$reset()
})
</script>
