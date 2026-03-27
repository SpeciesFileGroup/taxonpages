<template>
  <button
    type="button"
    :class="[
      'tp-button',
      'inline-flex items-center justify-center gap-1.5',
      'px-3 py-1',
      'text-sm',
      'transition-colors duration-150',
      'cursor-pointer',
      circle ? 'rounded-full' : 'rounded-md',
      {
        'bg-primary hover:bg-primary/85 active:bg-primary/75': primary,
        'bg-secondary hover:bg-secondary/85 active:bg-secondary/75': secondary,
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
