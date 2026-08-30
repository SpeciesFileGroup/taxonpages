<template>
  <VCard>
    <VCardHeader>
      Specimen &amp; occurrence records
      <span v-if="props.totalSpecimenCount" class="opacity-50 font-normal">({{ props.totalSpecimenCount }} specimens)</span>
    </VCardHeader>
    <VCardContent :class="isLoading && 'min-h-[6rem]'">
      <VSpinner v-if="isLoading" />

      <template v-if="!isLoading">
        <div v-if="activeFilters.length" class="flex flex-wrap gap-1.5 px-2 pb-3 border-b border-base-muted">
          <button
            v-for="pill in activeFilters"
            :key="pill.key"
            type="button"
            class="inline-flex items-center gap-1 text-xs font-medium bg-secondary text-secondary-content rounded-full px-2 py-0.5 cursor-pointer hover:bg-secondary/85"
            :title="`Clear ${pill.label}`"
            @click="pill.clear"
          >
            {{ pill.label }}
            <span class="opacity-70 leading-none">×</span>
          </button>
        </div>

        <div class="flex gap-4" :class="activeFilters.length ? 'mt-3' : ''">
          <div class="flex-1 min-w-0">
            <div v-if="activeView === 'phenology'" class="px-2">
              <div v-if="!hasAnyMonthData" class="text-sm opacity-50 py-4">No date data for the current filters.</div>
              <template v-else>
                <!--
                  Bars are direct children of the h-24 row so their
                  `height: X%` resolves against an explicit pixel height —
                  CSS percentage heights are ignored when the parent's
                  height is auto/content-based, which is what nesting a bar
                  inside a per-month flex column (itself unsized) did
                  before: every bar silently collapsed to 0. Labels are a
                  separate row below, using the same flex-1 sizing to stay
                  aligned under their bars. Clicking a bar filters the list
                  to that month and switches to List view to show the
                  result; clicking the active one again just clears the
                  filter.
                -->
                <!--
                  Solid bg-secondary at all times (not faded when
                  unselected) — same vibrant blue as the Timeline chart's
                  Collected bars. Selection is shown with an inset ring
                  instead of a color/opacity change, mirroring Timeline's
                  selected-year treatment.
                -->
                <div class="flex items-end gap-1 h-24">
                  <div
                    v-for="(count, i) in monthCounts"
                    :key="i"
                    class="flex-1 rounded-sm bg-secondary hover:brightness-110"
                    :class="[
                      count ? 'cursor-pointer' : '',
                      filterMonth === i + 1 ? 'ring-2 ring-inset ring-secondary-content' : ''
                    ]"
                    :style="{ height: count ? `${(count / maxMonthCount) * 100}%` : '1px' }"
                    :title="`${MONTH_LABELS[i]}: ${count}`"
                    @click="count && selectMonth(i + 1)"
                  />
                </div>
                <div class="flex gap-1 mt-0.5">
                  <span
                    v-for="(label, i) in MONTH_LABELS"
                    :key="label"
                    class="flex-1 text-[10px] text-center"
                    :class="filterMonth === i + 1 ? 'text-secondary font-medium' : 'opacity-50'"
                  >{{ label }}</span>
                </div>
              </template>
            </div>

            <div v-else-if="activeView === 'timeline'" class="px-2">
              <div v-if="!yearSlots.length" class="text-sm opacity-50 py-4">No date data for the current filters.</div>
              <template v-else>
                <!--
                  Toggle-able legend — doubles as the "Dates: Collected /
                  Identified" show/hide control from the reference chart,
                  rather than adding a second row that repeats the same two
                  labels. Filled = series visible, faded = hidden.
                -->
                <div class="flex items-center gap-2 text-[10px] mb-1">
                  <button
                    type="button"
                    class="flex items-center gap-1 rounded px-1.5 py-0.5 cursor-pointer"
                    :class="showCollected ? 'opacity-100' : 'opacity-35'"
                    @click="showCollected = !showCollected"
                  ><span class="inline-block w-2 h-2 rounded-sm bg-secondary" />Collected</button>
                  <button
                    type="button"
                    class="flex items-center gap-1 rounded px-1.5 py-0.5 cursor-pointer"
                    :class="showIdentified ? 'opacity-100' : 'opacity-35'"
                    @click="showIdentified = !showIdentified"
                  ><span class="inline-block w-2 h-2 rounded-sm" :style="{ background: IDENTIFIED_COLOR }" />Identified</button>
                </div>

                <!--
                  Real-time x-axis — one slot per calendar year across the
                  full min..max range (yearSlots fills in the zero-count gap
                  years), not just years that have a record, so a 16-year
                  gap between two data points reads as visible empty space
                  like CollectionDatabase's own chart. Every slot is the
                  same width (slotFlexStyle), clamped at MIN_SLOT_WIDTH so
                  bars stay hoverable whether there are a dozen years in
                  range or several hundred (beyond which the row scrolls
                  horizontally). Labels are thinned by actual pixel spacing
                  to avoid overlap.

                  Bar height is scaled against niceYAxis.max (a rounded
                  axis ceiling, e.g. 30 for a real max of 26), not the raw
                  max, so the tallest bar has headroom below the top
                  gridline — same as the reference.

                  Hover state is driven by one mousemove listener on the
                  relative-positioned row wrapper (see onTimelineMouseMove),
                  not per-bar hover — a dense chart's slots can still be
                  only MIN_SLOT_WIDTH px wide, too thin to hover reliably
                  one at a time.
                -->
                <div class="flex">
                  <div class="flex flex-col justify-between h-64 shrink-0 text-[10px] opacity-50 text-right pr-1.5">
                    <span v-for="tick in ticksDesc" :key="tick">{{ tick }}</span>
                  </div>

                  <div ref="timelineWrapperRef" class="flex-1 min-w-0 overflow-x-auto">
                    <div
                      class="relative"
                      :style="{ width: `${timelineContentWidth}px` }"
                      @mousemove="onTimelineMouseMove"
                      @mouseleave="onTimelineMouseLeave"
                    >
                      <div class="absolute inset-0 flex flex-col justify-between h-64 pointer-events-none">
                        <div v-for="tick in ticksDesc" :key="tick" class="border-t border-base-muted/40" />
                      </div>

                      <div class="relative flex items-end h-64">
                        <div
                          v-for="(slot, i) in yearSlots"
                          :key="slot.year"
                          class="flex items-end justify-center h-full"
                          :style="slotFlexStyle(i === yearSlots.length - 1)"
                        >
                          <div class="flex items-end gap-px h-full" :style="{ width: `${barWidthPx}px` }">
                            <div
                              class="flex-1 rounded-sm bg-secondary hover:brightness-110"
                              :class="[
                                showCollected && slot.collected ? 'cursor-pointer' : '',
                                filterYear === slot.year ? 'ring-2 ring-inset ring-secondary-content' : ''
                              ]"
                              :style="{ height: barHeight(slot.collected, showCollected) }"
                              @click="showCollected && slot.collected && selectYear(slot.year)"
                            />
                            <div
                              class="flex-1 rounded-sm hover:brightness-110"
                              :class="[
                                showIdentified && slot.identified ? 'cursor-pointer' : '',
                                filterIdentifiedYear === slot.year ? 'ring-2 ring-inset ring-secondary-content' : ''
                              ]"
                              :style="{ height: barHeight(slot.identified, showIdentified), background: IDENTIFIED_COLOR }"
                              @click="showIdentified && slot.identified && selectIdentifiedYear(slot.year)"
                            />
                          </div>
                        </div>
                      </div>

                      <template v-if="hoveredSlot">
                        <div
                          class="absolute top-0 bottom-0 border-l border-dashed border-base-soft pointer-events-none"
                          :style="{ left: `${hoveredSlot.left + hoveredSlot.width / 2}px` }"
                        />
                        <div
                          class="absolute z-10 top-0 rounded-md border border-base-border bg-base-foreground shadow-lg px-2 py-1 text-[11px] pointer-events-none whitespace-nowrap"
                          :style="{
                            left: `${hoveredSlot.left + hoveredSlot.width / 2}px`,
                            transform: hoveredSlot.left > timelineWrapperWidth / 2 ? 'translateX(calc(-100% - 6px))' : 'translateX(6px)'
                          }"
                        >
                          <div class="font-medium mb-0.5">{{ hoveredSlot.year }}</div>
                          <div class="flex items-center gap-1"><span class="inline-block w-2 h-2 rounded-full bg-secondary" />Collected<span class="ml-auto pl-2 font-medium">{{ hoveredSlot.collected }}</span></div>
                          <div class="flex items-center gap-1"><span class="inline-block w-2 h-2 rounded-full" :style="{ background: IDENTIFIED_COLOR }" />Identified<span class="ml-auto pl-2 font-medium">{{ hoveredSlot.identified }}</span></div>
                        </div>
                      </template>
                    </div>
                    <div class="flex mt-0.5">
                      <span
                        v-for="(slot, i) in yearSlots"
                        :key="slot.year"
                        class="text-[9px] text-center"
                        :style="slotFlexStyle(i === yearSlots.length - 1)"
                        :class="filterYear === slot.year || filterIdentifiedYear === slot.year ? 'text-secondary font-medium' : 'opacity-50'"
                      >{{ visibleYearLabels.has(slot.year) ? slot.year : '' }}</span>
                    </div>
                  </div>
                </div>

                <div v-if="notShownParts.length" class="text-[10px] opacity-50 mt-1.5 pl-1">
                  Not shown: {{ notShownParts.join('; ') }}.
                </div>
              </template>
            </div>

            <ul v-else>
              <li
                v-for="item in items"
                :key="item.key"
                class="flex flex-col text-sm px-2 py-4 gap-2 border-b border-base-muted first:pt-0 last:pb-0 last:border-none"
                :class="item.detail ? 'cursor-pointer hover:bg-base-muted' : ''"
                @click="item.detail && emit('show-detail', item.detail)"
              >
                <div class="flex flex-col">
                  <span
                    v-if="item.typeStatus"
                    class="inline-block w-fit text-xs font-medium bg-danger text-white rounded px-1.5 py-0.5 mb-1"
                    v-html="item.typeStatusHtml"
                  />
                  <div v-if="item.identity || item.identificationQualifierHtml" class="flex items-baseline gap-2 text-xs">
                    <span class="flex-1 min-w-0" v-html="item.identity" />
                    <span v-if="item.identificationQualifierHtml" class="shrink-0" v-html="item.identificationQualifierHtml" />
                  </div>
                  <span class="font-medium">{{ item.headline }}</span>
                  <span class="text-xs" v-html="item.summary" />
                </div>
                <details v-if="item.recordEntries" class="text-xs group">
                  <summary class="cursor-pointer text-secondary opacity-60 hover:opacity-100 select-none list-none flex items-center gap-1.5">
                    <span class="inline-block motion-safe:transition-transform group-open:rotate-90">›</span>
                    Individual records
                    <span class="inline-block text-xs font-medium bg-secondary text-secondary-content rounded px-1.5 py-0.5">{{ item.recordEntries.length }}</span>
                  </summary>
                  <ul class="mt-1 flex flex-col gap-0.5">
                    <li
                      v-for="entry in item.recordEntries"
                      :key="entry.key"
                      class="rounded px-1 py-0.5 -mx-1"
                      :class="entry.detail ? 'cursor-pointer text-secondary hover:bg-base-muted' : ''"
                      @click="entry.detail && emit('show-detail', entry.detail)"
                    >{{ entry.label }}</li>
                  </ul>
                </details>
                <GalleryThumbnailList
                  v-if="item.associatedMedia?.length"
                  :images="item.associatedMedia"
                  class="w-fit lg:flex-row gap-2 flex-wrap"
                  @click.stop
                  @select-index="
                    (index) => emit('select', { images: item.associatedMedia, index })
                  "
                />
              </li>
              <li
                v-if="!showAll && list.length > props.max"
                class="flex justify-start pt-4 px-2 cursor-pointer border-base-muted text-sm"
              >
                <div
                  class="h-5 w-5 text-secondary opacity-60 mr-2 cursor-pointer"
                  @click="() => (showAll = true)"
                >
                  <IconPlusCircle class="h-5 w-5" />
                </div>
                <span @click="() => (showAll = true)"
                  >... Show all ... ({{ list.length }})</span
                >
              </li>
              <li
                v-else-if="!list.length"
                class="px-2 py-4 text-sm opacity-50"
              >No specimen or field-occurrence records.</li>
            </ul>
          </div>

          <div class="w-40 shrink-0 flex flex-col gap-2 pl-3 border-l border-base-muted text-sm">
            <div class="flex flex-col gap-1 mb-1">
              <VButton size="sm" variant="secondary" :ghost="activeView !== 'list'" @click="activeView = 'list'">List</VButton>
              <VButton size="sm" variant="secondary" :ghost="activeView !== 'phenology'" @click="activeView = 'phenology'">Phenology</VButton>
              <VButton size="sm" variant="secondary" :ghost="activeView !== 'timeline'" @click="activeView = 'timeline'">Timeline</VButton>
            </div>
            <MultiSelect v-model="filterCountries" :options="countries" placeholder="All countries" />
            <MultiSelect v-model="filterCollectors" :options="collectors" placeholder="All collectors" />
            <VToggle v-model="filterTypeOnly" size="sm">Type specimens only</VToggle>
            <VToggle v-model="filterMediaOnly" size="sm">Has media only</VToggle>
          </div>
        </div>
      </template>
    </VCardContent>
  </VCard>
