<template>
  <div class="flex flex-row overflow-x-auto print:flex-wrap gap-1.5">
    <div
      v-for="(image, index) in images"
      :key="image.id"
    >
      <GalleryThumbnail
        :image="image"
        :class="{ 'border border-secondary-color': current === index }"
        :title="image.depictions?.map((d) => d.label).join(';')"
        tabindex="0"
        @keydown.enter="() => emit('selectIndex', index)"
        @click="() => emit('selectIndex', index)"
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
