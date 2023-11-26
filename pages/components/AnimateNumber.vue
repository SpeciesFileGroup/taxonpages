<template>
  <div>{{ displayNumber.toLocaleString() }}</div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  number: {
    type: Number,
    default: 100
  },

  duration: {
    type: Number,
    default: 1000
  }
})

const displayNumber = ref(0)
const start = ref(0)
const emit = defineEmits(['animation:start', 'animation:end'])

watch(
  () => props.number,
  (newVal, oldVal) => {
    if (newVal === oldVal) return
    animateNumber()
  },
  { immediate: true }
)

function animateNumber() {
  let startTimestamp = null
  emit('animation:start')

  const step = (timestamp) => {
    if (!startTimestamp) {
      startTimestamp = timestamp
    }
    const progress = Math.min((timestamp - startTimestamp) / props.duration, 1)

    displayNumber.value = Math.floor(
      progress * (props.number - start.value) + start.value
    )
    if (progress < 1) {
      window.requestAnimationFrame(step)
    } else {
      start.value = displayNumber.value
      emit('animation:end')
    }
  }
  window.requestAnimationFrame(step)
}
</script>
