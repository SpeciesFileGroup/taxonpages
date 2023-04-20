<template>
  <VCard v-if="images.length">
    <VCardContent>
      <GalleryImage :images="images" />
    </VCardContent>
  </VCard>
</template>

<script setup>
import { computed, onServerPrefetch, onMounted } from 'vue'
import { useOtuStore } from '@/modules/otus/store/store'

const props = defineProps({
  otuId: {
    type: [String, Number],
    required: true
  }
})

const store = useOtuStore()
const images = computed(() => store.images || [])

onServerPrefetch(async () => {
  await store.loadImages(props.otuId)
})

onMounted(() => {
  if (!store.images) {
    store.loadImages(props.otuId)
  }
})
</script>