</template>

<script setup>
import GalleryThumbnailList from '@/components/Gallery/GalleryThumbnailList.vue'
import MultiSelect from './MultiSelect.vue'
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import '../../_shared/panel-tokens.css'

// Colour of the phenology timeline's "Identified" series — defined in
// panels/_shared/panel-tokens.css (theme-aware, host-overridable), imported
// above so this panel carries it when installed elsewhere.
const IDENTIFIED_COLOR = 'var(--pp-accent-identified)'

const props = defineProps({
  list: {
    type: Array,
    default: () => []
  },

  isLoading: {
    type: Boolean,
    default: false
  },

  max: {
    type: Number,
    default: 2
  },

  // individualCount summed across every currently-filtered record — shown
  // in the header, distinct from list.length (grouped rows).
  totalSpecimenCount: {
    type: Number,
    default: 0
  },

  countries: {
    type: Array,
    default: () => []
  },

  collectors: {
    type: Array,
    default: () => []
  },

  // Count of records per month, index 0 = January.
  monthCounts: {
    type: Array,
    default: () => Array(12).fill(0)
  },

  // Count of records per collecting year, sparse — only years with a
  // record, sorted ascending: [{ year, count }].
  yearCounts: {
    type: Array,
    default: () => []
  },

  // Same shape as yearCounts, but keyed off dateIdentified instead of the
  // collecting date.
  identifiedYearCounts: {
    type: Array,
    default: () => []
  },

  // Records excluded from each timeline series for lacking a usable date —
  // surfaced as a "Not shown: N without a ... date" footer note.
  notShownCollectedCount: {
    type: Number,
    default: 0
  },

  notShownIdentifiedCount: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['select', 'show-detail'])

const filterCountries = defineModel('filterCountries')
const filterCollectors = defineModel('filterCollectors')
const filterTypeOnly = defineModel('filterTypeOnly')
const filterMediaOnly = defineModel('filterMediaOnly')
const filterMonth = defineModel('filterMonth')
const filterYear = defineModel('filterYear')
const filterIdentifiedYear = defineModel('filterIdentifiedYear')

const showAll = ref(false)
const activeView = ref('list')

const items = computed(() =>
  showAll.value ? props.list : props.list.slice(0, props.max)
)

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const maxMonthCount = computed(() => Math.max(...props.monthCounts, 1))
const hasAnyMonthData = computed(() => props.monthCounts.some((count) => count > 0))

// Which series are currently drawn — local UI state (not a filter), toggled
// by clicking the legend swatches above the chart.
const showCollected = ref(true)
const showIdentified = ref(true)

// Real-time x-axis — one slot per calendar year across the full min..max
// range, including years with no record at all, so a 16-year gap between
// two data years shows as visible empty space (bar position reflects real
// elapsed time) — matching CollectionDatabase's own "Specimens over time"
// chart. The printed year labels underneath (see visibleYearLabels) are
// thinned to avoid collision, same as before.
const yearSlots = computed(() => {
  const collectedByYear = new Map(props.yearCounts.map((e) => [e.year, e.count]))
  const identifiedByYear = new Map(props.identifiedYearCounts.map((e) => [e.year, e.count]))
  const years = [...collectedByYear.keys(), ...identifiedByYear.keys()]
  if (!years.length) return []
  const minYear = Math.min(...years)
  const maxYear = Math.max(...years)
  const slots = []
  for (let year = minYear; year <= maxYear; year++) {
    slots.push({
      year,
      collected: collectedByYear.get(year) || 0,
      identified: identifiedByYear.get(year) || 0
    })
  }
  return slots
})

// Round a raw step up to a "nice" human number (1/2/5/10/20/25/50/...) —
// the same approach charting libraries use to pick axis ticks, so the
// y-axis reads 0/5/10/.../30 rather than 0/6.5/13/....
function niceStep(rawStep) {
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const residual = rawStep / magnitude
  let niceResidual
  if (residual > 5) niceResidual = 10
  else if (residual > 2) niceResidual = 5
  else if (residual > 1) niceResidual = 2
  else niceResidual = 1
  return Math.max(1, Math.round(niceResidual * magnitude))
}

// Targets ~6 gridlines regardless of the data's actual max, e.g. a real max
// of 26 becomes ticks 0/5/10/.../30 (step 5) — matching the reference chart.
const TARGET_TICKS = 6
function niceTicks(maxValue) {
  const step = niceStep(maxValue / TARGET_TICKS)
  const max = Math.ceil(maxValue / step) * step
  const ticks = []
  for (let v = 0; v <= max; v += step) ticks.push(v)
  return { max, ticks }
}

// Only the visible series count toward the axis scale — hiding "Identified"
// lets the y-axis (and bar heights) rescale to whatever "Collected" alone
// needs, rather than keeping headroom for a series that isn't drawn.
const visibleMaxYearCount = computed(() => {
  const collectedMax = showCollected.value ? Math.max(0, ...props.yearCounts.map((e) => e.count)) : 0
  const identifiedMax = showIdentified.value ? Math.max(0, ...props.identifiedYearCounts.map((e) => e.count)) : 0
  return Math.max(collectedMax, identifiedMax, 1)
})

const niceYAxis = computed(() => niceTicks(visibleMaxYearCount.value))
const ticksDesc = computed(() => [...niceYAxis.value.ticks].reverse())

// Bar height as a CSS value, scaled against the rounded axis max (not the
// raw data max) so the tallest bar has headroom below the top gridline.
// Zero (hidden series, or a genuinely zero-count year) renders no bar at
// all — a 1px hairline placeholder here used to make a real-but-tiny count
// (e.g. 1 out of a max of 155) visually indistinguishable from an actual
// zero once scaled down that far, which is worse than just showing nothing
// for zero.
function barHeight(count, visible) {
  if (!visible || !count) return '0px'
  return `${(count / niceYAxis.value.max) * 100}%`
}

const notShownParts = computed(() => {
  const parts = []
  if (props.notShownCollectedCount) parts.push(`${props.notShownCollectedCount} without a collecting date`)
  if (props.notShownIdentifiedCount) parts.push(`${props.notShownIdentifiedCount} without an identification date`)
  return parts
})

// v-else-if swaps the timeline div in and out of the DOM as activeView
// changes (it isn't present on initial mount, since 'list' is the default
// view), so the observer has to attach/detach reactively off the ref itself
// rather than once in onMounted — which would run before this element ever
// exists.
const timelineWrapperRef = ref(null)
const timelineWrapperWidth = ref(0)
let timelineResizeObserver = null

watch(timelineWrapperRef, (el) => {
  timelineResizeObserver?.disconnect()
  if (!el) return
  timelineResizeObserver = new ResizeObserver((entries) => {
    timelineWrapperWidth.value = entries[0].contentRect.width
  })
  timelineResizeObserver.observe(el)
})

onBeforeUnmount(() => {
  timelineResizeObserver?.disconnect()
})

// Every slot is the same width, and slots always divide the FULL available
// row width evenly between them — a sparse range (2-3 data years) spreads
// them out across the whole panel just like a dense one (hundreds of data
// years) does, so the chart never leaves dead space on the right. Only a
// floor is enforced (stays hoverable even with hundreds of data years,
// beyond which the row scrolls horizontally rather than compressing
// further) — there's no ceiling on slot width any more.
//
// The visible BAR is a separate, much narrower fixed-max-width element
// centered inside its slot (see barWidthPx) — this is what keeps bars
// looking thin regardless of slot width: a sparse range gets wide slots
// with a small bar centered in each (lots of surrounding whitespace, like
// CollectionDatabase's own chart), not a wide bar filling the whole slot.
const MIN_SLOT_WIDTH = 9
const BAR_MAX_WIDTH = 14
const SLOT_GAP = 4

const slotWidthPx = computed(() => {
  const n = yearSlots.value.length
  if (!n || !timelineWrapperWidth.value) return MIN_SLOT_WIDTH
  const available = timelineWrapperWidth.value - (n - 1) * SLOT_GAP
  return Math.max(MIN_SLOT_WIDTH, available / n)
})

// The bar itself never exceeds BAR_MAX_WIDTH, but shrinks below it if the
// slot is narrower (a dense chart with many data years) so it never
// overflows its own slot.
const barWidthPx = computed(() => Math.min(BAR_MAX_WIDTH, slotWidthPx.value))

// Explicit content width for the bars/gridlines row, rather than relying on
// implicit flex overflow — the gridlines overlay is `absolute inset-0`, so
// it needs its positioned-ancestor's box to actually span the full
// scrollable width, not just the visible viewport.
const timelineContentWidth = computed(() => {
  const n = yearSlots.value.length
  if (!n) return 0
  return n * slotWidthPx.value + (n - 1) * SLOT_GAP
})

function slotFlexStyle(isLast) {
  const width = slotWidthPx.value
  // timelineContentWidth budgets only n-1 gaps, so the last slot must not
  // carry a trailing marginRight or the row overflows its container by SLOT_GAP.
  return { flex: `0 0 ${width}px`, width: `${width}px`, marginRight: isLast ? '0px' : `${SLOT_GAP}px` }
}

// Left-edge x offset (px, in the bars row's own unscrolled coordinate
// space) of every slot — trivial now that every slot is the same width,
// but still precomputed once per width/data change so the mousemove
// handler below is just an array scan, not a layout recompute on every
// pixel of mouse movement.
const yearSlotOffsets = computed(() =>
  yearSlots.value.map((slot, i) => ({ ...slot, left: i * (slotWidthPx.value + SLOT_GAP), width: slotWidthPx.value }))
)

// Which years get a printed label under the bars. Walks actual pixel
// positions and only keeps a year once it's at least MIN_LABEL_SPACING past
// the last kept one, so labels never collide regardless of how many data
// years there are. Always keeps the first and last year so the range's
// actual bounds are legible.
const MIN_LABEL_SPACING = 38
const visibleYearLabels = computed(() => {
  const offsets = yearSlotOffsets.value
  if (!offsets.length) return new Set()
  const kept = [offsets[0]]
  for (const slot of offsets.slice(1, -1)) {
    if (slot.left - kept[kept.length - 1].left >= MIN_LABEL_SPACING) kept.push(slot)
  }
  const last = offsets[offsets.length - 1]
  if (offsets.length > 1) {
    if (last.left - kept[kept.length - 1].left < MIN_LABEL_SPACING) kept.pop()
    kept.push(last)
  }
  return new Set(kept.map((slot) => slot.year))
})

// Clicking a bar filters to that month and jumps straight to the list that
// now matches it — clicking the already-active month clears the filter but
// stays on the chart, since that's a "never mind" gesture, not a "show me".
function selectMonth(month) {
  if (filterMonth.value === month) {
    filterMonth.value = null
    return
  }
  filterMonth.value = month
  activeView.value = 'list'
}

// Mirrors selectMonth() for the timeline chart's Collected (blue) bars.
function selectYear(year) {
  if (filterYear.value === year) {
    filterYear.value = null
    return
  }
  filterYear.value = year
  activeView.value = 'list'
}

// Mirrors selectYear() for the timeline chart's Identified (orange) bars —
// a separate filter axis (identification year, not collecting year).
function selectIdentifiedYear(year) {
  if (filterIdentifiedYear.value === year) {
    filterIdentifiedYear.value = null
    return
  }
  filterIdentifiedYear.value = year
  activeView.value = 'list'
}

// Crosshair tooltip that tracks the mouse across the whole timeline row,
// not just while pointed at one skinny bar — a dense chart can still have
// MIN_SLOT_WIDTH-wide (9px) slots, thin enough that per-bar hover misses
// clicks/moves that land in the gap between bars. Handler lives on the row
// container and scans yearSlotOffsets for whichever slot the cursor's x
// falls into, rather than attaching per-bar hover listeners.
const hoveredSlot = ref(null)

function onTimelineMouseMove(event) {
  const rect = event.currentTarget.getBoundingClientRect()
  const x = event.clientX - rect.left
  hoveredSlot.value = yearSlotOffsets.value.find((slot) => x >= slot.left && x < slot.left + slot.width + SLOT_GAP)
    || null
}

function onTimelineMouseLeave() {
  hoveredSlot.value = null
}

// One pill per active filter value (not one combined pill per filter type) —
// so selecting two countries shows two removable pills, matching the "×
// clears just this one" affordance.
const activeFilters = computed(() => {
  const pills = []
  ;(filterCountries.value || []).forEach((country) => {
    pills.push({
      key: `country:${country}`,
      label: `Country: ${country}`,
      clear: () => (filterCountries.value = filterCountries.value.filter((c) => c !== country))
    })
  })
  ;(filterCollectors.value || []).forEach((collector) => {
    pills.push({
      key: `collector:${collector}`,
      label: `Collector: ${collector}`,
      clear: () => (filterCollectors.value = filterCollectors.value.filter((c) => c !== collector))
    })
  })
  if (filterTypeOnly.value) {
    pills.push({ key: 'type', label: 'Type specimens only', clear: () => (filterTypeOnly.value = false) })
  }
  if (filterMediaOnly.value) {
    pills.push({ key: 'media', label: 'Has media only', clear: () => (filterMediaOnly.value = false) })
  }
  if (filterMonth.value) {
    pills.push({
      key: 'month',
      label: `Month: ${MONTH_LABELS[filterMonth.value - 1]}`,
      clear: () => (filterMonth.value = null)
    })
  }
  if (filterYear.value) {
    pills.push({
      key: 'year',
      label: `Year: ${filterYear.value}`,
      clear: () => (filterYear.value = null)
    })
  }
  if (filterIdentifiedYear.value) {
    pills.push({
      key: 'identified-year',
      label: `Identified: ${filterIdentifiedYear.value}`,
      clear: () => (filterIdentifiedYear.value = null)
    })
  }
  return pills
})
</script>
