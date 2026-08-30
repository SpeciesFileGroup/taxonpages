<template>
  <!-- Always rendered for an eligible lead (has own figures, or keys out an OTU) so the
       IntersectionObserver has an element to watch and the layout column keeps its width
       before images arrive. -->
  <div v-if="eligible" ref="root" class="flex flex-col gap-1">
    <div v-if="items.length" class="flex flex-wrap gap-1.5" :class="isLg ? 'w-full' : ''">
      <button
        v-for="(fig, i) in preview"
        :key="fig.id ?? i"
        type="button"
        :class="[thumbClass, 'overflow-hidden rounded border border-base-muted hover:border-secondary transition']"
        :title="figTitle(fig)"
        @click="open(i)"
      >
        <img :src="thumbSrc(fig)" alt="" :class="imgClass" />
      </button>
      <button
        v-if="rest"
        type="button"
        :class="[restClass, 'grid place-items-center rounded border border-base-muted text-xs text-base-soft hover:border-secondary hover:text-secondary transition']"
        :title="`Show ${rest} more`"
        @click="open(preview.length)"
      >+{{ rest }}</button>
    </div>

    <div
      v-else-if="fallbackEntry && fallbackEntry.state === 'loading'"
      class="h-20 w-20 rounded border border-base-muted animate-pulse"
      aria-hidden="true"
    />

    <p v-if="captionLine" class="text-xs text-base-soft leading-snug">{{ captionLine }}</p>

    <ClientOnly>
      <KeyLightbox
        v-if="viewer !== null"
        :figures="items"
        :index="viewer"
        @close="viewer = null"
        @update:index="viewer = $event"
      />
    </ClientOnly>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted, onBeforeUnmount } from 'vue'
import KeyLightbox from './KeyLightbox.vue'
import { pickPreview } from '../lib/images.js'

const props = defineProps({
  // A tree.js node (lead). Reads: figures, targetType, targetId, targetLabel.
  // Optional — omit when only passing an explicit `figures` list (shared couplet figures).
  node: { type: Object, default: null },
  // Explicit figure list. `null` → use `node.figures`. An array (even empty) OVERRIDES
  // `node.figures`: `[]` means "this lead has no individual figures, go to the fallback".
  figures: { type: Array, default: null },
  // 'sm' — the ¼-column per-lead strip; 'lg' — the shared-figure block centred beside a couplet.
  size: { type: String, default: 'sm' }
})

const PREVIEW_N = 3
const isLg = computed(() => props.size === 'lg')
// 'lg' (shared couplet figure): fill the column width at natural aspect, capped height.
// 'sm' (per-lead strip): fixed small square.
const thumbClass = computed(() => (isLg.value ? 'w-full' : 'h-20 w-20 shrink-0'))
const imgClass = computed(() =>
  isLg.value ? 'w-full h-auto max-h-96 object-contain' : 'h-full w-full object-contain'
)
const restClass = computed(() => (isLg.value ? 'w-full h-16' : 'h-20 w-20 shrink-0'))

const keyImages = inject('keyImages', null)

const ownFigures = computed(() =>
  Array.isArray(props.figures)
    ? props.figures
    : Array.isArray(props.node?.figures)
      ? props.node.figures
      : []
)
const targetsOtu = computed(() => props.node?.targetType === '/api/v1/otus' && props.node?.targetId != null)
const eligible = computed(() => ownFigures.value.length > 0 || targetsOtu.value)

// The lead's own figures win; otherwise the lazily-loaded taxon-image fallback.
const fallbackEntry = ref(null)
const items = computed(() => {
  if (ownFigures.value.length) return ownFigures.value
  return fallbackEntry.value?.images || []
})

const isFallback = computed(() => !ownFigures.value.length && items.value.length > 0)
const captionLine = computed(() => {
  if (!isFallback.value) return ''
  // the lead's own target label is the taxon name — more reliable than a depiction
  // label (which is a catalog id for CollectionObject / FieldOccurrence images)
  const name = String(props.node?.targetLabel || '').trim()
  const tag = items.value[0]?.sourceTag || ''
  return [name, tag].filter(Boolean).join(' · ')
})

const split = computed(() => pickPreview(items.value, PREVIEW_N))
const preview = computed(() => split.value.preview)
const rest = computed(() => split.value.rest)

const viewer = ref(null)
const open = (i) => { viewer.value = i }

// thumb / title work for both shapes: raw lead figures ({ figure_label, caption,
// original_png }) and normalised fallback images ({ label, caption, original }).
const apiUrl = (typeof __APP_ENV__ !== 'undefined' && __APP_ENV__.url) || ''
const token = (typeof __APP_ENV__ !== 'undefined' && __APP_ENV__.project_token) || ''
function originalPngUrl(fig) {
  return fig.original_png
    ? `${apiUrl}/${String(fig.original_png).substring(8)}?project_token=${token}`
    : ''
}
function thumbSrc(fig) {
  // 'lg' renders the image at column width — a small `thumb` would upscale blurry,
  // so prefer the larger renditions there.
  const order = isLg.value
    ? [fig.medium, fig.original, originalPngUrl(fig), fig.thumb]
    : [fig.thumb, fig.medium, fig.original, originalPngUrl(fig)]
  return order.find(Boolean) || ''
}
function figTitle(fig) {
  return fig.figure_label || fig.label || fig.caption || 'figure'
}

// ── lazy trigger ─────────────────────────────────────────────────────────────
const root = ref(null)
let observer = null
function trigger() {
  if (ownFigures.value.length || !targetsOtu.value || !keyImages) return
  fallbackEntry.value = keyImages.request(props.node.targetId)
}
onMounted(() => {
  if (!eligible.value) return
  if (ownFigures.value.length) return // nothing to lazy-load
  if (typeof IntersectionObserver === 'undefined') { trigger(); return }
  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        trigger()
        observer?.disconnect()
        observer = null
      }
    },
    { rootMargin: '300px' }
  )
  if (root.value) observer.observe(root.value)
  else { trigger() }
})
onBeforeUnmount(() => { observer?.disconnect(); observer = null })
</script>
