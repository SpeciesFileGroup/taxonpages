<template>
  <input
    type="text"
    class="box-border p-1.5 px-2 text-base-content rounded border sm:text-sm placeholder:text-sm dark:border-slate-700 border-gray-300 dark:placeholder:text-slate-400 focus:ring-primary-500 focus:border-primary-500"
    :value="props.modelValue ?? props.value"
    @input="onInput"
  />
</template>

<script setup>
const props = defineProps({
  modelValue: [String, Number],
  value: [String, Number]
})

const emit = defineEmits(['update:modelValue'])

const onInput = (event) => {
  emit('update:modelValue', event.target.value)
}
</script>
