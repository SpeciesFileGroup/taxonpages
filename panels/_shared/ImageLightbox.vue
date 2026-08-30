<template>
  <div
    ref="viewerRef"
    role="dialog"
    aria-modal="true"
    aria-label="Image viewer"
    class="fixed z-[10000] inset-0 flex flex-col backdrop-blur-md bg-base-foreground overflow-hidden"
  >
    <!-- Toolbar -->
    <div class="flex-none h-12 flex items-center justify-between px-2">
      <span class="text-sm opacity-50 px-2">{{ index + 1 }} / {{ images.length }}</span>
      <button
        type="button"
        aria-label="Close image viewer"
        class="p-2 cursor-pointer opacity-50 text-base-content"
        @click="emit('close')"
      >
        <IconClose />
      </button>
    </div>

    <!-- Image area: takes all remaining vertical space -->
    <div class="flex-1 min-h-0 relative flex items-center justify-center">
      <VSpinner v-if="isLoading" class="absolute" />
      <img
        ref="imageElement"
        class="max-w-full max-h-full object-contain cursor-zoom-out transition-opacity duration-200"
        :class="isLoading ? 'opacity-20' : 'opacity-100'"
        :src="image.original"
        :alt="depictionTitle"
        @click="emit('close')"
      />
      <ControlImagePrevious
        v-if="previous"
        class="absolute left-0 top-1/2 -translate-y-1/2"
        @click="emit('previous')"
      />
      <ControlImageNext
        v-if="next"
        class="absolute right-0 top-1/2 -translate-y-1/2"
        @click="emit('next')"
      />
    </div>

    <!-- Bottom panel: natural height, scrollable if very tall -->
    <div class="flex-none text-center text-sm px-6 pb-2 max-h-[40vh] overflow-y-auto">
      <!-- OTU section: badge, name, description -->
      <div
        v-if="!minimal && (imageDisplay.hasOtu || imageDisplay.name)"
        class="my-1"
      >
        <div
          v-if="imageDisplay.hasOtu"
          class="text-xs opacity-40 uppercase tracking-wide"
        >OTU</div>
        <div>
          <RouterLink
            v-if="imageDisplay.otuId"
            :to="{ name: 'otus-id', params: { id: imageDisplay.otuId } }"
            class="text-secondary hover:underline"
          ><em>{{ imageDisplay.name.italic }}</em>{{ imageDisplay.name.plain ? ' ' + imageDisplay.name.plain : '' }}</RouterLink>
          <span v-else><em>{{ imageDisplay.name.italic }}</em>{{ imageDisplay.name.plain ? ' ' + imageDisplay.name.plain : '' }}</span>
        </div>
        <div
          v-if="imageDisplay.otuFigLabel"
          class="opacity-70"
        >{{ imageDisplay.otuFigLabel }}</div>
        <div
          v-if="imageDisplay.otuDesc"
          class="opacity-70"
          v-html="italicizeNames(imageDisplay.otuDesc)"
        />
      </div>

      <!-- CO/FO entries: badge + ⓘ, type status, figure label, caption -->
      <div
        v-for="co in (minimal ? [] : imageDisplay.coEntries)"
        :key="co.objectId"
        class="my-0.5"
      >
        <div class="flex items-center justify-center gap-1">
          <span class="text-xs opacity-40 uppercase tracking-wide">{{ co.objectType === 'CollectionObject' ? 'Collection object' : 'Field occurrence' }}</span>
          <button
            v-if="co.dwcOk && showInfoButton"
            type="button"
            class="shrink-0 opacity-40 hover:opacity-100 cursor-pointer leading-none text-xs"
            title="Show details"
            @click="openDwcTable(co)"
          >ⓘ</button>
        </div>
        <div
          v-if="co.typeStatus"
          class="font-semibold"
          v-html="italicizeNames(co.typeStatus)"
        />
        <div
          v-if="co.figureLabel"
          class="opacity-70 text-xs"
        >{{ co.figureLabel }}</div>
        <div
          v-if="co.caption"
          class="opacity-70 text-xs"
          v-html="italicizeNames(co.caption)"
        />
      </div>

      <!-- Plain figure caption: images with no OTU / CO / FO structure (e.g. a
           biological-association plate, a keys lead figure) carry the label +
           caption at the top level. Label in bold, caption below it.
           `figure_label` / `caption` are free-text (often prose that mentions a
           binomial: "…feeding on Achillea millefolium", "rostrum, dorsal view")
           and are rendered verbatim — the name-italiciser greedily italicises
           the prose that trails a Genus+epithet pair. Both prior renderers (the
           package ImageViewer, the old keys KeyLightbox) showed these plain.
           `captionHtml` is pre-sanitised HTML (keys, already linkified). -->
      <div
        v-if="showPlainCaption"
        class="my-1"
      >
        <div
          v-if="image.figure_label"
          class="font-semibold"
        >{{ image.figure_label }}</div>
        <div
          v-if="image.captionHtml"
          class="opacity-70 [&_a]:text-secondary [&_a]:hover:underline"
          v-html="image.captionHtml"
        />
        <div
          v-else-if="image.caption"
          class="opacity-70"
        >{{ image.caption }}</div>
      </div>

      <!-- Attribution + citations (image-level) -->
      <div
        v-if="!minimal"
        class="opacity-60 my-1"
      >
        <span v-if="image.attribution?.label">{{ image.attribution.label }}</span>
        <span
          v-else-if="!image.citations?.length"
          class="italic"
        >attribution missing</span><template
          v-for="(cit, i) in image.citations || []"
          :key="cit.id"
        > <span
            class="text-secondary hover:underline cursor-pointer"
            @click="activeCitation = cit"
            v-html="cit.citation_source_body"
          /></template>
      </div>

      <!-- Source -->
      <div
        v-if="!minimal && image.source?.label"
        class="opacity-60 my-1"
        v-html="image.source.label"
      />

      <!-- Thumbnail strip -->
      <div
        v-if="!minimal"
        class="flex flex-row overflow-x-auto justify-center gap-1.5 mt-2 pb-2"
      >
        <div
          v-for="(img, i) in images"
          :key="img.id"
          class="w-24 h-20 flex-shrink-0 cursor-pointer rounded-md border overflow-hidden hover:opacity-80 transition"
          :class="index === i ? 'border-secondary' : 'border-base-muted'"
          @click="emit('selectIndex', i)"
        >
          <img
            class="w-24 h-20 object-contain"
            :src="img.thumb"
            :alt="img.depictions?.map((d) => d.label).join(';')"
          />
        </div>
      </div>
    </div>

    <DwcTable
      v-if="showInfoButton && !minimal"
      ref="dwcTableRef"
      @close="onDwcTableClose"
    />

    <Teleport to="body">
      <VModal
        v-if="activeCitation"
        @close="activeCitation = null"
      >
        <template #header>
          <div class="text-sm font-medium">Reference</div>
        </template>
        <div
          class="px-4 pb-4 text-sm leading-relaxed"
          v-html="activeCitation.source?.cached || activeCitation.citation_source_body"
        />
      </VModal>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted, defineAsyncComponent } from 'vue'
