<template>
  <button
    type="button"
    :class="[
      'tp-button',
      'px-3',
      'py-1',
      circle ? 'rounded-full ' : 'rounded-md',
      'hover:bg-opacity-80',
      {
        'bg-primary-color': primary,
        'bg-secondary-color': secondary,
        'text-primary-content': primary,
        'text-secondary-content': secondary
      }
    ]"
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
  },

  circle: {
    type: Boolean,
    default: false
  }
})
</script>
