<template>
  <button
    class="h-8 w-8 flex items-center justify-center rounded-full text-primary-content bg-primary-color"
    title="Metadata"
    @click="() => (isVisible = true)"
  >
    <IconFiles class="size-4" />
  </button>
  <VModal
    v-if="isVisible"
    @close="() => (isVisible = false)"
  >
    <template #header>
      <h3 class="font-medium">Metadata</h3>
    </template>
    <div class="px-4 pb-6">
      <TableObservations :sound-id="soundId" />
    </div>
  </VModal>
</template>

<script setup>
import { ref } from 'vue'
import TableObservations from './TableObservations.vue'

const props = defineProps({
  soundId: {
    type: Number,
    required: true
  }
})

const isVisible = ref(false)
</script>
