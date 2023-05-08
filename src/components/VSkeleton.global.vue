<template>
  <slot />
  <span
    v-if="isEmpty"
    :class="class"
  >
    <span
      v-for="line in lines"
      :key="line"
      class="inline-block w-full rounded-sm bg-gray-100 leading-5"
    >
      &zwnj;
    </span>
  </span>
</template>

<script setup>
import { useAttrs, useSlots, computed } from 'vue'

const props = defineProps({
  class: {
    type: String,
    default: 'w-full'
  },

  lines: {
    type: Number,
    default: 1
  }
})

const slots = useSlots()
const attrs = useAttrs()

const isEmpty = computed(() => {
  const children = slots.default?.()

  return isEmptyVNode(children)
})

function isEmptyVNode(children) {
  if (!children) return true

  const [firstNode] = children
  let str = firstNode.children

  return firstNode.el || str
}
</script>
