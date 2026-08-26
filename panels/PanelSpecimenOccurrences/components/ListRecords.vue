<template>
  <VCard>
    <VCardHeader>Specimen &amp; occurrence records</VCardHeader>
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
                <div class="flex items-end gap-1 h-24">
                  <div
                    v-for="(count, i) in monthCounts"
                    :key="i"
                    class="flex-1 rounded-sm cursor-pointer"
                    :class="filterMonth === i + 1 ? 'bg-secondary' : 'bg-secondary/40 hover:bg-secondary/70'"
                    :style="{ height: count ? `${(count / maxMonthCount) * 100}%` : '1px' }"
                    :title="`${MONTH_LABELS[i]}: ${count}`"
                    @click="selectMonth(i + 1)"
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
                    class="inline-block w-fit text-xs font-medium bg-red-500 text-white rounded px-1.5 py-0.5 mb-1"
                    v-html="item.typeStatusHtml"
                  />
                  <span v-if="item.nameNote" class="text-xs italic text-secondary">{{ item.nameNote }}</span>
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
import { computed, ref } from 'vue'

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
  }
})

const emit = defineEmits(['select', 'show-detail'])

const filterCountries = defineModel('filterCountries')
const filterCollectors = defineModel('filterCollectors')
const filterTypeOnly = defineModel('filterTypeOnly')
const filterMediaOnly = defineModel('filterMediaOnly')
const filterMonth = defineModel('filterMonth')

const showAll = ref(false)
const activeView = ref('list')

const items = computed(() =>
  showAll.value ? props.list : props.list.slice(0, props.max)
)

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const maxMonthCount = computed(() => Math.max(...props.monthCounts, 1))
const hasAnyMonthData = computed(() => props.monthCounts.some((count) => count > 0))

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
  return pills
})
</script>
