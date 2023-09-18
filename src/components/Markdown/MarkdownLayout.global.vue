<template>
  <component
    :is="tag"
    :class="layoutClasses"
  >
    <slot />
  </component>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  tag: {
    type: String,
    default: 'div'
  },

  frontmatter: {
    type: Object,
    required: true
  }
})

const LAYOUT_CLASSES = {
  fullwidth: 'p-4 sm:px-0 prose dark:prose-invert max-w-none',
  blank: 'sm:px-0 prose dark:prose-invert max-w-none'
}

const DEFAULT_LAYOUT =
  '!container mx-auto p-4 sm:px-0 prose dark:prose-invert box-border'

const layoutClasses = computed(
  () => LAYOUT_CLASSES[props.frontmatter.layout] || DEFAULT_LAYOUT
)
</script>
