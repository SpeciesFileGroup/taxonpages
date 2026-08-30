<template>
  <VCard>
    <ClientOnly>
      <VSpinner v-if="isLoading" />
    </ClientOnly>
    <VCardHeader>
      Asserted distributions ({{ totalCount }})
    </VCardHeader>
    <VCardContent class="min-h-[6rem] overflow-x-auto">

      <!-- Tabs: visible when records span multiple OTUs (descendants + synonyms) -->
      <div
        v-if="showTabs"
        class="flex flex-wrap gap-x-1 mb-4 border-b"
      >
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="px-3 py-1.5 text-sm -mb-px border-b-2 transition-colors"
          :class="selectedOtuId === tab.id
            ? 'border-current text-secondary font-medium'
            : 'border-transparent opacity-50 hover:opacity-100'"
          @click="selectedOtuId = tab.id"
        >
          <template v-if="tab.id === 'all'">All</template>
          <template v-else>
            <span
              v-if="tab.isSynonym"
              class="mr-0.5"
              title="Synonym"
            >&#10060;</span>
            <em>{{ tab.label }}</em>
          </template>
          <span class="ml-1 text-xs opacity-60">({{ tab.count }})</span>
        </button>
      </div>

      <VTable v-if="groupedDistributions.length">
        <VTableHeader class="normal-case">
          <VTableHeaderRow>
            <VTableHeaderCell>Area</VTableHeaderCell>
            <VTableHeaderCell v-if="isMergedView">Taxa</VTableHeaderCell>
            <VTableHeaderCell>Absent</VTableHeaderCell>
            <VTableHeaderCell>Citation</VTableHeaderCell>
          </VTableHeaderRow>
        </VTableHeader>
        <VTableBody>
          <template
            v-for="group in groupedDistributions"
            :key="group.parent"
          >
            <tr>
              <td
                :colspan="isMergedView ? 4 : 3"
                class="px-4 pt-5 pb-1 text-sm font-bold border-b text-base-content"
              >
                {{ group.label }}
                <span class="font-normal opacity-50 ml-1">({{ group.items.length }})</span>
              </td>
            </tr>

            <VTableBodyRow
              v-for="item in group.items"
              :key="item.id"
            >
              <VTableBodyCell class="pl-8">
                <button
                  class="font-semibold hover:underline cursor-pointer text-left text-base-content"
                  @click="openMapModal(item)"
                >{{ item.areaName }}</button>
                <span
                  v-if="item.areaType"
                  class="text-xs opacity-50 ml-1.5"
                >{{ item.areaType }}</span>
              </VTableBodyCell>

              <!-- Taxa column: merged All-tab view only -->
              <VTableBodyCell
                v-if="isMergedView"
                class="text-sm"
              >
                <template
                  v-for="(entry, i) in item.otuEntries"
                  :key="entry.otuId"
                >
                  <span
                    v-if="entry.isSynonym"
                    class="mr-0.5"
                    title="Synonym"
                  >&#10060;</span>
                  <em>{{ entry.otuName }}</em><span v-if="i < item.otuEntries.length - 1">; </span>
                </template>
              </VTableBodyCell>

              <VTableBodyCell>
                <span
                  v-if="item.isAbsent"
                  class="text-danger text-sm font-medium"
                >Absent</span>
              </VTableBodyCell>

              <VTableBodyCell class="text-sm">
                <template
                  v-for="(citation, i) in item.citationList"
                  :key="citation.id"
                >
                  <button
                    class="hover:underline cursor-pointer text-secondary"
                    @click="activeCitation = citation"
                    v-html="citation.display"
                  />
                  <span v-if="i < item.citationList.length - 1">; </span>
                </template>
              </VTableBodyCell>
            </VTableBodyRow>
          </template>
        </VTableBody>
      </VTable>

      <!-- Map modal -->
      <Teleport to="body">
        <VModal
          v-if="mapModal.open"
          @close="mapModal = { open: false }"
        >
          <template #header>
            <div class="text-sm font-medium">{{ mapModal.areaName }}</div>
          </template>
          <div class="p-4">
            <div
              v-if="mapModal.loading"
              class="min-h-[200px] flex items-center justify-center"
            >
              <VSpinner />
            </div>
            <p
              v-else-if="!mapModal.feature"
              class="min-h-[200px] flex items-center justify-center text-sm opacity-50"
            >No map data available for this area.</p>
            <VMap
              v-else
              :geojson="{ type: 'FeatureCollection', features: [mapModal.feature] }"
              height="400px"
            />
          </div>
        </VModal>
      </Teleport>

      <!-- Citation modal -->
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
            v-html="convertUrlsToLinks(activeCitation.full)"
          />
        </VModal>
      </Teleport>

      <div
        v-if="!isLoading && !groupedDistributions.length"
        class="text-xl text-center my-8 w-full"
      >
        No records found.
      </div>

      <p
        v-if="groupedDistributions.length"
        class="text-xs opacity-50 mt-4 text-center"
      >
        The same distribution data can also be viewed on the map in the Overview panel.
      </p>
    </VCardContent>
  </VCard>
