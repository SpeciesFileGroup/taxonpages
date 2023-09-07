<template>
  <div class="h-80 max-h-80 flex items-center justify-center">
    <ClientOnly>
      <VSpinner v-if="isLoading" />
    </ClientOnly>
    <span
      v-if="errorMessage"
      v-text="errorMessage"
    />
    <img
      v-show="!errorMessage"
      ref="imageElement"
      class="max-h-80 h-max w-100 cursor-zoom-in m-auto object-contain"
      :src="image.original"
      :alt="image.depictions.map((d) => d.label).join(';')"
      @click="emit('open:viewer')"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  image: {
    type: Object,
    required: true
  }
})
const emit = defineEmits(['open:viewer'])

const isLoading = ref(false)
const imageElement = ref(null)
const errorMessage = ref(null)

watch(
  () => props.image,
  (newVal) => {
    if (newVal.original) {
      errorMessage.value = null
      isLoading.value = true
    }
  }
)

function handleError(e) {
  e.preventDefault()

  isLoading.value = false
  errorMessage.value = 'Image was not found or format is not supported'
}

function handleLoad() {
  isLoading.value = false
}

onMounted(() => {
  imageElement.value.addEventListener('load', handleLoad)
  imageElement.value.addEventListener('error', handleError)
})
</script>