import ControlImageNext from '@/components/ImageViewer/ControlImageNext.vue'
import ControlImagePrevious from '@/components/ImageViewer/ControlImagePrevious.vue'
import { makeAPIRequest } from '@/utils/request'

// Async both ways: DwcTable imports this file back (its media strip opens this
// lightbox). Splitting DwcTable into its own chunk also keeps it out of the
// bundles that use the lightbox in `minimal` mode (keys) or never click ⓘ.
const DwcTable = defineAsyncComponent(() => import('./DwcTable.vue'))

const props = defineProps({
  images: { type: Array, required: true },
  index:  { type: Number, required: true },
  next:     { type: Boolean, default: false },
  previous: { type: Boolean, default: false },
  // The ⓘ button opens a DwcTable for a CO/FO depiction. DwcTable opens this
  // lightbox for its own media strip, so that nested instance passes false to
  // stop the loop (DwcTable → lightbox → DwcTable → …).
  showInfoButton: { type: Boolean, default: true },
  // Caption-only mode (keys lead figures): render just the bold label + caption
  // block. No name/OTU block, CO/FO entries, attribution, source, thumbnail
  // strip, ⓘ button or DWC fetch — those images only ever carry label + caption.
  minimal: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'next', 'previous', 'selectIndex'])

const dwcTableRef = ref(null)
// The ⓘ button opens a DwcTable modal *on top of* this viewer. While it's up, this
// viewer must not act on Escape (one press would close both) and the DwcTable's
// VModal owns the body scroll lock.
const dwcTableOpen = ref(false)
const activeCitation = ref(null)
const imageElement = ref(null)
const viewerRef = ref(null)
const isLoading = ref(true)

