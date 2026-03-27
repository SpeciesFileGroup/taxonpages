<template>
  <select
    ref="input"
    class="box-border p-2 px-3 text-base-content rounded-md border sm:text-sm placeholder:text-sm border-base-border hover:border-base-soft/40 focus:border-secondary focus:ring-2 focus:ring-secondary/15 focus:outline-none transition-[border-color,box-shadow] duration-150"
    :value="props.modelValue ?? props.value"
    @change="onInput"
  >
    <slot />
  </select>
</template>

<script setup>
import { useTemplateRef } from 'vue'

const props = defineProps({
  modelValue: [String, Number],
  value: [String, Number]
})

const emit = defineEmits(['update:modelValue'])

const inputRef = useTemplateRef('input')

function onInput(e) {
  emit('update:modelValue', e.target.value)
}

defineExpose({
  inputRef
})
</script>
