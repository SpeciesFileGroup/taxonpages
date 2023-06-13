<template>
  <VButton
    class="px-2 py-2 rounded-full"
    primary
    @click="copyText"
  >
    <IconCheck
      v-if="isCopied"
      class="w-4 h-4"
    />
    <IconClipboard
      v-else
      class="w-4 h-4"
    />
  </VButton>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue'

const props = defineProps({
  text: {
    type: String,
    required: true
  },

  delay: {
    type: Number,
    default: 2000
  }
})

const isCopied = ref(false)
let timeoutId

function copyText() {
  navigator.clipboard.writeText(props.text).then(() => {
    isCopied.value = true

    timeoutId = setTimeout(() => {
      isCopied.value = false
    }, props.delay)
  })
}

onBeforeUnmount(() => {
  clearTimeout(timeoutId)
})
</script>
