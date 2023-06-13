<template>
  <div
    class="fixed top-0 left-0 w-full h-screen max-h-screen flex flex-col justify-center bg-black bg-opacity-50 z-[2000]"
    @click="emit('close')"
    @key.esc.stop="emit('close')"
  >
    <div
      class="h-full md:h-auto mx-auto md:max-h-[70vh] bg-base-foreground container"
      @click.stop
    >
      <div
        class="w-full p-4 md:p-4 flex flex-row box-border justify-between items-center"
      >
        <slot name="header">
          <span />
        </slot>
        <IconClose
          class="w-6 h-6 cursor-pointer opacity-50"
          @click="() => emit('close')"
        />
      </div>
      <div
        class="bg-base-foreground overflow-x-auto h-full md:h-auto max-h-full"
      >
        <slot />
      </div>
      <div>
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'

const emit = defineEmits(['close'])

const handleKeys = (e) => {
  if (e.key === 'Escape') {
    e.stopPropagation()
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeys)
  document.body.classList.add('overflow-hidden')
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeys)
  document.body.classList.remove('overflow-hidden')
})
</script>
