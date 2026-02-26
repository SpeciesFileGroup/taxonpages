<template>
  <div
    :class="containerClass"
    class="gap-1 w-full max-w-sm"
  >
    <template
      v-for="(image, index) in visibleImages"
      :key="index"
    >
      <div
        :class="itemClass(index)"
        class="relative overflow-hidden rounded-lg w-fit h-fit cursor-pointer"
        @click="() => $emit('select', { image, index })"
      >
        <img
          :src="image"
          alt=""
          class="w-auto h-full object-contain"
          @load="(e) => onImageLoad(e, index)"
        />

        <div
          v-if="showOverlay && index === visibleImages.length - 1"
          class="absolute bottom-0 right-0 px-1 flex items-center text-xs justify-cente rounded-tl-lg bg-black/30 text-white"
        >
          +{{ remainingCount }}
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  images: Array,
  maxVisible: {
    type: Number,
    default: 4
  }
})

const emit = defineEmits(['select'])

const orientations = ref([])

const visibleImages = computed(() => props.images.slice(0, props.maxVisible))
const remainingCount = computed(() => props.images.length - props.maxVisible)
const showOverlay = computed(() => props.images.length > props.maxVisible)

const onImageLoad = (event, index) => {
  const { naturalWidth, naturalHeight } = event.target
  orientations.value[index] =
    naturalWidth > naturalHeight
      ? 'landscape'
      : naturalWidth < naturalHeight
        ? 'portrait'
        : 'square'
}

const dominantOrientation = computed(() => {
  const landscape = orientations.value.filter((o) => o === 'landscape').length
  const portrait = orientations.value.filter((o) => o === 'portrait').length

  return landscape > portrait ? 'landscape' : 'portrait'
})

const containerClass = computed(() => {
  const count = visibleImages.value.length

  if (count === 1) return ''

  if (count === 2) {
    return dominantOrientation.value === 'landscape'
      ? 'grid grid-cols-1 grid-rows-2'
      : 'grid grid-cols-2'
  }

  return 'grid grid-cols-2 grid-rows-2'
})

const itemClass = (index) => {
  if (visibleImages.value.length === 3) {
    if (dominantOrientation.value === 'landscape') {
      if (index === 0) return 'col-span-2'
    } else {
      if (index === 0) return 'row-span-2'
    }
  }
  return ''
}
</script>
