<template>
  <div class="flex flex-wrap gap-1.5">
    <button
      v-for="(fig, i) in figures"
      :key="i"
      type="button"
      class="h-20 w-24 shrink-0 overflow-hidden rounded border border-base-muted hover:border-secondary transition"
      :title="fig.figure_label || fig.label || 'figure'"
      @click="open(i)"
    >
      <img :src="fig.thumb || fig.medium" alt="" class="h-full w-full object-contain" />
    </button>

    <ClientOnly>
      <KeyLightbox
        v-if="viewer !== null"
        :figures="figures"
        :index="viewer"
        @close="viewer = null"
        @update:index="viewer = $event"
      />
    </ClientOnly>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import KeyLightbox from './KeyLightbox.vue'

defineProps({ figures: { type: Array, default: () => [] } })

const viewer = ref(null)
const open = (i) => { viewer.value = i }
</script>
