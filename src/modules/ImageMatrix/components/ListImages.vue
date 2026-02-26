<template>
  <ImageGrid
    v-if="images.length"
    :max-visible="1"
    :images="[...images.map((i) => i.thumb)]"
    @select="
      ({ index }) => {
        galleryIndex = index
        isImageViewerOpen = true
      }
    "
  />

  <ImageViewer
    v-if="isImageViewerOpen"
    :index="galleryIndex"
    :images="images"
    :next="galleryIndex < props.images.length - 1"
    :previous="galleryIndex > 0"
    @select-index="galleryIndex = $event"
    @next="nextImage()"
    @previous="previousImage()"
    @close="isImageViewerOpen = false"
  />
</template>

<script setup>
import { ref, watch } from 'vue'
import ImageGrid from './ImageGrid.vue'

const props = defineProps({
  images: {
    type: Array,
    default: () => []
  }
})

const isImageViewerOpen = ref(false)
const galleryIndex = ref(0)

const previousImage = () => {
  galleryIndex.value--
}

const nextImage = () => {
  galleryIndex.value++
}

watch(
  () => props.images,
  () => {
    galleryIndex.value = 0
  },
  { immediate: true }
)
</script>
