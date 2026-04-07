<template>
  <div class="flex flex-wrap gap-2">
    <GalleryThumbnailList
      :images="images"
      class="flex-row flex-wrap gap-2"
      @select-index="(index) => setCurrentImages(index)"
    />
    <ImageViewer
      v-if="isViewerVisible"
      :images="images"
      :index="currentIndex"
      :next="images.length - 1 > currentIndex"
      :previous="currentIndex > 0"
      @select-index="(index) => (currentIndex = index)"
      @next="() => currentIndex++"
      @previous="() => currentIndex--"
      @close="() => (isViewerVisible = false)"
    />
  </div>
</template>

<script setup>
import GalleryThumbnailList from '@/components/Gallery/GalleryThumbnailList.vue'
import { ref } from 'vue'

defineProps({
  images: {
    type: Array,
    required: true
  }
})

const isViewerVisible = ref(false)
const currentIndex = ref(0)

function setCurrentImages(index) {
  currentIndex.value = index
  isViewerVisible.value = true
}
</script>
