<template>
  <div class="flex flex-col gap-3">
    <ListRecords
      :list="listItems"
      :is-loading="isLoading"
      :max="MAX"
      :countries="availableCountries"
      :collectors="availableCollectors"
      :month-counts="monthCounts"
      :year-counts="yearCounts"
      :identified-year-counts="identifiedYearCounts"
      :not-shown-collected-count="notShownCollectedCount"
      :not-shown-identified-count="notShownIdentifiedCount"
      v-model:filter-countries="filterCountries"
      v-model:filter-collectors="filterCollectors"
      v-model:filter-type-only="filterTypeOnly"
      v-model:filter-media-only="filterMediaOnly"
      v-model:filter-month="filterMonth"
      v-model:filter-year="filterYear"
      v-model:filter-identified-year="filterIdentifiedYear"
      @select="setCurrentImages"
      @show-detail="showDetail"
    />

    <DwcTable ref="dwcTableRef" />

    <ImageViewer
      v-if="isViewerVisible"
      :images="currentImages"
      :index="currentIndex"
      :next="currentImages.length - 1 > currentIndex"
      :previous="currentIndex > 0"
      @select-index="(index) => (currentIndex = index)"
      @next="() => currentIndex++"
      @previous="() => currentIndex--"
      @close="() => (isViewerVisible = false)"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { makeAPIRequest } from '@/utils'
import ListRecords from './components/ListRecords.vue'
import DwcTable from '../_shared/DwcTable.vue'
import { isSpecimenType } from '../_shared/specimenRef.js'
import { groupRecords, groupCountLabel } from './lib/groupRecords'

// Module-level cache: institutionCode → full name
const instNameCache = new Map()

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

// Type material labels look like "Holotype; adult; <identifier>; deposited at: <institution>; <verbatim>"
// <identifier> is the catalogNumber, or (when none was entered) the specimen's occurrenceID UUID.
// The "deposited at:" segment is sometimes absent (no repository recorded), so look for a bare
// UUID first — it's unambiguous regardless of label shape — before falling back to position.
function extractTypeIdentifier(label) {
  const uuidMatch = label.match(UUID_RE)
  if (uuidMatch) return uuidMatch[0]

  const parts = label.split('; ')
  const depositedIndex = parts.findIndex((p) => p.startsWith('deposited at:'))
  return depositedIndex > 0 ? parts[depositedIndex - 1].trim() : null
}

// Type specimens are only found by the OTU dwc.json endpoint when they carry a current
// determination to this OTU. Specimens whose determination was never updated (e.g. after
// a name change) are known to TaxonWorks only via type_material.json, so fetch those
// individually and merge them in.
async function fetchMissingTypeSpecimens(typeLabels, existingRecords) {
  const known = new Set(existingRecords.map((r) => r.occurrenceID).filter(Boolean))
  const queued = new Set()
  const found = []

  await Promise.all(
    typeLabels.map(async ({ label }) => {
      const identifier = extractTypeIdentifier(label)
      if (!identifier || queued.has(identifier)) return
      queued.add(identifier)

      const isUuid = UUID_RE.test(identifier)
      if (isUuid && known.has(identifier)) return
      if (!isUuid && existingRecords.some((r) => r.catalogNumber === identifier)) return

      try {
        const { data } = await makeAPIRequest.get('/dwc_occurrences.json', {
          params: isUuid ? { occurrenceID: identifier } : { catalogNumber: identifier }
        })
        if (data?.length === 1) found.push(data[0])
      } catch {}
    })
  )

  return found
}

async function resolveInstitutionName(code, institutionID) {
  if (!code) return null
  if (instNameCache.has(code)) return instNameCache.get(code)
  try {
    if (institutionID) {
      const r = await fetch(`https://api.gbif.org/v1/grscicoll/institution?identifier=${encodeURIComponent(institutionID)}`)
      if (r.ok) {
        const j = await r.json()
        if (j.results?.length === 1) {
          instNameCache.set(code, j.results[0].name)
          return j.results[0].name
        }
      }
    }
    const r = await fetch(`https://api.gbif.org/v1/grscicoll/institution?code=${encodeURIComponent(code)}`)
    if (r.ok) {
      const j = await r.json()
      if (j.results?.length === 1) {
        instNameCache.set(code, j.results[0].name)
        return j.results[0].name
      }
    }
  } catch {}
  instNameCache.set(code, null)
  return null
}

