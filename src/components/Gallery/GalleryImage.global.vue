<template>
  <div class="flex flex-col">
    <div
      class="flex justify-center border print:hidden bg-base-0 border-base-muted"
    >
      <GalleryMainImage
        :image="currentImage"
        @open:viewer="() => (isImageViewerOpen = true)"
      />
    </div>
    <GalleryThumbnailList
      class="pt-2 pb-2"
      :images="images"
      @select-index="
        ($event) => {
          galleryIndex = $event
        }
      "
    />
  </div>

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
import GalleryThumbnailList from './GalleryThumbnailList.vue'
import GalleryMainImage from './GalleryMainImage.vue'

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
