<template>
  <input
    ref="input"
    type="text"
    class="box-border p-1.5 px-2 text-base-content rounded border sm:text-sm placeholder:text-sm border-base-border focus:ring-primary-500 focus:border-primary-500"
    :value="props.modelValue ?? props.value"
    @input="onInput"
  />
</template>

<script setup>
import { useTemplateRef } from 'vue'

const props = defineProps({
  modelValue: [String, Number],
  value: [String, Number]
})

const emit = defineEmits(['update:modelValue'])

const inputRef = useTemplateRef('input')

const onInput = (event) => {
  emit('update:modelValue', event.target.value)
}

defineExpose({
  inputRef
})
</script>
