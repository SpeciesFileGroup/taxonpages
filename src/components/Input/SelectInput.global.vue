<template>
  <select
    ref="input"
    class="box-border p-1.5 px-2 text-base-content rounded border sm:text-sm placeholder:text-sm border-base-border focus:ring-primary-500 focus:border-primary-500"
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
