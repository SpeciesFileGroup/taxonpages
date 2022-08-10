<template>
  <div class="flex flex-row overflow-x-auto print:flex-wrap">
    <div 
      v-for="(image, index) in images"
      :key="image.id"
      class="
        pr-1.5
        last:pr-0"
    >
      <GalleryThumbnail
        :image="image"
        :class="{ 'border-2 border-secondary-color': current === index }"
        :title="image.depictions.map(d => d.label).join(';')"
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