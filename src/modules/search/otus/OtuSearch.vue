<template>
  <div
    ref="root"
    class="w-screen h-screen fixed top-0 left-0 z-[5000]"
  >
    <SearchBar @search="loadOTUs" />
    <div class="relative">
      <VMap
        class="w-screen h-screen"
        controls
        @geojson="
          ($event) =>
            (parameters.geo_json = JSON.stringify(
              $event.features.map((feature) => feature.geometry)[0]
            ))
        "
        :zoom="4"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { makeAPIRequest } from '@/utils/request'
import SearchBar from './SearchBar.vue'

const root = ref()
const emit = defineEmits(['close'])
const parameters = ref({})

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

function loadOTUs() {
  makeAPIRequest.get('/otus.json', { params: parameters.value })
}
</script>
