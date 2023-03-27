<template>
  <button
    type="button"
    class="px-3 py-1 hover:bg-opacity-80"
    :class="{
      'bg-primary-color': primary,
      'bg-secondary-color': secondary,
      'text-primary-content': primary,
      'text-secondary-content': secondary
    }"
  >
    <slot />
  </button>
</template>

<script setup>
const props = defineProps({
  primary: {
    type: Boolean,
    default: false
  },

  secondary: {
    type: Boolean,
    default: false
  }
})
</script>
