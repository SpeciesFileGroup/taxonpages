<template>
  <button
    type="button"
    :class="[
      'tp-button',
      'px-3',
      'py-1',
      circle ? 'rounded-full ' : 'rounded-md',
      {
        'bg-primary-color hover:bg-primary-color/80': primary,
        'bg-secondary-color hover:bg-secondary-color/80': secondary,
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
