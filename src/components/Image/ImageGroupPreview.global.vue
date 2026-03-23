<template>
  <div class="flex flex-row w-full max-w-sm gap-1">
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
          :class="imageClass"
          @load="(e) => onImageLoad(e, index)"
        />

        <div
          v-if="showOverlay && index === visibleImages.length - 1"
          class="absolute bottom-0 right-0 px-1 rounded-tl-lg bg-black/30 text-white"
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
  images: {
    type: Array,
    required: true
  },

  maxVisible: {
    type: Number,
    default: 4
  },

  imageClass: {
    type: String,
    default: 'w-auto h-full object-cover'
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
