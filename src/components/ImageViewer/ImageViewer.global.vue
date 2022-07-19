<template>
  <div 
    class="fixed z-[10000] h-full bg-opacity-90 bg-black overflow-y-hidden overflow-x-hidden w-full top-0 left-0 flex flex-col items-center justify-center backdrop-blur-md"
    @click="emit('close')"
  >
    <div 
      class="min-w-96 dark:bg-slate-900 rounded-lg shadow-sm mb-24"
      @click.stop
    >
      <div class="absolute rounded-t-lg w-auto max-h-full h-auto top-12 bottom-40 left-0 right-0 flex justify-center align-middle">
        <VSpinner v-if="isLoading" />
        <img
          ref="imageElement"
          class="mx-auto cursor-zoom-out w-auto max-w-full max-h-full h-auto my-auto"
          :src="image.original"
          @click="emit('close')"
        >

        <ControlNextImage
          v-if="next"
          class="right-0 absolute my-auto top-1/2 -translate-y-1/2"
          @click="emit('next')"
        />
        <ControlPreviousImage 
          v-if="previous"
          class="left-0 absolute my-auto top-1/2 -translate-y-1/2"
          @click="emit('previous')"
        />
      </div>
    </div>
    <div class="bottom-0 fixed overflow-x-auto max-w-full pb-2">
      <div 
        class="
        text-white
        text-sm
        attributions
        p-6
        align-middle
        flex
        justify-between
        flex-col
        text-center
        [text-shadow:0_1px_5px_rgba(0,0,0,1)]
      "
      >
        <ImageDepictions
          class="my-auto"
          :depictions="image.depictions" 
        />
        <ImageAttribution
          class="my-auto"
          :attribution="image.attribution"
        />
      </div>
      <GalleryThumbnailList
        :current="index"
        :images="images"
        @select-index="emit('selectIndex', $event)"
        @click.stop
      />
    </div>
    <ImageToolbar
      class="w-full absolute top-0 h-12 left-0"
    >
      <ImageViewerCounter
        :current-image="index"
        :total-images="images.length"
      />
    </ImageToolbar>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch, computed } from 'vue'
import ImageAttribution from './ImageAttribution.vue'
import ImageDepictions from './ImageDepictions.vue'
import ImageViewerCounter from './ImageViewerCounter.vue'
import ControlNextImage from './ControlImageNext.vue'
import ControlPreviousImage from './ControlImagePrevious.vue'
import GalleryThumbnailList from '@/components/Gallery/GalleryThumbnailList.vue'
import ImageToolbar from './ImageToolbar.vue'

const props = defineProps({
  index: {
    type: Object,
    required: true
  },

  images: {
    type: Array,
    default: () => []
  },

  next: {
    type: Boolean,
    default: false
  },

  previous: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'close',
  'previous',
  'next',
  'selectIndex'
])

const handleKeyboard = ({ key }) => {
  switch (key) {
    case 'ArrowLeft':
      if (props.previous) {
        emit('previous')
      }
      break;
    case 'ArrowRight':
      if (props.next) {
        emit('next')
      }
      break;
    case 'Escape':
      emit('close')
      break;
  }
}

const imageElement = ref(null)
const isLoading = ref(false)
const image = computed(() => props.images[props.index])

document.addEventListener('keyup', handleKeyboard)

onMounted(() => imageElement.value.addEventListener('load', () => isLoading.value = false))
onUnmounted(() => document.removeEventListener('keyup', handleKeyboard))

watch(
  () => props.index, 
  () => isLoading.value = true
)
</script>
