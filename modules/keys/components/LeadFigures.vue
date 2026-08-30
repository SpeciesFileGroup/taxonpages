<template>
  <!-- Always rendered for an eligible lead (has own figures, or keys out an OTU) so the
       IntersectionObserver has an element to watch and the layout column keeps its width
       before images arrive. -->
  <div v-if="eligible" ref="root" class="flex flex-col gap-2">
    <template v-if="items.length">
      <!-- one row: a single figure fills the column; two sit side by side -->
      <div class="flex gap-3">
        <figure v-for="(fig, i) in preview" :key="fig.id ?? i" class="m-0 flex-1 min-w-0">
          <button
            type="button"
            class="block w-full overflow-hidden rounded border border-base-muted hover:border-secondary transition"
            :title="figTitle(fig)"
            @click="open(i)"
          >
            <img :src="imgSrc(fig)" alt="" class="w-full h-auto max-h-[420px] object-contain" />
          </button>
          <figcaption
            v-if="figCaption(fig)"
            class="mt-1 text-center text-xs text-base-soft leading-snug"
          >{{ figCaption(fig) }}</figcaption>
        </figure>
      </div>

      <button
        v-if="rest"
        type="button"
        class="self-start text-xs text-secondary hover:underline"
        @click="open(preview.length)"
      >+{{ rest }} more image{{ rest > 1 ? 's' : '' }}</button>

      <p v-if="captionLine" class="text-xs text-base-soft leading-snug">{{ captionLine }}</p>
    </template>

    <div
      v-else-if="fallbackEntry && fallbackEntry.state === 'loading'"
      class="h-24 w-full rounded border border-base-muted animate-pulse"
      aria-hidden="true"
    />

    <ClientOnly>
      <Teleport to="body">
        <ImageLightbox
          v-if="viewer !== null"
          :images="lightboxItems"
          :index="viewer"
          :next="viewer < lightboxItems.length - 1"
          :previous="viewer > 0"
          minimal
          @select-index="viewer = $event"
          @next="viewer++"
          @previous="viewer--"
          @close="viewer = null"
        />
      </Teleport>
    </ClientOnly>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted, onBeforeUnmount } from 'vue'
import { sanitizeAndLinkifyHtml } from '@/utils'
import ImageLightbox from '../../../panels/_shared/ImageLightbox.vue'
import { pickPreview } from '../lib/images.js'

const props = defineProps({
  // A tree.js node (lead). Reads: figures, targetType, targetId, targetLabel.
  // Optional — omit when only passing an explicit `figures` list (shared couplet figures).
  node: { type: Object, default: null },
  // Explicit figure list. `null` → use `node.figures`. An array (even empty) OVERRIDES
  // `node.figures`: `[]` means "this lead has no individual figures, go to the fallback".
  figures: { type: Array, default: null }
})

// One row of figures: a lone figure fills the image column, two sit side by side.
// The rest go to the "+N more images" lightbox.
const PREVIEW_N = 2

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

const apiUrl = (typeof __APP_ENV__ !== 'undefined' && __APP_ENV__.url) || ''
const token = (typeof __APP_ENV__ !== 'undefined' && __APP_ENV__.project_token) || ''
function originalPngUrl(fig) {
  return fig.original_png
    ? `${apiUrl}/${String(fig.original_png).substring(8)}?project_token=${token}`
    : ''
}
// Column-width render.
// - A key's own figure (a plate/diagram, no `sourceTag`) is shown at full resolution.
// - Taxon-image fallback photos (`sourceTag` set — inventory / iNaturalist) stay on the
//   `medium` rendition: plenty at column width and much lighter.
function imgSrc(fig) {
  const order = fig.sourceTag
    ? [fig.medium, fig.original, originalPngUrl(fig), fig.thumb]
    : [originalPngUrl(fig), fig.original, fig.medium, fig.thumb]
  return order.find(Boolean) || ''
}

// Shape each figure for the shared ImageLightbox (`minimal` mode: it renders
// only the bold label + caption). Lightbox wants the largest source; captions
// are HTML (attribution/source folded in for fallback images) so they go
// through the same sanitiser the citation sites use.
function lightboxSrc(fig) {
  if (fig.original_png) return originalPngUrl(fig)
  return fig.original || fig.medium || fig.thumb || ''
}
const lightboxItems = computed(() =>
  items.value.map((f, i) => ({
    id: f.id ?? i,
    original: lightboxSrc(f),
    thumb: f.thumb || f.medium || '',
    figure_label: f.figure_label || f.label || '',
    captionHtml: sanitizeAndLinkifyHtml(f.caption || '')
  }))
)
function figTitle(fig) {
  return fig.figure_label || fig.label || fig.caption || 'figure'
}
// Short label under each image (the full caption is in the lightbox). Fallback
// (taxon-image) entries are covered by the single `captionLine` instead.
function figCaption(fig) {
  if (fig.sourceTag) return ''
  if (fig.figure_label) return String(fig.figure_label)
  const c = String(fig.caption || '').trim()
  return c.length > 70 ? `${c.slice(0, 70).trimEnd()}…` : c
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
