<template>
  <button
    type="button"
    :class="[
      'tp-button',
      'transition-colors duration-150',
      'cursor-pointer',
      variantClasses,
      sizeClasses,
      circle ? 'rounded-full' : radiusClass
    ]"
  >
    <slot />
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (v) =>
      ['primary', 'secondary', 'danger', 'success', 'warning'].includes(v)
  },

  outline: {
    type: Boolean,
    default: false
  },

  ghost: {
    type: Boolean,
    default: false
  },

  size: {
    type: String,
    default: 'md',
    validator: (v) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(v)
  },

  circle: {
    type: Boolean,
    default: false
  }
})

const variantClasses = computed(() => {
  if (props.ghost) {
    const ghostVariants = {
      primary:
        'bg-transparent hover:bg-primary/10 text-primary hover:text-primary border border-transparent',
      secondary:
        'bg-transparent hover:bg-secondary/10 text-secondary hover:text-secondary border border-transparent',
      success:
        'bg-transparent hover:bg-success/10 text-success hover:text-success border border-transparent',
      warning:
        'bg-transparent hover:bg-warning/10 text-warning hover:text-warning border border-transparent',
      danger:
        'bg-transparent hover:bg-danger/10 text-danger hover:text-danger border border-transparent'
    }

    return ghostVariants[props.variant]
  }

  if (props.outline) {
    const outlineVariants = {
      primary:
        'bg-transparent hover:bg-primary/10 text-primary border border-primary',
      secondary:
        'bg-transparent hover:bg-secondary/10 text-secondary border border-secondary',
      success:
        'bg-transparent hover:bg-success/10 text-success border border-success',
      warning:
        'bg-transparent hover:bg-warning/10 text-warning border border-warning',
      danger:
        'bg-transparent hover:bg-danger/10 text-danger border border-danger'
    }

    return outlineVariants[props.variant]
  }

  const solidVariants = {
    primary:
      'bg-primary hover:bg-primary/85 active:bg-primary/75 text-primary-content border border-transparent',
    secondary:
      'bg-secondary hover:bg-secondary/85 active:bg-secondary/75 text-secondary-content border border-transparent',
    success:
      'bg-success hover:bg-success/85 active:bg-success/75 text-white border border-transparent',
    warning:
      'bg-warning hover:bg-warning/85 active:bg-warning/75 text-white border border-transparent',
    danger:
      'bg-danger hover:bg-danger/85 active:bg-danger/75 text-white border border-transparent'
  }

  return solidVariants[props.variant]
})

const sizeClasses = computed(() => {
  if (props.circle) {
    const circleSizes = {
      xs: 'p-1 text-xs',
      sm: 'p-1.25 text-sm leading-tight',
      md: 'p-1.5 text-sm',
      lg: 'p-2 text-sm',
      xl: 'p-2.5 text-sm leading-tight'
    }

    return circleSizes[props.size]
  }

  const sizes = {
    xs: 'px-1.5 py-1 text-xs',
    sm: 'px-2 py-1.25 text-sm leading-tight',
    md: 'px-2.5 py-1.5 text-sm',
    lg: 'px-3 py-2 text-sm',
    xl: 'px-3.5 py-2.5 text-sm leading-tight'
  }

  return sizes[props.size]
})

const radiusClass = computed(() => {
  const radii = {
    xs: 'rounded',
    sm: 'rounded-md',
    md: 'rounded-md',
    lg: 'rounded-md',
    xl: 'rounded-lg'
  }

  return radii[props.size]
})
</script>
