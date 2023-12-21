<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const value = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})
</script>

<template>
  <form class="py-3 px-4 flex items-center">
    <label class="sr-only">Search</label>
    <div class="relative w-full">
      <input
        type="text"
        v-model="value"
        placeholder="Search"
        class="bg-base-background border border-gray-300 text-base-contenta sm:w-85 rounded px-4 py-1"
      />
    </div>
  </form>
</template>