let previouslyFocusedElement = null

function trapFocus(e) {
  const focusable = viewerRef.value?.querySelectorAll(
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )
  if (!focusable?.length) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}

// DWC cache keyed by object id: { typeStatus, scientificName }
const dwcCache = reactive({})

// OTU validity cache: rawOtuId → validOtuId (resolved asynchronously)
const otuValidCache = reactive({})

const DWC_ENDPOINTS = {
  CollectionObject: (id) => `/collection_objects/${id}/dwc`,
  FieldOccurrence:  (id) => `/field_occurrences/${id}/dwc`
}

// Infer depiction type when depiction_object_type isn't serialized by the inventory endpoint.
// CO/FO are identified first by label prefix, preventing their "uuid: " from being
// mistaken for the OTU ': ' separator. Anything else with ': ' is treated as OTU.
function inferDepictionType(dep) {
  if (dep.depiction_object_type) return dep.depiction_object_type
  const label = dep.label || ''
  if (label.startsWith('CollectionObject ')) return 'CollectionObject'
  if (label.startsWith('FieldOccurrence '))  return 'FieldOccurrence'
  if (label.indexOf(': ') > 0)               return 'Otu'
  if (dep.depiction_object_id)               return 'Otu'
  return null
}

async function resolveValidOtu(otuId) {
  if (!otuId || otuId in otuValidCache) return
  otuValidCache[otuId] = otuId  // optimistic: assume valid while loading
  try {
    const { data: otu } = await makeAPIRequest.get(`/otus/${otuId}`)
    const taxonNameId = otu.taxon_name_id
    if (!taxonNameId) return
    const { data: tn } = await makeAPIRequest.get(`/taxon_names/${taxonNameId}`)
    const validId = tn.cached_valid_taxon_name_id
    if (!validId || validId === taxonNameId) return
    const { data: otus } = await makeAPIRequest.get('/otus', {
      params: { 'taxon_name_id[]': validId, per: 1 }
    })
    if (otus[0]?.id) otuValidCache[otuId] = otus[0].id
  } catch { /* keep optimistic */ }
}

function resolveValidOtuForImage(img) {
  for (const dep of (img?.depictions || [])) {
    if (inferDepictionType(dep) === 'Otu' && dep.depiction_object_id) {
      resolveValidOtu(dep.depiction_object_id)
    }
  }
}

function fetchDwcForImage(img) {
  for (const dep of (img?.depictions || [])) {
    const type = inferDepictionType(dep)
    const endpoint = DWC_ENDPOINTS[type]
    if (!endpoint || dep.depiction_object_id in dwcCache) continue
    const id = dep.depiction_object_id
    dwcCache[id] = null
    makeAPIRequest(endpoint(id))
      .then(({ data }) => {
        dwcCache[id] = {
          typeStatus:     data.typeStatus     || '',
          scientificName: data.scientificName || '',
          otuId:          data.otu_id         || null
        }
        if (data.otu_id) resolveValidOtu(data.otu_id)
      })
      .catch(() => { dwcCache[id] = { typeStatus: '', scientificName: '', otuId: null, error: true } })
  }
}

