<template>
  <VCard v-if="images.length">
    <VCardContent>
      <GalleryImage :images="images" />
    </VCardContent>
  </VCard>
</template>

<script setup>
import { computed, onServerPrefetch, onMounted, onBeforeUnmount } from 'vue'
import { useImageStore } from '../../../store/useImageStore'

const props = defineProps({
  otuId: {
    type: [String, Number],
    required: true
  },

  taxon: {
    type: Object,
    default: undefined
  },

  sort_order: {
    type: [Array],
    default: () => []
  }
})

const store = useImageStore()
const images = computed(() => store.images || [])
const coordinateOtus = computed(() => props.taxon?.is_valid !== false)

onServerPrefetch(async () => {
  await store.loadImages(props.otuId, {
    sortOrder: props.sortOrder,
    coordinateOtus: coordinateOtus.value
  })
})

onMounted(() => {
  if (!store.images) {
    store.loadImages(props.otuId, {
      sortOrder: props.sort_order,
      coordinateOtus: coordinateOtus.value
    })
  }
})

onBeforeUnmount(() => {
  store.resetRequest()
  store.$reset()
})
</script>
