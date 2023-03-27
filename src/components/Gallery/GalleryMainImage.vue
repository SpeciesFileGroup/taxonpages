<template>
  <div class="h-80 max-h-80 flex items-center justify-center">
    <VSpinner v-if="isLoading" />
    <img
      ref="imageElement"
      class="max-h-80 h-max w-100 cursor-zoom-in m-auto"
      :src="image.original"
      @click="emit('open:viewer')"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import VSpinnerGlobal from '../VSpinner.global.vue'

const props = defineProps({
  image: {
    type: Object,
    required: true
  }
})
const emit = defineEmits(['open:viewer'])

const isLoading = ref(false)
const imageElement = ref(null)

watch(
  () => props.image,
  (newVal) => {
    if (newVal.id) {
      isLoading.value = true
    }
  },
  {
    immediate: true
  }
)

onMounted(() => {
  imageElement.value.addEventListener('load', () => (isLoading.value = false))
})

onUnmounted(() => {})
</script>
