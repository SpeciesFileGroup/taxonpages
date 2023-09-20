<template>
  <div
    class="grid gap-2"
    :class="!props.wrap && 'grid-flow-col'"
    :style="
      props.wrap &&
      `grid-template-columns: repeat(auto-fit, minmax(${props.imageWidth}, 1fr))`
    "
  >
    <component
      v-for="item in depictions"
      :key="item.id"
      :is="getTagElement(item)"
      :to="{
        name: 'otus-id',
        params: { id: item.objectId }
      }"
    >
      <img
        :src="item.imageMedium"
        :style="imageStyle"
        class="max-w-full my-0 object-cover w-full"
      />
      <span
        v-if="label"
        class="text-sm"
        v-html="item.labelAttribution"
      />
    </component>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGallery } from '../useGallery.js'

const props = defineProps({
  depictionId: {
    type: Array,
    default: () => []
  },

  imageHeight: {
    type: String,
    default: '112px'
  },

  imageWidth: {
    type: String,
    default: '200px'
  },

  wrap: {
    type: Boolean,
    default: false
  },

  label: {
    type: Boolean,
    default: false
  }
})

const imageStyle = computed(() => ({
  height: props.imageHeight
}))

function getTagElement(depiction) {
  return depiction.objectType === 'Otu' ? 'RouterLink' : 'div'
}

const { depictions } = useGallery({ props })
</script>
