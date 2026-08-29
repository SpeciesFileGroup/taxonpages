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
      <img :src="thumbSrc(fig)" alt="" class="h-full w-full object-contain" />
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

// Agree with the lightbox's src(): a figure may carry only original_png (no thumb/medium).
const apiUrl = (typeof __APP_ENV__ !== 'undefined' && __APP_ENV__.url) || ''
const token = (typeof __APP_ENV__ !== 'undefined' && __APP_ENV__.project_token) || ''
function thumbSrc(fig) {
  if (fig.thumb) return fig.thumb
  if (fig.medium) return fig.medium
  if (fig.original_png) return `${apiUrl}/${String(fig.original_png).substring(8)}?project_token=${token}`
  return ''
}
</script>