</template>

<script setup>
/**
 * PanelAssertedDistributions.vue
 *
 * Displays asserted distributions for an OTU and its descendants + synonyms.
 *
 * LOAD SEQUENCE (optimised for speed)
 * ------------------------------------
 * Step 1 — parallel:
 *   a. /asserted_distributions?taxon_name_id[]=X&descendants=true
 *      Covers the valid OTU and all its subspecies/varieties.
 *   b. /taxon_name_relationships?object_taxon_name_id[]=X
 *      Returns Invalidating relationships → synonym taxon_name_ids.
 *
 * Step 2 — only when synonyms exist:
 *   /asserted_distributions?taxon_name_id[]=SYN1&taxon_name_id[]=SYN2&...
 *   OTUs already present in step 1a are excluded to prevent duplication.
 *
 * Step 3 — one batch for all records:
 *   /citations?extend[]=source  (source object embedded, no separate /sources call)
 *
 * SYNONYM DETECTION
 * -----------------
 * asserted_distribution_object.object_tag contains &#10060; for synonyms,
 * &#10003; for valid taxa — no extra API call needed.
 *
 * TABS & MERGED VIEW
 * ------------------
 * Tabs appear when records span more than one OTU. The "All" tab merges
 * rows with the same geographic area into a single row and adds a Taxa
 * column listing all taxa recorded there. Per-OTU tabs show individual rows.
 */

