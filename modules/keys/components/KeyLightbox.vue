<template>
  <Teleport to="body">
    <div
      ref="root"
      role="dialog"
      aria-modal="true"
      aria-label="Figure viewer"
      class="fixed inset-0 z-[10000] flex flex-col bg-base-foreground/95 backdrop-blur-md"
    >
      <div class="flex-none h-12 flex items-center justify-between px-3">
        <span class="text-sm text-base-soft">{{ index + 1 }} / {{ figures.length }}</span>
        <button type="button" class="p-2 cursor-pointer text-base-content" aria-label="Close" @click="$emit('close')">
          <IconClose />
        </button>
      </div>

      <div class="flex-1 min-h-0 relative flex items-center justify-center px-4">
        <img
          :src="src(current)"
          :alt="caption(current)"
          class="max-w-full max-h-full object-contain cursor-zoom-out"
          @click="$emit('close')"
        />
        <button
          v-if="index > 0"
          type="button"
          class="absolute left-2 top-1/2 -translate-y-1/2 p-3 text-base-content hover:text-secondary"
          aria-label="Previous"
          @click="$emit('update:index', index - 1)"
        >‹</button>
        <button
          v-if="index < figures.length - 1"
          type="button"
          class="absolute right-2 top-1/2 -translate-y-1/2 p-3 text-base-content hover:text-secondary"
          aria-label="Next"
          @click="$emit('update:index', index + 1)"
        >›</button>
      </div>

      <div v-if="caption(current)" class="flex-none px-6 pb-4 pt-2 text-center text-sm text-base-content [&_i]:italic">
        <span v-if="current.figure_label || current.label" class="text-base-soft">
          {{ current.figure_label || current.label }}<template v-if="current.caption"> — </template>
        </span>
        <span v-if="current.caption" v-html="sanitizeAndLinkifyHtml(current.caption || '')" />
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
// Only sanitizeAndLinkifyHtml is exported from @/utils (sanitizeHtml is module-private
// there); it also linkifies URLs in captions, matching the citation sites.
import { sanitizeAndLinkifyHtml } from '@/utils'

const props = defineProps({
  figures: { type: Array, required: true },
  index: { type: Number, required: true }
})
const emit = defineEmits(['close', 'update:index'])

const root = ref(null)
let previouslyFocused = null

const current = computed(() => props.figures[props.index] || {})
const apiUrl = (typeof __APP_ENV__ !== 'undefined' && __APP_ENV__.url) || ''
const token = (typeof __APP_ENV__ !== 'undefined' && __APP_ENV__.project_token) || ''

function src(fig) {
  if (fig.medium) return fig.medium
  if (fig.original_png) return `${apiUrl}/${String(fig.original_png).substring(8)}?project_token=${token}`
  return fig.thumb || ''
}
function caption(fig) {
  return fig.caption || fig.figure_label || fig.label || ''
}

function onKey(e) {
  if (e.key === 'Escape') emit('close')
  else if (e.key === 'ArrowLeft' && props.index > 0) emit('update:index', props.index - 1)
  else if (e.key === 'ArrowRight' && props.index < props.figures.length - 1) emit('update:index', props.index + 1)
  else if (e.key === 'Tab') trapFocus(e)
}
function trapFocus(e) {
  const f = root.value?.querySelectorAll('button, [tabindex]:not([tabindex="-1"])')
  if (!f?.length) return
  const first = f[0]
  const last = f[f.length - 1]
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
}

onMounted(() => {
  previouslyFocused = document.activeElement
  document.addEventListener('keydown', onKey)
  document.body.classList.add('overflow-hidden')
  root.value?.querySelector('button')?.focus()
})
onUnmounted(() => {
  document.removeEventListener('keydown', onKey)
  document.body.classList.remove('overflow-hidden')
  previouslyFocused?.focus?.()
})
</script>
