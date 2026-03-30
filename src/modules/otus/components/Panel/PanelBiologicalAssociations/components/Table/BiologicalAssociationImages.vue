<template>
  <ImageGroupPreview
    :images="images.map((d) => d.thumb)"
    :max-visible="1"
    image-class="min-w-12 h-full object-cover"
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
    @select-index="(index) => (galleryIndex = index)"
    @next="nextImage()"
    @previous="previousImage()"
    @close="isImageViewerOpen = false"
  />
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  images: {
    type: Array,
    required: true
  }
})

const isImageViewerOpen = ref(false)
const galleryIndex = ref(0)

function previousImage() {
  galleryIndex.value--
}

function nextImage() {
  galleryIndex.value++
}
</script>