// Fetch DWC and resolve OTU validity for current image and prefetch adjacent ones.
watch(
  () => props.index,
  (idx) => {
    isLoading.value = true
    if (props.minimal) return  // caption-only: no depiction/DWC resolution
    fetchDwcForImage(props.images[idx])
    fetchDwcForImage(props.images[idx + 1])
    fetchDwcForImage(props.images[idx - 1])
    resolveValidOtuForImage(props.images[idx])
    resolveValidOtuForImage(props.images[idx + 1])
    resolveValidOtuForImage(props.images[idx - 1])
  },
  { immediate: true }
)

// Wraps genus+epithet sequences in <em> within plain-text strings (type status, captions).
// Handles optional [sic] or similar bracketed notes between genus and epithet.
// Minimum 3 chars per lowercase word to skip prepositions (of, at, in).
function italicizeNames(text) {
  if (!text) return ''
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return escaped.replace(
    /\b([A-Z][a-z]+(?:\s+\([A-Z][a-z]+\))?)(\s+(?:\[[^\]]*\]\s+)?[a-z][a-z]{2,}(?:\s+[a-z][a-z]{2,})*)/g,
    '<em>$1$2</em>'
  )
}

// Split "Genus (Subgenus) species (Author, year)" into italic name and plain authorship.
// Rules:
//   lowercase word                        → species/subspecies epithet → italic
//   (Word) where next word is lowercase   → subgenus → italic
//   anything else                         → authorship → plain
function splitName(name) {
  const words = (name || '').trim().split(/\s+/)
  let i = 1
  while (i < words.length) {
    const w = words[i]
    if (/^[a-z]/.test(w)) { i++; continue }
    if (/^\(/.test(w) && /^[a-z]/.test(words[i + 1] || '')) { i++; continue }
    break
  }
  return { italic: words.slice(0, i).join(' '), plain: words.slice(i).join(' ') }
}

const image = computed(() => props.images[props.index] || {})

// Extract the description embedded in an OTU label after ': ', stripping the trailing
// '. (Type).' marker. Falls back to dep.caption if available.
function otuDescription(dep) {
  if (!dep) return ''
  if (dep.caption) return dep.caption
  const label = dep.label || ''
  const colonIdx = label.indexOf(': ')
  if (colonIdx < 0) return ''
  const raw = label.substring(colonIdx + 2).replace(/\s*\.\s*\(\w+\)\s*\.\s*$/, '').trim()
  // Suppress if nothing remains after stripping the type marker (e.g. ": (Otu).")
  return /^\s*\(\w+\)\s*\.?\s*$/.test(raw) ? '' : raw
}

// Unified display object for the current image.
// Name is always shown first (OTU label or DWC scientificName for CO-only).
// OTU description appears directly below the name.
// CO/FO entries follow, each with badge, type status, and their own figure label / caption.
const imageDisplay = computed(() => {
  const deps = image.value.depictions || []

  // OTU depiction: use inferred type
  const otuDep = deps.find((d) => inferDepictionType(d) === 'Otu')

  // CO/FO depictions: use inferred type
  const coDeps = deps.filter((d) => {
    const t = inferDepictionType(d)
    return t === 'CollectionObject' || t === 'FieldOccurrence'
  })

  // Primary name: from OTU label (before ': ') — only when non-empty after parsing
  let name = null
  let otuId = null
  let hasOtu = false

  if (otuDep) {
    const label = otuDep.label || ''
    const colonIdx = label.indexOf(': ')
    const namePart = colonIdx > 0 ? label.substring(0, colonIdx) : label
    const parsed = splitName(namePart)
    if (parsed.italic || parsed.plain) name = parsed
    const rawOtuId = otuDep.depiction_object_id || null
    otuId = rawOtuId ? (otuValidCache[rawOtuId] ?? rawOtuId) : null
    hasOtu = true
  }

  // Fallback: DWC scientificName + otu_id from first CO/FO when no OTU depiction
  if (!name && coDeps.length) {
    const cached = dwcCache[coDeps[0].depiction_object_id]
    if (cached?.scientificName) name = splitName(cached.scientificName)
    if (cached?.otuId) {
      const rawOtuId = cached.otuId
      otuId = otuValidCache[rawOtuId] ?? rawOtuId
      hasOtu = true
    }
  }

  // iNat synthetic fallback: null-type dep whose label is just the taxon name
  if (!name && !otuDep && !coDeps.length) {
    const synDep = deps.find((d) => !inferDepictionType(d))
    if (synDep?.label) name = splitName(synDep.label)
  }

  // CO/FO entries — use inferred type for badge label.
  // dwcLoading: fetch still in flight; dwcOk: fetch succeeded (no 404).
  // Entries where DWC failed and there is no own content are filtered out to avoid
  // showing a broken ⓘ button with nothing beneath it.
  const coEntries = coDeps.map((dep) => {
    const cached = dwcCache[dep.depiction_object_id]
    const dwcLoading = cached === null || cached === undefined
    const dwcOk      = !dwcLoading && !cached?.error
    return {
      objectId:    dep.depiction_object_id,
      objectType:  inferDepictionType(dep),
      typeStatus:  cached?.typeStatus  || '',
      figureLabel: dep.figure_label    || '',
      caption:     dep.caption         || '',
      dwcOk,
      dwcLoading
    }
  }).filter(co => co.dwcLoading || co.dwcOk || co.figureLabel || co.caption)

  return {
    name,
    otuId,
    hasOtu,
    otuDesc:     otuDescription(otuDep),
    otuFigLabel: otuDep?.figure_label || '',
    coEntries
  }
})

const depictionTitle = computed(() => {
  const { name } = imageDisplay.value
  if (!name) return ''
  return [name.italic, name.plain].filter(Boolean).join(' ')
})

// A plain image (no OTU / CO / FO depiction structure) whose only text is a
// top-level figure_label / caption — e.g. a biological-association plate or a
// keys lead figure. Shown as bold label + caption instead of the name block.
const showPlainCaption = computed(() => {
  const img = image.value
  const hasText = !!(img.figure_label || img.caption || img.captionHtml)
  if (props.minimal) return hasText
  const d = imageDisplay.value
  if (d.hasOtu || d.name || d.coEntries.length) return false
  return hasText
})

function openDwcTable(dep) {
  if (!dwcTableRef.value) return
  dwcTableOpen.value = true
  dwcTableRef.value.show({ id: dep.objectId, type: dep.objectType })
}

function onDwcTableClose() {
  dwcTableOpen.value = false
  // The DwcTable's VModal cleared `overflow-hidden` on unmount; this viewer is
  // still up, so re-assert the lock.
  document.body.classList.add('overflow-hidden')
}

// Capture phase so this runs before VModal's bubble-phase keydown listener: when a
// DwcTable modal is stacked *under* this viewer (its media strip), Escape closes
// only this viewer, not both. When a DwcTable is stacked *over* this viewer (the ⓘ
// button), dwcTableOpen is set and we bail so that modal handles its own keys.
function handleKeydown(e) {
  if (dwcTableOpen.value) return
  if (e.key === 'Escape') {
    e.stopImmediatePropagation()
    emit('close')
  } else if (e.key === 'ArrowLeft' && props.previous) {
    emit('previous')
  } else if (e.key === 'ArrowRight' && props.next) {
    emit('next')
  } else if (e.key === 'Tab') {
    trapFocus(e)
  }
}

onMounted(() => {
  previouslyFocusedElement = document.activeElement
  document.addEventListener('keydown', handleKeydown, true)
  document.body.classList.add('overflow-hidden')
  // If the first image is already cached the load event fires before this runs
  if (imageElement.value.complete) isLoading.value = false
  imageElement.value.addEventListener('load',  () => { isLoading.value = false })
  imageElement.value.addEventListener('error', () => { isLoading.value = false })
})
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown, true)
  // A viewer opened *from* a DwcTable (its media strip) passes showInfoButton:false;
  // that outer DwcTable's VModal still owns the lock, so don't clear it here.
  if (props.showInfoButton) document.body.classList.remove('overflow-hidden')
  previouslyFocusedElement?.focus()
})
</script>
