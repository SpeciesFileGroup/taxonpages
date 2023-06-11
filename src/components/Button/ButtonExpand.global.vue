<template>
  <button
    type="button"
    :title="isExpanded ? 'Close' : 'Expand'"
    class="button-expand bg-base-foreground text-secondary-color w-5 h-5"
    @click="isExpanded = !isExpanded"
  >
    <IconMinusCircle
      v-if="isExpanded"
      class="w-5 h-5"
    />
    <IconPlusCircle
      v-else
      class="w-5 h-5"
    />
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
  get() {
    return props.modelValue
  },

  set(value) {
    emit('update:modelValue', value)
  }
})
</script>
