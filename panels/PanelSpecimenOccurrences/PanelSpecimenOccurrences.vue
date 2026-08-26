<template>
  <div class="flex flex-col gap-3">
    <ListRecords
      :list="listItems"
      :is-loading="isLoading"
      :max="MAX"
      @select="setCurrentImages"
    />

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

const dwcRecords = ref([])

function loadDwc() {
  isLoading.value = true
  Promise.all([
    makeAPIRequest.get(`/otus/${props.otuId}/inventory/dwc.json`),
    makeAPIRequest
      .get(`/otus/${props.otuId}/inventory/type_material.json`)
      .catch(() => ({ data: { type_materials_catalog_labels: [] } }))
  ])
    .then(async ([{ data }, { data: typeMaterialData }]) => {
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
        label: makeLabel(d)
      }))
    })
    .finally(() => {
      isLoading.value = false
    })
}

function getLocalityData(data) {
  const area = [
    data.country,
    data.stateProvince,
    data.county,
    data.verbatimLocality
  ]
    .filter(Boolean)
    .join(', ')

  return area
}

function makeLabel(item) {
  return item.dwc_occurrence_object_type === 'FieldOccurrence'
    ? makeFieldOccurrenceLabel(item)
    : makeSpecimenLabel(item)
}

function makeSpecimenLabel(item) {
  return [
    getCountAndSex(item),
    getDepositoryData(item),
    item.catalogNumber,
    getLocalityData(item),
    getCoordinates(item),
    getCollector(item)
  ]
    .filter(Boolean)
    .join('; ')
}

function makeFieldOccurrenceLabel(item) {
  return [
    getCountAndSex(item),
    getLocalityData(item),
    getCoordinates(item),
    getCollector(item)
  ]
    .filter(Boolean)
    .join('; ')
}

// Shared label for a collapsed group of 2+ records: same pieces as
// makeSpecimenLabel/makeFieldOccurrenceLabel, but the per-record count+sex
// is replaced by the group's aggregated count (groupCountLabel) and the
// single catalogNumber is dropped (the list component renders a "show
// catalog numbers" disclosure for CO groups with more than one instead).
function makeGroupLabel(group) {
  const first = group.records[0]
  const parts = [groupCountLabel(group)]
  if (first.dwc_occurrence_object_type === 'CollectionObject') {
    parts.push(getDepositoryData(first))
  }
  parts.push(getLocalityData(first), getCoordinates(first), getCollector(first))
  return parts.filter(Boolean).join('; ')
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

function getCountAndSex({ individualCount, sex }) {
  return sex
    ? `${individualCount} ${sex}`
    : `${individualCount} specimen${individualCount > 1 ? 's' : ''}`
}

function getCollector({ recordedBy }) {
  return recordedBy ? `Col. ${recordedBy}` : ''
}

function getCoordinates({ verbatimCoordinates }) {
  const coordinates = verbatimCoordinates?.split(' ').join(', ')

  return coordinates ? `(${coordinates})` : ''
}

function toListItem(group) {
  const first = group.records[0]
  const key = group.records.map((r) => r.id).join('-')
  const media = group.records.flatMap((r) => r.associatedMedia || [])

  if (!group.isGroup) {
    return {
      key,
      typeStatus: first.typeStatus,
      label: first.label,
      associatedMedia: media,
      catalogNumbers: null
    }
  }

  const catalogNumbers =
    first.dwc_occurrence_object_type === 'CollectionObject'
      ? [...new Set(group.records.map((r) => r.catalogNumber).filter(Boolean))]
      : []

  return {
    key,
    typeStatus: first.typeStatus,
    label: makeGroupLabel(group),
    associatedMedia: media,
    catalogNumbers: catalogNumbers.length > 1 ? catalogNumbers : null
  }
}

const listItems = computed(() => groupRecords(dwcRecords.value).map(toListItem))

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
</script>
