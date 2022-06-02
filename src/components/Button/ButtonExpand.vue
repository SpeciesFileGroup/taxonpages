<template>
  <button
    type="button"
    class="button-expand"
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

const emit = defineEmits('update:modelValue')

const isExpanded = computed({
  get () {
    return props.modelValue
  },

  set (value) {
    emit('update:modelValue', value)
  }
})

</script>

<style scoped>
.button-expand {
  width: 13px;
  height: 13px;
  min-width: 13px;
  min-height: 13px;
  line-height: 12px;
  border: 1px solid black;
  background-color: white;
  border-radius: 4px;
}
</style>