const MAX = 10

const props = defineProps({
  otuId: {
    type: Number,
    required: true
  }
})

const currentIndex = ref(0)
const currentImages = ref([])
const isViewerVisible = ref(false)
const isLoading = ref(false)
const dwcTableRef = ref(null)

const dwcRecords = ref([])

// Basic client-side filters — all data for this OTU is already fetched, so
// filtering/re-grouping is instant with no extra API calls.
const filterCountries = ref([])
const filterCollectors = ref([])
const filterTypeOnly = ref(false)
const filterMediaOnly = ref(false)
// Set by clicking a phenology/timeline bar — kept separate from the other
// filters below so each chart can keep showing its own counts (filtered by
// everything except itself) rather than collapsing to just the selected
// bar once one is picked. Month and year cross-filter each other: picking
// a year narrows the month chart and vice versa.
const filterMonth = ref(null)
const filterYear = ref(null)
// Set by clicking a Timeline "Identified" bar — an independent axis from
// filterMonth/filterYear (those are collecting-date concepts, this is an
// identification-date one), so it only narrows the final list, not the
// collecting-date charts.
const filterIdentifiedYear = ref(null)

const availableCountries = computed(() =>
  [...new Set(dwcRecords.value.map((r) => r.country).filter(Boolean))].sort()
)

const availableCollectors = computed(() =>
  [...new Set(dwcRecords.value.map((r) => r.recordedBy).filter(Boolean))].sort()
)

function matchesBaseFilters(r) {
  if (filterCountries.value.length && !filterCountries.value.includes(r.country)) return false
  if (filterCollectors.value.length && !filterCollectors.value.includes(r.recordedBy)) return false
  if (filterTypeOnly.value && !r.typeStatus) return false
  if (filterMediaOnly.value && !(r.associatedMedia && r.associatedMedia.length)) return false
  return true
}

const baseFilteredRecords = computed(() => dwcRecords.value.filter(matchesBaseFilters))

const recordsBeforeMonthFilter = computed(() =>
  baseFilteredRecords.value.filter(
    (r) => filterYear.value == null || Number(r.year) === filterYear.value
  )
)

const recordsBeforeYearFilter = computed(() =>
  baseFilteredRecords.value.filter(
    (r) => filterMonth.value == null || Number(r.month) === filterMonth.value
  )
)

const filteredRecords = computed(() =>
  recordsBeforeMonthFilter.value
    .filter((r) => filterMonth.value == null || Number(r.month) === filterMonth.value)
    .filter((r) => filterIdentifiedYear.value == null || getIdentifiedYear(r) === filterIdentifiedYear.value)
)

// Collecting-date histogram (1 count per month, 1-12), filtered by
// everything except the month click itself — dwc.json already returns
// `month` per record, no separate fetch needed.
const monthCounts = computed(() => {
  const counts = Array(12).fill(0)
  recordsBeforeMonthFilter.value.forEach((r) => {
    const month = Number(r.month)
    if (month >= 1 && month <= 12) counts[month - 1]++
  })
  return counts
})

// Specimens-collected-per-year — sparse data, only years that actually have
// a record, sorted ascending. ListRecords.vue's timeline chart fills in the
// zero-count years between min and max itself (so bar position reflects
// real elapsed time); this computed only needs to report what's there.
const yearCounts = computed(() => {
  const counts = new Map()
  recordsBeforeYearFilter.value.forEach((r) => {
    const year = Number(r.year)
    if (year) counts.set(year, (counts.get(year) || 0) + 1)
  })
  return [...counts.entries()]
    .sort(([a], [b]) => a - b)
    .map(([year, count]) => ({ year, count }))
})

// dateIdentified is DWC-flexible (yyyy, yyyy-mm, or yyyy-mm-dd) — only the
// leading year is needed here, same as getDate() only needs a leading year
// for grouping elsewhere.
function getIdentifiedYear({ dateIdentified }) {
  return dateIdentified ? Number(String(dateIdentified).match(/^\d{4}/)?.[0]) : null
}

