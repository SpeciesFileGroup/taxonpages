<template>
  <span
    :class="[
      'inline-flex items-center inset-ring',
      shapeClass,
      colorClass,
      sizeClass,
      weightClass
    ]"
  >
    <slot />
  </span>
</template>

<script>
const COLOR_CLASSES = {
  primary: 'bg-primary/10 text-primary inset-ring-primary/20',
  secondary: 'bg-secondary/10 text-secondary inset-ring-secondary/20',
  gray:
    'bg-gray-50 text-gray-600 inset-ring-gray-500/10 dark:bg-gray-400/10 dark:text-gray-400 dark:inset-ring-gray-400/20',
  red:
    'bg-red-50 text-red-700 inset-ring-red-600/10 dark:bg-red-400/10 dark:text-red-400 dark:inset-ring-red-400/20',
  yellow:
    'bg-yellow-50 text-yellow-800 inset-ring-yellow-600/20 dark:bg-yellow-400/10 dark:text-yellow-500 dark:inset-ring-yellow-400/20',
  green:
    'bg-green-50 text-green-700 inset-ring-green-600/20 dark:bg-green-400/10 dark:text-green-400 dark:inset-ring-green-500/20',
  blue:
    'bg-blue-50 text-blue-700 inset-ring-blue-700/10 dark:bg-blue-400/10 dark:text-blue-400 dark:inset-ring-blue-400/30',
  indigo:
    'bg-indigo-50 text-indigo-700 inset-ring-indigo-700/10 dark:bg-indigo-400/10 dark:text-indigo-400 dark:inset-ring-indigo-400/30',
  purple:
    'bg-purple-50 text-purple-700 inset-ring-purple-700/10 dark:bg-purple-400/10 dark:text-purple-400 dark:inset-ring-purple-400/30',
  pink:
    'bg-pink-50 text-pink-700 inset-ring-pink-700/10 dark:bg-pink-400/10 dark:text-pink-400 dark:inset-ring-pink-400/20'
}

const SHAPE_CLASSES = {
  rounded: 'rounded-md',
  pill: 'rounded-full',
  square: 'rounded-none'
}

const SIZE_CLASSES = {
  xs: 'px-1.5 py-0.5 text-[10px]',
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2 py-1 text-xs',
  lg: 'px-2.5 py-1 text-sm',
  xl: 'px-3 py-1.5 text-sm'
}

const WEIGHT_CLASSES = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold'
}
</script>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  color: {
    type: String,
    default: 'gray',
    validator: (value) => Object.keys(COLOR_CLASSES).includes(value)
  },

  shape: {
    type: String,
    default: 'rounded',
    validator: (value) => Object.keys(SHAPE_CLASSES).includes(value)
  },

  size: {
    type: String,
    default: 'md',
    validator: (value) => Object.keys(SIZE_CLASSES).includes(value)
  },

  weight: {
    type: String,
    default: 'medium',
    validator: (value) => Object.keys(WEIGHT_CLASSES).includes(value)
  }
})

const colorClass = computed(() => COLOR_CLASSES[props.color])
const shapeClass = computed(() => SHAPE_CLASSES[props.shape])
const sizeClass = computed(() => SIZE_CLASSES[props.size])
const weightClass = computed(() => WEIGHT_CLASSES[props.weight])
</script>
