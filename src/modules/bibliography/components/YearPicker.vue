<template>
  <div class="flex flex-row gap-2">
    <input
      class="w-14 p-1.5 text-base-content rounded border sm:text-sm placeholder:text-sm border-base-border focus:ring-primary-500 focus:border-primary-500"
      type="number"
      :value="inputValue"
      @change="setValue"
    />
  </div>
</template>

<script setup>
const props = defineProps({
  min: {
    type: Number,
    required: true
  },

  max: {
    type: Number,
    required: true
  }
})

const inputValue = defineModel({
  type: Number,
  required: true
})

function setValue(e) {
  const n = Number(e.target.value)

  if (n < props.min) {
    inputValue.value = props.min
  } else if (n > props.max) {
    inputValue.value = props.max
  } else {
    inputValue.value = n
  }
}
</script>
