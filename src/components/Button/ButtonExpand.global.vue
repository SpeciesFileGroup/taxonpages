<template>
  <button
    type="button"
    class="
      button-expand
      bg-white
      dark:text-gray-400
      dark:bg-gray-900 border
      border-black
      w-[14px]
      h-[14px]
      min-w-[14px]
      min-h-[14px]
      rounded
      leading-3"
    @click="isExpanded = !isExpanded"
  >
    <span v-if="isExpanded">-</span>
    <span v-else>+</span>
  </button>
</template>

<script setup>

import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const isExpanded = computed({
  get () {
    return props.modelValue
  },

  set (value) {
    emit('update:modelValue', value)
  }
})

</script>
