<template>
  <VCard>
    <VSpinner v-if="isLoading" />
    <VMap
      ref="map"
      class="h-96 max-h-96"
      :zoom="zoom"
      :geojson="geojson"
      @geojson:ready="isLoading = false"
    />
  </VCard>
</template>

<script setup>
import { ref, watch } from "vue"
import OtuService from "../services/OtuService"

const props = defineProps({
  otuId: {
    type: [String, Number],
    required: true
  }
})

const zoom = 2
const geojson = ref(undefined)
const isLoading = ref(true)

watch(
  () => props.otuId,
  (newId, oldId) => {
    if(newId === oldId) return
    isLoading.value = true

    OtuService.getGeoJSON(props.otuId).then(({ data }) => {
      geojson.value = data.request_too_large
        ? null
        : data
    })
  },
  { immediate: true }
)

</script>
