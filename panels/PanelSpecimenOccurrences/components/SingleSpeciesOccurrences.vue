<template>
  <div class="flex flex-col gap-3">
    <ListRecords
      :list="listItems"
      :is-loading="isLoading"
      :max="MAX"
      :total-specimen-count="totalSpecimenCount"
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

    <ImageLightbox
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

<script>
// True module scope (a plain <script> block runs once per module load, unlike
// <script setup>'s top level which re-runs on every component instantiation —
// SpeciesBars.vue mounts/unmounts this component via v-if/v-else on every bar
// click, so this must live outside <script setup> to actually survive that).
const instNameCache = new Map()
</script>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { makeAPIRequest } from '@/utils'
import ListRecords from './ListRecords.vue'
import DwcTable from '../../_shared/DwcTable.vue'
import ImageLightbox from '../../_shared/ImageLightbox.vue'
import { isSpecimenType, resolveSpecimenRef } from '../../_shared/specimenRef.js'
import { groupRecords, groupCountLabel } from '../lib/groupRecords'

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
  },

  // Restricts to records whose CURRENT determination (otu_id) is this
  // OTU itself — used only for a higher taxon's own "not identified to
  // species" row in SpeciesBars.vue. /otus/:id/inventory/dwc.json always
  // calls TaxonWorks' scoped_by_otu, which (despite its own "# include
  // self" comment) passes descendants: false to Queries::TaxonName::Filter
  // — and that library's own docs say false means "self AND descendants",
  // not "self only". So fetching a genus/subgenus OTU here returns the
  // WHOLE subtree, identical to every species's own fetch; filtering to
  // otu_id === props.otuId is the only way to recover just the records
  // actually determined to this rank from that same response.
  directOnly: {
    type: Boolean,
    default: false
  },

  // When set, skips the dwc.json fetch and uses this raw row array instead
  // — SpeciesBars.vue already fetches the same genus-wide data to build the
  // "…: all" and "…(not identified to species)" rows, so expanding either
  // of those shouldn't repeat the fetch the user just watched happen.
  // type_material.json and biological_associations are still fetched fresh
  // (they're per-OTU-cheap regardless, and aren't already sitting in hand).
  preloadedData: {
    type: Array,
    default: null
  }
})

const currentIndex = ref(0)
const currentImages = ref([])
const isViewerVisible = ref(false)
const isLoading = ref(false)
const dwcTableRef = ref(null)

