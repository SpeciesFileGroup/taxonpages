<template>
  <GalleryThumbnailList
    :images="images"
    @select-index="
      (index) => {
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
import { ref, computed, watch } from 'vue'
import GalleryThumbnailList from '@/components/Gallery/GalleryThumbnailList.vue'

const props = defineProps({
  images: {
    type: Array,
    default: () => []
  }
})

const isImageViewerOpen = ref(false)
const galleryIndex = ref(0)
const currentImage = computed(() => props.images[galleryIndex.value] || {})

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
