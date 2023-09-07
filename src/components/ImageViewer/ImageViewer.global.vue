<template>
  <div
    class="fixed z-[10000] h-full overflow-y-hidden overflow-x-hidden w-full top-0 left-0 flex flex-col items-center justify-center backdrop-blur-md bg-base-foreground"
  >
    <div
      class="min-w-96 dark:bg-slate-900 rounded-lg shadow-sm mb-24"
      @click.stop
    >
      <div
        class="absolute rounded-t-lg w-auto max-h-full h-auto top-12 bottom-44 left-0 right-0 flex justify-center align-middle"
      >
        <VSpinner v-if="isLoading" />
        <div
          class="flex flex-col justify-center"
          v-if="errorMessage"
          v-text="errorMessage"
        />
        <img
          v-show="!errorMessage"
          ref="imageElement"
          class="mx-auto cursor-zoom-out w-auto max-w-full max-h-full h-auto my-auto"
          :alt="image.depictions.map((d) => d.label).join(';')"
          :src="image.original"
          @click="emit('close')"
        />

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
    <div class="bottom-0 fixed max-w-full w-full">
      <div
        class="text-base-content text-sm attributions p-6 align-middle flex justify-between flex-col text-center"
      >
        <ImageDepictions
          class="my-auto"
          :depictions="image.depictions"
        />
        <ImageAttribution
          class="my-auto"
          :attribution="image.attribution"
        />
        <ImageSource
          class="my-auto"
          :source="image.source"
        />
      </div>
      <div class="flex justify-center">
        <GalleryThumbnailList
          class="pb-2"
          :current="index"
          :images="images"
          @select-index="emit('selectIndex', $event)"
          @click.stop
        />
      </div>
    </div>
    <ImageToolbar class="w-full absolute top-0 h-12 left-0 items-center">
      <ImageViewerCounter
        :current-image="index"
        :total-images="images.length"
      />
      <template #right>
        <ImageViewerClose @click="emit('close')" />
      </template>
    </ImageToolbar>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch, computed } from 'vue'
import ImageAttribution from './ImageAttribution.vue'
import ImageDepictions from './ImageDepictions.vue'
import ImageSource from './ImageSource.vue'
import ImageViewerCounter from './ImageViewerCounter.vue'
import ControlNextImage from './ControlImageNext.vue'
import ControlPreviousImage from './ControlImagePrevious.vue'
import GalleryThumbnailList from '@/components/Gallery/GalleryThumbnailList.vue'
import ImageToolbar from './ImageToolbar.vue'
import ImageViewerClose from './ImageViewerClose.vue'

const props = defineProps({
  index: {
    type: Number,
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

const emit = defineEmits(['close', 'previous', 'next', 'selectIndex'])

const handleKeyboard = ({ key }) => {
  switch (key) {
    case 'ArrowLeft':
      if (props.previous) {
        emit('previous')
      }
      break
    case 'ArrowRight':
      if (props.next) {
        emit('next')
      }
      break
    case 'Escape':
      emit('close')
      break
  }
}

const imageElement = ref(null)
const isLoading = ref(false)
const errorMessage = ref(null)
const image = computed(() => props.images[props.index])

document.addEventListener('keyup', handleKeyboard)

function handleError() {
  isLoading.value = false
  errorMessage.value = 'Image was not found or format is not supported'
}

function handleLoad() {
  isLoading.value = false
}

onMounted(() => {
  imageElement.value.addEventListener('load', handleLoad)
  imageElement.value.addEventListener('error', handleError)
  document.body.classList.add('overflow-hidden')
})

onUnmounted(() => {
  document.removeEventListener('keyup', handleKeyboard)
  document.body.classList.remove('overflow-hidden')
})

watch(
  () => props.index,
  () => {
    errorMessage.value = null
    isLoading.value = true
  }
)
</script>
