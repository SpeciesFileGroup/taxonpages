<template>
  <div
    ref="root"
    class="w-screen h-screen fixed top-0 left-0 z-[5000]"
  >
    <VSpinner v-if="isLoading" />
    <SearchBar
      :label="otu.object_tag"
      @search="loadOTUs"
      @close="() => emit('close')"
    />
    <div class="relative">
      <VMap
        ref="mapRef"
        class="w-screen h-screen"
        controls
        :dragging="!shapes"
        :disable-zoom="!!shapes"
        :zoom-bounds="6"
        :geojson="shapes"
        @add:layer="setLayer"
        @edit:layer="setLayer"
        @drag:layer="setLayer"
        @draw:start="() => (geojson = {})"
        :zoom="4"
      />
      <div
        class="h-screen md:w-96 absolute top-0 bg-base-background z-[2000] overflow-auto ease-in-out duration-300 w-full"
        :class="{
          'md:-right-96 -right-full': !isTableVisible,
          'right-0': isTableVisible
        }"
      >
        <ListResults
          v-if="isTableVisible"
          :list="list"
          @close="() => emit('close')"
          @close:table="() => (isTableVisible = false)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import TaxonWorks from '../../services/TaxonWorks'
import SearchBar from './SearchBar.vue'
import ListResults from './ListResults.vue'

const props = defineProps({
  otu: {
    type: Array,
    default: () => []
  },

  shapes: {
    type: Object,
    default: undefined
  }
})

const root = ref()
const emit = defineEmits(['close'])
const geoJson = ref({})
const mapRef = ref(null)
const list = ref([])
const isTableVisible = ref(false)
const isLoading = ref()

onMounted(() => {
  document.addEventListener('keyup', handleKeyboard)
  document.body.classList.add('overflow-hidden')
})

onUnmounted(() => {
  document.removeEventListener('keyup', handleKeyboard)
  document.body.classList.remove('overflow-hidden')
})

const handleKeyboard = ({ key }) => {
  switch (key) {
    case 'Escape':
      emit('close')
      break
  }
}

function setLayer(geojsonLayer) {
  geoJson.value = JSON.stringify(geojsonLayer.geometry)
}

function loadOTUs() {
  const payload = {
    geo_json: geoJson.value,
    taxon_name_id: [props.otu.taxon_name_id],
    descendants: true
  }

  isLoading.value = true

  TaxonWorks.getOtus(payload)
    .then(({ data }) => {
      list.value = data
      isTableVisible.value = true
    })
    .finally((_) => {
      isLoading.value = false
    })
}
</script>
