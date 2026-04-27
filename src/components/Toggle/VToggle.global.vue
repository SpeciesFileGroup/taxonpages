<template>
  <label
    :class="[
      'inline-flex items-center gap-2 group',
      disabled
        ? 'opacity-50 cursor-not-allowed pointer-events-none'
        : 'cursor-pointer'
    ]"
  >
    <button
      type="button"
      role="switch"
      :aria-checked="!!modelValue"
      :disabled="disabled"
      :class="[
        'relative inline-flex shrink-0 rounded-full transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2',
        track.size,
        modelValue ? 'bg-secondary' : 'bg-base-muted'
      ]"
      @click="toggle"
    >
      <span
        :class="[
          'pointer-events-none inline-block transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200',
          thumb.size,
          thumb.offset,
          modelValue ? thumb.translateOn : thumb.translateOff
        ]"
      />
    </button>
    <span
      v-if="$slots.default"
      class="text-sm text-base-content select-none"
    >
      <slot />
    </span>
  </label>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },

  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v)
  },

  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

function toggle() {
  emit('update:modelValue', !props.modelValue)
}

const TRACK_SIZES = {
  sm: 'h-4 w-7',
  md: 'h-6 w-11',
  lg: 'h-7 w-14'
}

const THUMB = {
  sm: {
    size: 'h-3 w-3',
    offset: 'mt-0.5',
    translateOn: 'translate-x-3.5',
    translateOff: 'translate-x-0.5'
  },
  md: {
    size: 'h-5 w-5',
    offset: 'mt-0.5',
    translateOn: 'translate-x-5',
    translateOff: 'translate-x-0.5'
  },
  lg: {
    size: 'h-6 w-6',
    offset: 'mt-0.5',
    translateOn: 'translate-x-7',
    translateOff: 'translate-x-0.5'
  }
}

const track = computed(() => ({ size: TRACK_SIZES[props.size] }))
const thumb = computed(() => THUMB[props.size])
</script>