// Specimens-identified-per-year, same shape/sparsity as yearCounts. Kept
// off baseFilteredRecords (not cross-filtered against filterMonth/filterYear
// like the collected-date series) since those two filters are collecting-
// date concepts — narrowing the identification-date series by a collecting
// month/year selection would answer a different question than the chart is
// asking.
const identifiedYearCounts = computed(() => {
  const counts = new Map()
  baseFilteredRecords.value.forEach((r) => {
    const year = getIdentifiedYear(r)
    if (year) counts.set(year, (counts.get(year) || 0) + 1)
  })
  return [...counts.entries()]
    .sort(([a], [b]) => a - b)
    .map(([year, count]) => ({ year, count }))
})

// Counts for the timeline chart's "Not shown: N without a ... date" footer
// note — same source populations as yearCounts/identifiedYearCounts above,
// just counting the records that don't carry a usable year rather than
// tallying by year.
const notShownCollectedCount = computed(
  () => recordsBeforeYearFilter.value.filter((r) => !Number(r.year)).length
)

const notShownIdentifiedCount = computed(
  () => baseFilteredRecords.value.filter((r) => !getIdentifiedYear(r)).length
)

function loadDwc() {
  isLoading.value = true
  Promise.all([
    makeAPIRequest.get(`/otus/${props.otuId}/inventory/dwc.json`),
    makeAPIRequest
      .get(`/otus/${props.otuId}/inventory/type_material.json`)
      .catch(() => ({ data: { type_materials_catalog_labels: [] } }))
  ])
    .then(async ([{ data: rawData }, { data: typeMaterialData }]) => {
      // dwc_occurrence is polymorphic — the endpoint also returns
      // AssertedDistribution (citation-based distribution, not a physical
      // specimen) and potentially other object types. Allow-list rather
      // than deny-list a single type.
      const data = rawData.filter(
        (d) =>
          d.dwc_occurrence_object_type === 'CollectionObject' ||
          d.dwc_occurrence_object_type === 'FieldOccurrence'
      )

      const missingTypeSpecimens = await fetchMissingTypeSpecimens(
        typeMaterialData.type_materials_catalog_labels || [],
        data
      )
      data.push(...missingTypeSpecimens)

      await Promise.all(
        data.map(async (item) => {
          if (item.associatedMedia) {
            item.associatedMedia = await getMediaImages(item)
          }
        })
      )

      // Resolve institution names for unique codes (deduplicated by code)
      const seenCodes = new Set()
      await Promise.all(
        data
          .filter((d) => d.institutionCode && !seenCodes.has(d.institutionCode) && seenCodes.add(d.institutionCode))
          .map((d) => resolveInstitutionName(d.institutionCode, d.institutionID))
      )

      dwcRecords.value = data.map((d) => ({
        ...d,
        headline: getHeadline(d),
        summary: makeSummary(d)
      }))
    })
    .finally(() => {
      isLoading.value = false
    })
}

// One ordered list of every populated locality field (country/state first,
// down to the most specific verbatim text), computed once so the headline
// and detail line can split it without either duplicating or dropping a
// field. Earlier versions checked country/stateProvince for the headline
// and a *different*, non-overlapping field set for the detail line — a
// record with only e.g. `county` populated (no country) fell through both
// checks and showed a wrong "No locality data" headline despite having a
// real locality one field over.
function localityParts(data) {
  const parts = []
  const primary = [data.country, data.stateProvince].filter(Boolean).join(', ')
  if (primary) parts.push(primary)
  if (data.waterBody) parts.push(data.waterBody)
  const islands = [data.islandGroup, data.island].filter(Boolean).join(', ')
  if (islands) parts.push(islands)
  if (data.county) parts.push(data.county)
  if (data.municipality) parts.push(data.municipality)
  if (data.locality) parts.push(data.locality)
  // verbatimLocality duplicates the geocoded `locality` field often enough
  // to skip it when they match — same dedup DwcTable.vue's Location section
  // already does.
  if (data.verbatimLocality && data.verbatimLocality !== data.locality) {
    parts.push(data.verbatimLocality)
  }
  return parts
}

// The headline (bold, scanned first) is whichever locality piece is most
// general/available — country/state when present, otherwise whatever the
// first non-empty field in localityParts() turns out to be. Only genuinely
// empty records (nothing in any locality field) show "No locality data".
function getHeadline(data) {
  return localityParts(data)[0] || 'No locality data'
}

