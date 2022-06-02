<template>
  <div 
    class="fixed image__viewer bg-opacity-50 bg-black overflow-y-hidden overflow-x-hidden w-full h-full top-0 left-0 flex items-center justify-center"
    @click="emit('close')"
  >
    <div 
      class="container bg-white relative max-h-full w-full md:h-auto rounded-lg shadow-sm"
      @click.stop
    >
      <VSpinner v-if="isLoading" />
      <div class="relative p-4 rounded-t-lg">
        <img
          ref="imageElement"
          class="mx-auto cursor-zoom-out max-w-7 w-auto max-w-full max-h-[80vh]"
          :src="image.original"
          @click="emit('close')"
        >
      </div>

      <div class="bg-white attributions bottom-0 h-24 p-4 rounded-b-lg align-middle flex justify-between flex-col text-center">
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
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import ImageAttribution from './ImageAttribution.vue';
import ImageDepictions from './ImageDepictions.vue';
import ControlNextImage from './ControlImageNext.vue'
import ControlPreviousImage from './ControlImagePrevious.vue'

const props = defineProps({
  image: {
    type: Object,
    required: true
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
  'next'
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

document.addEventListener('keyup', handleKeyboard)

onMounted(() => imageElement.value.addEventListener('load', () => isLoading.value = false))
onUnmounted(() => document.removeEventListener('keyup', handleKeyboard))

watch(
  () => props.image, 
  () => isLoading.value = true
)
</script>

<style>
.image__viewer {
  z-index: 10000;
}
</style>