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
  }
})

const store = useImageStore()
const images = computed(() => store.images || [])

onServerPrefetch(async () => {
  await store.loadImages(props.otuId)
})

onMounted(() => {
  if (!store.images) {
    store.loadImages(props.otuId)
  }
})

onBeforeUnmount(() => {
  store.resetRequest()
  store.$reset()
})
</script>
