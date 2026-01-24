<template>
  <div
    class="flex flex-row overflow-x-auto print:flex-wrap gap-1.5"
    tabindex="0"
  >
    <div
      v-for="(image, index) in images"
      :key="image.id"
    >
      <GalleryThumbnail
        :image="image"
        :class="{ 'border border-secondary-color': current === index }"
        :title="image.depictions?.map((d) => d.label).join(';')"
        @click="emit('selectIndex', index)"
      />
    </div>
  </div>
</template>

<script setup>
import GalleryThumbnail from './GalleryThumbnail.vue'

defineProps({
  images: {
    type: Array,
    default: () => []
  },
  current: {
    type: Number,
    default: undefined
  }
})

const emit = defineEmits(['selectIndex'])
</script>