import { computed, onMounted, ref } from 'vue'
import { makeAPIRequest } from '@/utils'
import { useOtuPageRequest } from '@/modules/otus/helpers/useOtuPageRequest.js'
function convertUrlsToLinks(text = '') {
  return text.replace(/(https?:\/\/[^\s<>"]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
}

const props = defineProps({
  otuId: {
    type: [Number, String],
    required: true
  },
  taxon: {
    type: Object,
    required: true
  },
  per: {
    type: Number,
    default: 500
  }
})

const distributions = ref([])
const isLoading = ref(false)
const totalCount = ref(0)
const activeCitation = ref(null)
const selectedOtuId = ref('all')

// Map modal state
const mapModal = ref({ open: false })
// Geographic area ID → GeoJSON Feature, merged from all OTU inventories.
// Keyed by shape.id (geographic area ID) so any tab can find a polygon
// regardless of which OTU's GeoJSON record it came from.
const shapeIdMap = ref({})
// Per-OTU promise cache — deduplicates concurrent requests for the same OTU.
const geoPromiseCache = {}

const showTabs = computed(() => new Set(distributions.value.map((d) => d.otuId)).size > 1)

// True when the All tab is active across multiple OTUs — collapses rows by area
const isMergedView = computed(() => selectedOtuId.value === 'all' && showTabs.value)

const tabs = computed(() => {
  const byOtu = new Map()
  for (const d of distributions.value) {
    if (!byOtu.has(d.otuId)) {
      byOtu.set(d.otuId, { id: d.otuId, label: d.otuName, isSynonym: d.isSynonym, count: 0 })
    }
    byOtu.get(d.otuId).count++
  }
  const otuTabs = [...byOtu.values()].sort((a, b) => a.label.localeCompare(b.label))
  return [{ id: 'all', count: distributions.value.length }, ...otuTabs]
})

const filteredDistributions = computed(() => {
  if (selectedOtuId.value === 'all') return distributions.value
  return distributions.value.filter((d) => String(d.otuId) === String(selectedOtuId.value))
})

/**
 * In the merged All tab: collapses distributions sharing the same geographic
 * area into one row, combining otuEntries and citations across all taxa.
 */
function mergeByArea(dists) {
  const byArea = new Map()
  for (const dist of dists) {
    const key = `${dist.parentName}|${dist.areaName}`
    if (!byArea.has(key)) {
      byArea.set(key, {
        id: dist.id,
        shapeId: dist.shapeId, // needed for map modal lookup
        otuId: dist.otuId,     // needed for map modal GeoJSON fetch
        areaName: dist.areaName,
        areaType: dist.areaType,
        parentName: dist.parentName,
        isAbsent: false,
        otuEntries: [],
        citationList: []
      })
    }
    const m = byArea.get(key)
    m.isAbsent = m.isAbsent || dist.isAbsent
    if (!m.otuEntries.some((e) => e.otuId === dist.otuId)) {
      m.otuEntries.push({ otuId: dist.otuId, otuName: dist.otuName, isSynonym: dist.isSynonym })
    }
    m.citationList.push(...dist.citationList)
  }
  return [...byArea.values()]
}

const groupedDistributions = computed(() => {
  const source = isMergedView.value
    ? mergeByArea(filteredDistributions.value)
    : filteredDistributions.value

  const groups = new Map()
  for (const dist of source) {
    if (!groups.has(dist.parentName)) groups.set(dist.parentName, [])
    groups.get(dist.parentName).push(dist)
  }
  for (const items of groups.values()) {
    items.sort((a, b) => a.areaName.localeCompare(b.areaName))
  }
  return [...groups.entries()]
    .sort(([a], [b]) => {
      if (a === 'Earth') return -1
      if (b === 'Earth') return 1
      return a.localeCompare(b)
    })
    .map(([parent, items]) => ({
      parent,
      label: parent === 'Earth' ? 'Countries & Territories' : parent,
      items
    }))
})

function makeDistribution(item, citationList) {
  const shape = item.asserted_distribution_shape || {}
  const obj = item.asserted_distribution_object || {}
  return {
    id: item.id,
    otuId: item.asserted_distribution_object_id,
    shapeId: shape.id,
    otuName: obj.taxon_name || '',
    isSynonym: (obj.object_tag || '').includes('&#10060;'),
    areaName: shape.name || '',
    areaType: shape.geographic_area_type?.name || '',
    parentName: shape.parent?.name || 'Earth',
    isAbsent: !!item.is_absent,
    citationList
  }
}

/**
 * Fetches GeoJSON for one OTU and merges AssertedDistribution polygon features
 * into shapeIdMap, keyed by geographic area ID (shape.id). The promise is cached
 * immediately so concurrent calls share one request.
 * VMap expects properties.base as an array, so base is wrapped: [fp.base].
 */
function fetchGeoForOtu(otuId) {
  if (geoPromiseCache[otuId]) return geoPromiseCache[otuId]
  geoPromiseCache[otuId] = (async () => {
    try {
      const { data } = await makeAPIRequest.get(`/otus/${otuId}/inventory/distribution.geojson`)
      const updates = {}
      for (const f of data?.features || []) {
        const fp = f.properties || {}
        if (fp.base?.type === 'AssertedDistribution' && fp.shape?.id && f.geometry) {
          updates[fp.shape.id] = { ...f, properties: { ...fp, base: [fp.base] } }
        }
      }
      if (Object.keys(updates).length) {
        shapeIdMap.value = { ...shapeIdMap.value, ...updates }
      }
    } catch {
      // remain silent; cached promise prevents retry storms
    }
  })()
  return geoPromiseCache[otuId]
}

/**
 * Opens the map modal for a clicked area row. Awaits the GeoJSON for both
 * the page OTU (comprehensive inventory) and the clicked distribution's OTU,
 * then looks up the polygon by geographic area ID.
 */
async function openMapModal(item) {
  mapModal.value = { open: true, loading: true, areaName: item.areaName, feature: null }
  await Promise.all([fetchGeoForOtu(props.otuId), fetchGeoForOtu(item.otuId)])
  mapModal.value = {
    open: true,
    loading: false,
    areaName: item.areaName,
    feature: shapeIdMap.value[item.shapeId] ?? null
  }
}

function shortCitation(body) {
  if (!body) return ''
  const m = body.match(/,\s*(\d{4}[a-z]?(?::[^\s,]+)?)\s*$/)
  if (!m) return body
  const year = m[1]
  const authorsStr = body.slice(0, m.index)
  const ampIdx = authorsStr.lastIndexOf('&')
  if (ampIdx < 0 || !authorsStr.slice(0, ampIdx).includes(',')) return body
  return `${authorsStr.split(',')[0].trim()} et al., ${year}`
}

async function fetchCitations(distributionIds) {
  if (!distributionIds.length) return new Map()

  const params = new URLSearchParams()
  params.append('citation_object_type', 'AssertedDistribution')
  params.append('extend[]', 'source')
  distributionIds.forEach((id) => params.append('citation_object_id[]', id))

  const { data: citations } = await makeAPIRequest.get(`/citations?${params.toString()}`)

  const result = new Map()
  for (const cit of citations) {
    const entry = {
      id: cit.id,
      display: shortCitation(cit.citation_source_body || ''),
      full: cit.source?.cached || cit.citation_source_body || ''
    }
    if (!result.has(cit.citation_object_id)) result.set(cit.citation_object_id, [])
    result.get(cit.citation_object_id).push(entry)
  }
  return result
}

async function loadDistributions() {
  isLoading.value = true
  try {
    // Step 1: parallel — main records (valid OTU + descendants) + synonym relationships
    const [adResult, relResult] = await Promise.all([
      useOtuPageRequest('panel:asserted-distributions', () =>
        makeAPIRequest.get('/asserted_distributions', {
          params: { 'taxon_name_id[]': props.taxon.id, descendants: true, per: props.per }
        })
      ),
      makeAPIRequest.get('/taxon_name_relationships', {
        params: { 'object_taxon_name_id[]': props.taxon.id, per: 500 }
      })
    ])

    const adData = adResult.data
    const synonymTaxonNameIds = [...new Set(
      (relResult.data || [])
        .filter((r) => r.type?.includes('Invalidating'))
        .map((r) => r.subject_taxon_name_id)
        .filter(Boolean)
    )]

    // Step 2: synonym ADs, only when synonyms exist, excluding already-known OTUs
    let synData = []
    if (synonymTaxonNameIds.length) {
      const knownOtuIds = new Set(adData.map((d) => String(d.asserted_distribution_object_id)))
      const params = new URLSearchParams()
      synonymTaxonNameIds.forEach((id) => params.append('taxon_name_id[]', id))
      params.append('per', props.per)
      const { data } = await makeAPIRequest.get(`/asserted_distributions?${params.toString()}`)
      synData = data.filter((d) => !knownOtuIds.has(String(d.asserted_distribution_object_id)))
    }

    // Step 3: citations for all records in one batch
    const allData = [...adData, ...synData]
    const citationsMap = await fetchCitations(allData.map((d) => d.id))

    distributions.value = allData.map((item) => makeDistribution(item, citationsMap.get(item.id) || []))
    totalCount.value = distributions.value.length

    // Background: pre-fetch GeoJSON for all OTUs so map popups are instant.
    // Always includes props.otuId — its inventory is most comprehensive.
    const allOtuIds = [...new Set([props.otuId, ...distributions.value.map((d) => d.otuId)])]
    allOtuIds.forEach(fetchGeoForOtu)
  } catch {
    // silently fail
  } finally {
    isLoading.value = false
  }
}

onMounted(() => loadDistributions())
</script>