// Everything localityParts() found beyond whatever became the headline.
function getLocalityDetail(data) {
  return localityParts(data).slice(1).join(', ')
}

function makeSummary(item) {
  return item.dwc_occurrence_object_type === 'FieldOccurrence'
    ? makeFieldOccurrenceSummary(item)
    : makeSpecimenSummary(item)
}

function makeSpecimenSummary(item) {
  return [
    getCountAndSex(item),
    getDepositoryData(item),
    getCatalogNumberHtml(item),
    getLocalityDetail(item),
    getDate(item),
    getCoordinates(item),
    getCollector(item)
  ]
    .filter(Boolean)
    .join(' · ')
}

function makeFieldOccurrenceSummary(item) {
  return [
    getCountAndSex(item),
    getLocalityDetail(item),
    getDate(item),
    getCoordinates(item),
    getCollector(item)
  ]
    .filter(Boolean)
    .join(' · ')
}

// Shared summary for a collapsed group of 2+ records: same pieces as
// makeSpecimenSummary/makeFieldOccurrenceSummary, but the per-record
// count+sex is replaced by the group's aggregated count (groupCountLabel)
// and the single catalogNumber is dropped (the list component renders an
// "Individual records" disclosure for groups instead).
function makeGroupSummary(group) {
  const first = group.records[0]
  const parts = [groupCountLabel(group)]
  if (first.dwc_occurrence_object_type === 'CollectionObject') {
    parts.push(getDepositoryData(first))
  }
  parts.push(getLocalityDetail(first), getDate(first), getCoordinates(first), getCollector(first))
  return parts.filter(Boolean).join(' · ')
}

function getCatalogNumberHtml({ catalogNumber }) {
  return catalogNumber ? `<span class="font-mono text-secondary">${escHtml(catalogNumber)}</span>` : ''
}

function getDepositoryData(data) {
  const { institutionCode, institutionID } = data
  if (!institutionCode) return
  const fullName = instNameCache.get(institutionCode)
  const display = fullName ? `${fullName} (${institutionCode})` : institutionCode
  return institutionID
    ? `<a href="${institutionID}" target="_blank">${display}</a>`
    : `<span>${display}</span>`
}

function getCountAndSex({ individualCount, sex, dwc_occurrence_object_type }) {
  if (sex) return `${individualCount} ${sex}`
  const noun = dwc_occurrence_object_type === 'FieldOccurrence' ? 'occurrence' : 'specimen'
  return `${individualCount} ${noun}${individualCount > 1 ? 's' : ''}`
}

function getCollector({ recordedBy }) {
  return recordedBy ? `Col. ${recordedBy}` : ''
}

function getDate({ eventDate, year, month, day }) {
  return eventDate || [year, month, day].filter(Boolean).join('-')
}

// Matches the ±250m / ±2.5km convention already established for this exact
// field elsewhere (CollectionDatabase's format_coordinates): meters below
// 1000, one-decimal km at or above.
function formatUncertainty(meters) {
  const m = Number(meters)
  if (!m) return ''
  return m < 1000 ? ` ±${Math.round(m)}m` : ` ±${(m / 1000).toFixed(1)}km`
}

function getCoordinates({ verbatimCoordinates, coordinateUncertaintyInMeters }) {
  const coordinates = verbatimCoordinates?.split(' ').join(', ')
  if (!coordinates) return ''

  return `(${coordinates}${formatUncertainty(coordinateUncertaintyInMeters)})`
}