const dwcRecords = ref([])
// Every biological association for this OTU, indexed by the specimen it
// touches — see buildBioAssociationsIndex() below. Fetched once per OTU
// load, not once per row, since a list row like this one needs to check
// dozens of records rather than the one DwcTable shows at a time.
const bioAssociationsIndex = ref(new Map())

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
    props.preloadedData
      ? Promise.resolve({ data: props.preloadedData })
      : makeAPIRequest.get(`/otus/${props.otuId}/inventory/dwc.json`),
    makeAPIRequest
      .get(`/otus/${props.otuId}/inventory/type_material.json`)
      .catch(() => ({ data: { type_materials_catalog_labels: [] } })),
    fetchBioAssociationsForOtu(props.otuId)
  ])
    .then(async ([{ data: rawData }, { data: typeMaterialData }, bioAssociations]) => {
      bioAssociationsIndex.value = buildBioAssociationsIndex(bioAssociations)

      // dwc_occurrence is polymorphic — the endpoint also returns
      // AssertedDistribution (citation-based distribution, not a physical
      // specimen) and potentially other object types. Allow-list rather
      // than deny-list a single type.
      //
      // Shallow-copy each record (not just .filter(), which keeps the same
      // object references) — the media-resolution step below mutates
      // item.associatedMedia in place, and when rawData came from
      // preloadedData that would otherwise corrupt SpeciesBars.vue's cached
      // copy: the second time "…: all"/"…(not identified to species)" gets
      // expanded, associatedMedia would already be the resolved image array
      // from last time instead of the original pipe-separated URL string,
      // getMediaImages()'s .split('|') would throw, and the whole record
      // list would silently come up empty.
      const data = rawData
        .filter(
          (d) =>
            d.dwc_occurrence_object_type === 'CollectionObject' ||
            d.dwc_occurrence_object_type === 'FieldOccurrence'
        )
        .map((d) => ({ ...d }))

      const missingTypeSpecimens = await fetchMissingTypeSpecimens(
        typeMaterialData.type_materials_catalog_labels || [],
        data
      )
      data.push(...missingTypeSpecimens)

      // See the directOnly prop doc — dwc.json for a genus/subgenus OTU
      // returns its entire descendant subtree, not just genus-rank-only
      // determinations, so that case needs this extra client-side filter.
      const scoped = props.directOnly ? data.filter((d) => d.otu_id === props.otuId) : data

      // Media and institution-name resolution touch disjoint fields with no
      // data dependency — start both before awaiting either so their network
      // round trips overlap.
      const mediaPromise = Promise.all(
        scoped.map(async (item) => {
          if (item.associatedMedia) {
            item.associatedMedia = await getMediaImages(item)
          }
        })
      )

      // Resolve institution names for unique codes (deduplicated by code)
      const seenCodes = new Set()
      const institutionPromise = Promise.all(
        scoped
          .filter((d) => d.institutionCode && !seenCodes.has(d.institutionCode) && seenCodes.add(d.institutionCode))
          .map((d) => resolveInstitutionName(d.institutionCode, d.institutionID))
      )

      await Promise.all([mediaPromise, institutionPromise])

      dwcRecords.value = scoped.map((d) => ({
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

// The detail line under the identity line: everything about WHEN/WHERE it
// was collected. Locality/date/coordinates/collector are shared across
// every record in a collapsed group (that's what groupRecords.js groups
// by), so this is safe to compute once per record at load time and reuse
// as-is for a group row (see toListItem's `first.summary`).
function makeSummary(item) {
  return [
    getLocalityDetail(item),
    getDate(item),
    getCoordinates(item),
    getCollector(item)
  ]
    .filter(Boolean)
    .join(' · ')
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

// "leg." (Latin legit, "collected by") rather than "Col." — the actual
// international standard on specimen labels, unambiguous, and pairs with
// "det." (identity line above) the same way collecting/identifying already
// pair everywhere else in this data. "Col." risks reading as "Collection of".
function getCollector({ recordedBy }) {
  return recordedBy ? `leg. ${recordedBy}` : ''
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

function getDetHtml({ identifiedBy, dateIdentified }) {
  if (!identifiedBy) return ''
  const year = String(dateIdentified || '').match(/^\d{4}/)?.[0]
  return `<span class="opacity-60">det.</span> ${escHtml(identifiedBy)}${year ? ' ' + year : ''}`
}

// A small "?" badge for an uncertain determination (cf./aff./sp. — TaxonWorks'
// identificationQualifier, the same field DwcTable already surfaces). Mirrors
// CollectionDatabase's identification-doubt badge; unlike its other trailing
// icons (a closed padlock, a consent marker) this one has no TaxonWorks-side
// privacy/consent equivalent to port, so it's the only one that transfers.
function identificationQualifierHtml({ identificationQualifier }) {
  if (!identificationQualifier) return ''
  return `<span class="text-warning font-bold cursor-help" title="Identification qualifier: ${escHtml(identificationQualifier)}">?</span>`
}

function badgeHtml(text) {
  return text ? `<span class="inline-block text-[10px] font-medium bg-base-muted rounded px-1.5 py-0.5">${escHtml(text)}</span>` : ''
}

// Mirrors DwcTable.vue's fetchBioAssociations matching logic exactly (kept
// as a local duplicate rather than a _shared/ export — see specimenRef.js's
// header comment, same reasoning as typeStatusHtml above), but INDEXES every
// association for the OTU once instead of re-fetching+re-filtering per
// specimen — this list can have dozens of rows, not the one DwcTable shows
// at a time.
function bioPartyLabel(entity) {
  if (!entity) return { italic: '', plain: '' }
  if (entity.base_class === 'Otu') return splitScientificName(entity.object_label || '')
  return { italic: '', plain: (entity.object_label || '').split('\n')[0] }
}

function anatomicalPartPrefix(entity) {
  if (!entity || entity.base_class !== 'AnatomicalPart') return null
  const label = entity.object_label || ''
  const idx = label.indexOf(': ')
  return idx > 0 ? label.slice(0, idx) : null
}

async function fetchBioAssociationsForOtu(otuIdVal) {
  try {
    const { data } = await makeAPIRequest.get('/biological_associations', {
      params: {
        'otu_query[otu_id][]': otuIdVal,
        extend: ['subject', 'object', 'biological_relationship'],
        per: 100
      }
    })
    return data
  } catch {
    return []
  }
}

// Builds a `${type}:${id}` → matches[] index from the raw associations list
// — every subject/object side that resolves to a physical specimen (direct,
// or via a wrapping AnatomicalPart) becomes a key, whether or not it turns
// out to belong to one of this OTU's own records; unused keys are harmless.
function buildBioAssociationsIndex(rawBaList) {
  const index = new Map()
  const add = (ref, relationshipLabel, otherName) => {
    if (!ref) return
    const key = `${ref.type}:${ref.id}`
    if (!index.has(key)) index.set(key, [])
    index.get(key).push({ relationshipLabel, otherName })
  }
  rawBaList.forEach((ba) => {
    const rel = ba.biological_relationship || {}
    const subjRef = resolveSpecimenRef(ba.subject)
    if (subjRef) {
      const prefix = anatomicalPartPrefix(ba.subject)
      const verb = rel.name || ''
      add(subjRef, prefix ? `${prefix} ${verb}` : verb, bioPartyLabel(ba.object))
    }
    const objRef = resolveSpecimenRef(ba.object)
    if (objRef) {
      const prefix = anatomicalPartPrefix(ba.object)
      const verb = rel.inverted_name || rel.name || ''
      add(objRef, prefix ? `${prefix} ${verb}` : verb, bioPartyLabel(ba.subject))
    }
  })
  return index
}

// The primary association a record participates in, inline on the identity
// line ("collected from Corylus avellana") — a second+ association collapses
// to a "+N" count rather than listing every one, same convention as
// DwcTable's hosts_html.
function bioAssociationHtml(record) {
  const key = `${record.dwc_occurrence_object_type}:${record.dwc_occurrence_object_id}`
  const matches = bioAssociationsIndex.value.get(key)
  if (!matches?.length) return ''
  const { relationshipLabel, otherName } = matches[0]
  const nameHtml = otherName.italic
    ? `<em>${escHtml(otherName.italic)}</em>${otherName.plain ? ' ' + escHtml(otherName.plain) : ''}`
    : escHtml(otherName.plain)
  const more = matches.length > 1 ? ` <span class="opacity-60">+${matches.length - 1}</span>` : ''
  return `<span class="opacity-70">${escHtml(relationshipLabel)}</span> ${nameHtml}${more}`
}

// The identity line: WHICH physical object this is and how it was
// determined — catalog number, depository, count/sex, a minority
// scientificName, the determiner, and the primary biological association it
// participates in. A group row only gets the aggregate count badge; the
// rest are per-specimen facts a collapsed row shouldn't imply apply to every
// record in it (the "Individual records" disclosure is where that lives).
function makeIdentityHtml(group) {
  const first = group.records[0]
  const parts = []

  const note = nameNoteFor(first)
  if (note) parts.push(`<em class="text-secondary">${escHtml(note)}</em>`)

  if (!group.isGroup) {
    const cat = getCatalogNumberHtml(first)
    if (cat) parts.push(cat)
  }

  if (first.dwc_occurrence_object_type === 'CollectionObject') {
    const dep = getDepositoryData(first)
    if (dep) parts.push(dep)
  }

  const badgeText = group.isGroup ? groupCountLabel(group) : getCountAndSex(first)
  const badge = badgeHtml(badgeText)
  if (badge) parts.push(badge)

  if (!group.isGroup) {
    const det = getDetHtml(first)
    if (det) parts.push(det)
    const bio = bioAssociationHtml(first)
    if (bio) parts.push(bio)
  }

  return parts.join(' <span class="opacity-30">·</span> ')
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
      identity: makeIdentityHtml(group),
      identificationQualifierHtml: identificationQualifierHtml(first),
      headline: first.headline,
      summary: first.summary,
      associatedMedia: media,
      recordEntries: null,
      detail: toDetailRef(first)
    }
  }

  // A group row represents N records — there is no single "the record" to
  // show, so it never gets a top-level detail trigger or an identification
  // qualifier badge (a per-specimen fact). Individual records are only
  // reachable through recordEntries below.
  return {
    key,
    typeStatus: first.typeStatus,
    typeStatusHtml: typeStatusHtml(first.typeStatus),
    identity: makeIdentityHtml(group),
    identificationQualifierHtml: '',
    headline: first.headline,
    summary: first.summary,
    associatedMedia: media,
    recordEntries: group.records.map(toRecordEntry),
    detail: null
  }
}

const listItems = computed(() => groupRecords(filteredRecords.value).map(toListItem))

// The true specimen count (individualCount summed) — distinct from
// listItems.length, which counts grouped rows, and from filteredRecords
// .length, which counts raw dwc rows (a single row can itself represent a
// lot of >1 individualCount). Follows the same active filters as the list
// itself, so it updates live rather than only ever reporting the total.
const totalSpecimenCount = computed(() =>
  filteredRecords.value.reduce((sum, r) => {
    // individualCount: 0 is a legitimate value (RangedLot-category specimens)
    // and must be counted as 0, not defaulted to 1 like a missing value —
    // Number(null) is 0 too, so check for absence before coercing.
    if (r.individualCount === null || r.individualCount === undefined || r.individualCount === '') {
      return sum + 1
    }
    const n = Number(r.individualCount)
    return sum + (Number.isFinite(n) ? n : 1)
  }, 0)
)

onMounted(loadDwc)

// A SpeciesBars.vue drill-down reuses this same component for whichever
// species is expanded — otuId changes without a remount, so the fetch has
// to re-run reactively rather than once in onMounted alone.
watch(() => props.otuId, loadDwc)

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
