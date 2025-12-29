<template>
  <div>
    <InputText
      class="w-14 max-w-14 text-sm"
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