// Mirrors DwcTable.vue's typeStatusHtml logic exactly (kept as a local
// duplicate rather than a _shared/ export, so this panel doesn't add a
// fifth dependent to that file): italicize the scientific name embedded in
// a typeStatus string like "lectotype of Bothynoderus communis Motschulsky,
// 1860", keeping the "lectotype of " prefix and trailing author/year roman.
function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function splitScientificName(name) {
  const words = (name || '').trim().split(/\s+/)
  let i = 1
  while (i < words.length) {
    const w = words[i]
    if (/^[a-z]/.test(w)) {
      i++
      continue
    }
    if (/^\(/.test(w) && /^[a-z]/.test(words[i + 1] || '')) {
      i++
      continue
    }
    if (/^\[/.test(w)) {
      i++
      continue
    }
    break
  }
  return { italic: words.slice(0, i).join(' '), plain: words.slice(i).join(' ') }
}

function typeStatusHtml(typeStatus) {
  if (!typeStatus) return ''
  const idx = typeStatus.indexOf(' of ')
  if (idx === -1) return escHtml(typeStatus)
  const prefix = typeStatus.slice(0, idx + 4)
  const { italic, plain } = splitScientificName(typeStatus.slice(idx + 4))
  return (
    escHtml(prefix) +
    (italic ? `<em>${escHtml(italic)}</em>` : '') +
    (plain ? ` ${escHtml(plain)}` : '')
  )
}

// The only place raw dwc_occurrence_object_id/dwc_occurrence_object_type are
// read and validated. Returns null for anything not safe to hand to
// DwcTable.show() — a missing id, or a type other than the two it accepts.
function toDetailRef(record) {
  const { dwc_occurrence_object_id: id, dwc_occurrence_object_type: type } = record
  return id && isSpecimenType(type) ? { id, type } : null
}

// Catalog numbers aren't a primary identifier for this database, so a plain
// ordinal fallback is fine when one isn't recorded.
function toRecordEntry(record, index) {
  return {
    key: record.id ?? index,
    label: record.catalogNumber || `Record ${index + 1}`,
    detail: toDetailRef(record)
  }
}

// Specimens on an OTU page are usually all determined to the same name, so
// showing that name on every row is redundant — but a subspecies or a
// synonym can slip in with a different scientificName. Flag whichever name
// is the minority on this page rather than assuming the OTU's own canonical
// name matches DWC's scientificName formatting (author/year placement
// differs enough between the two that a naive string compare would false-
// positive on nearly every row).
const majorityScientificName = computed(() => {
  const counts = new Map()
  dwcRecords.value.forEach((r) => {
    if (!r.scientificName) return
    counts.set(r.scientificName, (counts.get(r.scientificName) || 0) + 1)
  })
  let best = null
  let bestCount = 0
  counts.forEach((count, name) => {
    if (count > bestCount) {
      best = name
      bestCount = count
    }
  })
  return best
})

function nameNoteFor(record) {
  return record.scientificName && record.scientificName !== majorityScientificName.value
    ? record.scientificName
    : null
}

function toListItem(group) {
  const first = group.records[0]
  const key = group.records.map((r) => r.id).join('-')
  const media = group.records.flatMap((r) => r.associatedMedia || [])

  if (!group.isGroup) {
    return {
      key,
      typeStatus: first.typeStatus,
      typeStatusHtml: typeStatusHtml(first.typeStatus),
      headline: first.headline,
      summary: first.summary,
      nameNote: nameNoteFor(first),
      associatedMedia: media,
      recordEntries: null,
      detail: toDetailRef(first)
    }
  }

  // A group row represents N records — there is no single "the record" to
  // show, so it never gets a top-level detail trigger. Individual records
  // are only reachable through recordEntries below.
  return {
    key,
    typeStatus: first.typeStatus,
    typeStatusHtml: typeStatusHtml(first.typeStatus),
    headline: first.headline,
    summary: makeGroupSummary(group),
    nameNote: nameNoteFor(first),
    associatedMedia: media,
    recordEntries: group.records.map(toRecordEntry),
    detail: null
  }
}

const listItems = computed(() => groupRecords(filteredRecords.value).map(toListItem))

onMounted(loadDwc)

async function getMediaImages(item) {
  const links = item.associatedMedia.split('|')
  const promises = []

  links.forEach((link) => {
    promises.push(
      makeAPIRequest.get(link.trim(), {
        params: {
          extend: ['attribution', 'depictions', 'source']
        }
      })
    )
  })

  return await Promise.all(promises).then((responses) => {
    return responses.map((item) => item.data)
  })
}

function setCurrentImages({ images, index }) {
  currentImages.value = images
  currentIndex.value = index
  isViewerVisible.value = true
}

function showDetail(detail) {
  // toDetailRef() already guarantees this; redundant guard directly at the
  // one call site that invokes .show(), so a future refactor can't bypass it.
  if (detail?.id && isSpecimenType(detail.type)) {
    dwcTableRef.value?.show(detail)
  }
}
</script>
