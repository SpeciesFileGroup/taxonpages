<template>
  <div class="flex flex-col">
    <div class="flex justify-center bg-white border print:hidden">
      <div class="h-80 max-h-80 flex items-center justify-center">
        <img
          class="max-h-80 h-max w-100 cursor-zoom-in m-auto"
          :src="currentImage.original"
          @click="isImageViewerOpen = true"
        >
      </div>
    </div>
    <div class="flex flex-row overflow-x-auto print:flex-wrap">
      <div 
        v-for="(image, index) in images"
        :key="image.id"
      >
        <GalleryThumbnail
          :image="image"
          :title="image.depictions.map(d => d.label).join(';')"
          @click="
            galleryIndex = index;
            isImageViewerOpen = true
          "
        />
      </div>
    </div>
  </div>

  <ImageViewer 
    v-if="isImageViewerOpen"
    :image="currentImage"
    :next="galleryIndex < (props.images.length - 1)"
    :previous="galleryIndex > 0"
    @next="nextImage()"
    @previous="previousImage()"
    @close="isImageViewerOpen = false"
  />
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import GalleryThumbnail from './GalleryThumbnail.vue'
import ImageViewer from './ImageViewer.vue';

const props = defineProps({
  images: {
    type: Array,
    default: () => []
  }
})

const isImageViewerOpen = ref(false)
const galleryIndex = ref(0)
const currentImage = computed(() => props.images[galleryIndex.value] || {})

const previousImage = () => { galleryIndex.value-- }
const nextImage = () => { galleryIndex.value++ }

watch(
  () => props.images, 
  () => { galleryIndex.value = 0 }, 
  { immediate: true }
)
</script>