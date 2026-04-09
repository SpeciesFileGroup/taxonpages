<template>
  <input
    ref="input"
    type="text"
    class="box-border py-1.5 px-3 leading-5 text-base-content rounded-md border sm:text-sm placeholder:text-sm placeholder:text-base-soft/60 border-base-border hover:border-base-soft/40 focus:border-secondary focus:ring-2 focus:ring-secondary/15 focus:outline-none transition-[border-color,box-shadow] duration-150"
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
