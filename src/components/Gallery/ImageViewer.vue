<template>
  <div 
    class="fixed z-[10000] bg-opacity-60 bg-black overflow-y-hidden overflow-x-hidden w-full h-full top-0 left-0 flex flex-col items-center justify-center backdrop-blur-md"
    @click="emit('close')"
  >
    <div 
      class="min-w-96 dark:bg-slate-900 relative rounded-lg shadow-sm mb-24"
      @click.stop
    >
      <VSpinner v-if="isLoading" />
      <div class="relative rounded-t-lg w-auto bg-white">
        <img
          ref="imageElement"
          class="mx-auto cursor-zoom-out max-w-7 w-auto max-w-full max-h-[70vh]"
          :src="image.original"
          @click="emit('close')"
        >
      </div>

      <div 
        class="
        bg-white
        dark:bg-slate-900
        dark:text-white
        attributions
        bottom-0
        h-24
        p-4
        rounded-b-lg
        align-middle
        flex
        justify-between
        flex-col
        text-center"
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
    <GalleryThumbnailList
      class="bottom-0 fixed overflow-x-auto max-w-full pb-2"
      :current="index"
      :images="images"
      @select-index="emit('selectIndex', $event)"
      @click.stop
    />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch, computed } from 'vue'
import ImageAttribution from './ImageAttribution.vue';
import ImageDepictions from './ImageDepictions.vue';
import ControlNextImage from './ControlImageNext.vue'
import ControlPreviousImage from './ControlImagePrevious.vue'

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
