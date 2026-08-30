<template>
  <VCard>
    <ClientOnly>
      <VSpinner v-if="isLoading" />
    </ClientOnly>
    <VCardHeader>
      Biological associations ({{ headerCount }})
    </VCardHeader>
    <VCardContent class="min-h-[6rem] overflow-x-auto">

      <!-- Summary: higher-rank pages (genus and above), before drilling into a group.
           Two directions, since this taxon can appear as subject or object of an
           association (or both) — grouping always by "object" would be degenerate
           on a page whose taxon is itself the object side (e.g. a host plant page). -->
      <template v-if="showSummary">
        <div
          v-if="summaryTruncated"
          class="mb-4 text-sm text-warning"
        >Showing a partial summary — this taxon has more associations than can be summarized at once.</div>
        <div class="mb-4 flex items-center gap-2 text-sm">
          <span class="opacity-60">Group by:</span>
          <button
            class="px-2 py-1 rounded cursor-pointer"
            :class="groupBy === 'family' ? 'bg-secondary text-secondary-content' : 'hover:underline'"
            @click="groupBy = 'family'"
          >Family</button>
          <button
            class="px-2 py-1 rounded cursor-pointer"
            :class="groupBy === 'genus' ? 'bg-secondary text-secondary-content' : 'hover:underline'"
            @click="groupBy = 'genus'"
          >Genus</button>
        </div>

        <template v-if="summaryAsSubjectGroups.length">
          <h3 class="text-sm font-semibold opacity-70 mb-2">As subject — objects by {{ groupBy }}</h3>
          <VTable class="mb-6">
            <VTableHeader class="normal-case">
              <VTableHeaderRow>
                <VTableHeaderCell>{{ groupBy === 'family' ? 'Family' : 'Genus' }}</VTableHeaderCell>
                <VTableHeaderCell>Associations</VTableHeaderCell>
              </VTableHeaderRow>
            </VTableHeader>
            <VTableBody>
              <VTableBodyRow
                v-for="group in summaryAsSubjectGroups"
                :key="group.key"
                class="cursor-pointer hover:bg-base-foreground"
                @click="selectGroup(group)"
              >
                <VTableBodyCell>{{ group.key }}</VTableBodyCell>
                <VTableBodyCell>{{ group.count }}</VTableBodyCell>
              </VTableBodyRow>
            </VTableBody>
          </VTable>
        </template>

        <template v-if="summaryAsObjectGroups.length">
          <h3 class="text-sm font-semibold opacity-70 mb-2">As object — subjects by {{ groupBy }}</h3>
          <VTable>
            <VTableHeader class="normal-case">
              <VTableHeaderRow>
                <VTableHeaderCell>{{ groupBy === 'family' ? 'Family' : 'Genus' }}</VTableHeaderCell>
                <VTableHeaderCell>Associations</VTableHeaderCell>
              </VTableHeaderRow>
            </VTableHeader>
            <VTableBody>
              <VTableBodyRow
                v-for="group in summaryAsObjectGroups"
                :key="group.key"
                class="cursor-pointer hover:bg-base-foreground"
                @click="selectGroup(group)"
              >
                <VTableBodyCell>{{ group.key }}</VTableBodyCell>
                <VTableBodyCell>{{ group.count }}</VTableBodyCell>
              </VTableBodyRow>
            </VTableBody>
          </VTable>
        </template>

        <div
          v-if="!isLoading && !summaryAsSubjectGroups.length && !summaryAsObjectGroups.length"
          class="text-xl text-center my-8 w-full"
        >
          No records found.
        </div>
      </template>

      <template v-else>
      <button
        v-if="selectedGroup"
        class="mb-4 text-sm text-secondary hover:underline cursor-pointer"
        @click="clearGroupSelection"
      >&larr; Back to summary ({{ selectedGroup.key }})</button>

      <VPagination
        v-if="biologicalAssociations.length"
        class="mb-4"
        v-model="pagination.page"
        :total="pagination.total"
        :per="pagination.per"
        @select="(value) => { loadBiologicalAssociations(value) }"
      />
      <VTable v-if="biologicalAssociations.length">
        <VTableHeader class="normal-case">
          <VTableHeaderRow>
            <VTableHeaderCell colspan="2">Subject</VTableHeaderCell>
            <VTableHeaderCell class="border-l-2 border-r-2">Biological</VTableHeaderCell>
            <VTableHeaderCell colspan="2">Object</VTableHeaderCell>
            <VTableHeaderCell class="border-l-2" colspan="3">Metadata</VTableHeaderCell>
          </VTableHeaderRow>
          <VTableHeaderRow>
            <VTableHeaderCell>Family</VTableHeaderCell>
            <VTableHeaderCell>Label</VTableHeaderCell>
            <VTableHeaderCell class="border-l-2 border-r-2">Relationship</VTableHeaderCell>
            <VTableHeaderCell>Family</VTableHeaderCell>
            <VTableHeaderCell>Label</VTableHeaderCell>
            <VTableHeaderCell class="border-l-2">Depictions</VTableHeaderCell>
            <VTableHeaderCell>Area</VTableHeaderCell>
            <VTableHeaderCell>Citations</VTableHeaderCell>
          </VTableHeaderRow>
        </VTableHeader>
        <VTableBody>
          <VTableBodyRow
            v-for="ba in biologicalAssociations"
            :key="ba.id"
          >
            <VTableBodyCell>{{ ba.subjectFamily }}</VTableBodyCell>

            <!-- Subject label -->
            <VTableBodyCell>
              <div class="flex flex-col gap-0.5">
                <div
                  v-if="ba.subjectSpecimenType"
                  class="flex items-center gap-1"
                >
                  <span class="text-xs opacity-50">{{ ba.subjectSpecimenType === 'CollectionObject' ? 'Collection Object' : 'Field Occurrence' }}</span>
                  <button
                    class="shrink-0 opacity-40 hover:opacity-100 cursor-pointer leading-none text-xs"
                    title="Show details"
                    @click="dwcTableRef.show({ id: ba.subjectSpecimenId, type: ba.subjectSpecimenType })"
                  >ⓘ</button>
                </div>
                <span>
                  <span v-if="ba.subjectLabelPrefix">{{ ba.subjectLabelPrefix }}</span>
                  <RouterLink
                    v-if="ba.subjectOtuId"
                    :to="{ name: 'otus-id', params: { id: ba.subjectOtuId } }"
                    class="hover:underline"
                    v-html="ba.subjectSpeciesHtml"
                  />
                  <span v-else v-html="ba.subjectSpeciesHtml" />
                </span>
              </div>
            </VTableBodyCell>

            <VTableBodyCell class="border-l-2 border-r-2">{{ ba.biologicalRelationship }}</VTableBodyCell>

            <VTableBodyCell>{{ ba.objectFamily }}</VTableBodyCell>

            <!-- Object label -->
            <VTableBodyCell>
              <div class="flex flex-col gap-0.5">
                <div
                  v-if="ba.objectSpecimenType"
                  class="flex items-center gap-1"
                >
                  <span class="text-xs opacity-50">{{ ba.objectSpecimenType === 'CollectionObject' ? 'Collection Object' : 'Field Occurrence' }}</span>
                  <button
                    class="shrink-0 opacity-40 hover:opacity-100 cursor-pointer leading-none text-xs"
                    title="Show details"
                    @click="dwcTableRef.show({ id: ba.objectSpecimenId, type: ba.objectSpecimenType })"
                  >ⓘ</button>
                </div>
                <span>
                  <span v-if="ba.objectLabelPrefix">{{ ba.objectLabelPrefix }}</span>
                  <RouterLink
                    v-if="ba.objectOtuId"
                    :to="{ name: 'otus-id', params: { id: ba.objectOtuId } }"
                    class="hover:underline"
                    v-html="ba.objectSpeciesHtml"
                  />
                  <span v-else v-html="ba.objectSpeciesHtml" />
                </span>
              </div>
            </VTableBodyCell>

            <!-- Depictions -->
            <VTableBodyCell class="border-l-2">
              <div
                v-if="ba.images.length"
                class="relative inline-block cursor-pointer"
                @click="openViewer(ba)"
              >
                <img
                  :src="ba.images[0].thumb"
                  :alt="ba.images[0].figure_label"
                  :title="ba.images[0].figure_label"
                  class="h-12 w-12 object-cover rounded"
                />
                <span
                  v-if="ba.images.length > 1"
                  class="absolute -top-1 -right-1 bg-secondary text-secondary-content text-xs rounded-full px-1"
                >
                  +{{ ba.images.length - 1 }}
                </span>
              </div>
            </VTableBodyCell>

            <!-- Area: asserted distributions, or locality from subject CO/FO -->
            <VTableBodyCell>
              <template v-if="ba.distributions.length">
                <div
                  v-for="dist in ba.distributions"
                  :key="dist.id"
                  class="text-sm leading-snug font-semibold"
                  :class="{ 'line-through opacity-60': dist.isAbsent }"
                >{{ dist.area }}</div>
              </template>
              <span
                v-else-if="ba.subjectLocality?.text || ba.objectLocality?.text"
                class="text-sm"
              >{{ ba.subjectLocality?.text || ba.objectLocality?.text }}</span>
            </VTableBodyCell>

            <!-- Citations -->
            <VTableBodyCell>
              <div
                v-for="citation in ba.citationList"
                :key="citation.id"
                class="text-sm leading-snug"
              >
                <button
                  class="text-left hover:underline cursor-pointer text-secondary"
                  @click="activeCitation = citation"
                  v-html="citation.short"
                />
              </div>
              <span
                v-if="!ba.citationList.length && ba.citations"
                v-html="ba.citations"
                class="text-sm"
              />
              <span
                v-if="!ba.citationList.length && !ba.citations && (ba.subjectCollector || ba.objectCollector)"
                class="text-sm opacity-70"
              >{{ ba.subjectCollector || ba.objectCollector }}</span>
            </VTableBodyCell>
          </VTableBodyRow>
        </VTableBody>
      </VTable>

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
            v-html="linkify(activeCitation.full)"
          />
        </VModal>
      </Teleport>

      <DwcTable ref="dwcTableRef" />



      <!-- Shared lightbox -->
      <ImageLightbox
        v-if="viewer.images.length"
        :index="viewer.index"
        :images="viewer.images"
        :next="viewer.index < viewer.images.length - 1"
        :previous="viewer.index > 0"
        @select-index="viewer.index = $event"
        @next="viewer.index++"
        @previous="viewer.index--"
        @close="viewer.images = []"
      />

      <VPagination
        v-if="biologicalAssociations.length"
        class="mt-4"
        v-model="pagination.page"
        :total="pagination.total"
        :per="pagination.per"
        @select="(value) => { loadBiologicalAssociations(value) }"
      />
      <div
        v-if="!isLoading && !biologicalAssociations.length"
        class="text-xl text-center my-8 w-full"
      >
        No records found.
      </div>
      </template>
    </VCardContent>
  </VCard>
</template>

<script setup>
/**
 * PanelBiologicalAssociationsV2.vue
 *
 * Fetches /biological_associations with extend[]=object,subject,biological_relationship
 * for object_tag/label HTML, in parallel with /biological_associations/basic
 * (matched by id) for subject_otu_id/object_otu_id, family, and citations —
 * all pre-computed on the biological_association_indices table, so this stays
 * cheap regardless of page size. Deliberately no extend[]=taxonomy: that path
 * recomputes ancestry per row on the live model (see TaxonWorks'
 * Shared::Taxonomy#set_taxonomy) and is dramatically slower at scale.
 *
 * Scoped by otu_query[taxon_name_id]+descendants (not otu_id): this is what
 * makes the panel show data on genus/tribe/subfamily/etc. pages, not just
 * species — taxon_name_id+descendants joins against TaxonWorks' indexed
 * taxon_name_hierarchies closure table, so it stays fast (~2s) regardless of
 * how many descendant taxa are in scope. taxonId/taxon come for free from
 * PageLayout.vue (package), which passes the current taxon down to every
 * panel — note it does NOT forward a separate taxon-rank prop (only uses it
 * internally for its own panel-visibility check), so rank comes from
 * taxon.rank_string, not a taxonRank prop.
 *
 * Above species rank, a flat row list doesn't scale (a subfamily can have
 * ~1000 associations), so instead a summary view groups the *object* side
 * (usually the host/interaction partner) by family or genus — toggle is
 * client-side only, both fields already come from the one /basic fetch.
 * Grouping by genus (rather than always family) matters when several genera
 * in one family are actually clustered on a single host genus — collapsing
 * straight to family would hide that. Clicking a group drills into the flat,
 * fully-detailed table (images/citations/distributions) scoped to just that
 * group's association ids.
 */

import { computed, onMounted, reactive, ref } from 'vue'
import { makeAPIRequest } from '@/utils'
import { useOtuPageRequest } from '@/modules/otus/helpers/useOtuPageRequest.js'
import {
  HIGHER_CLASSIFICATION_GROUP,
  FAMILY_GROUP,
  GENUS_GROUP,
  SPECIES_GROUP,
  SPECIES_AND_INFRASPECIES_GROUP
} from '@/modules/otus/constants'
import DwcTable from '../_shared/DwcTable.vue'
import ImageLightbox from '../_shared/ImageLightbox.vue'
import {
  makeBiologicalAssociation,
  resolveSpecimenRef
} from './makeBiologicalAssociation.js'

const fullExtend = ['object', 'subject', 'biological_relationship']

const props = defineProps({
  otuId: {
    type: Number,
    required: true
  },
  taxonId: {
    type: [Number, String],
    required: true
  },
  taxon: {
    type: Object,
    default: () => ({})
  },
  per: {
    type: Number,
    default: 50
  },
  // Rank groups ordered broadest-to-narrowest. `collapseAboveRank` is a cutoff,
  // inclusive of the named rank: this rank and anything narrower is
  // flat-eligible (see collapseThreshold below); anything broader always
  // shows the grouped summary. Default 'SpeciesGroup' reproduces the panel's
  // original species-only-flat behavior. Configured via `bind:` in
  // taxa_page.yml, e.g. collapseAboveRank: 'GenusGroup'.
  collapseAboveRank: {
    type: String,
    default: SPECIES_GROUP
  },
  // A flat-rank page (per collapseAboveRank) still escalates to the grouped
  // summary if its record count exceeds this. Infinity by default — i.e. off
  // unless set via taxa_page.yml — so behavior is unchanged until configured.
  collapseThreshold: {
    type: Number,
    default: Infinity
  }
})

const RANK_ORDER = [
  HIGHER_CLASSIFICATION_GROUP,
  FAMILY_GROUP,
  GENUS_GROUP,
  SPECIES_GROUP,
  SPECIES_AND_INFRASPECIES_GROUP
]

// PageLayout.vue (package) only forwards taxon-rank into its own internal
// v-if for whether to render a panel at all — it does NOT pass it down as a
// prop. The full taxon object *is* passed down, and carries rank_string, so
// read rank off that instead. An unmatched/misconfigured rank falls back to
// "collapse" (false) rather than "flat" — the safer default.
// Inclusive of collapseAboveRank itself: 'GenusGroup' means genus and
// everything narrower (species, infraspecies) is flat-eligible; only
// FamilyGroup/HigherClassificationGroup collapse unconditionally.
const isFlatRank = computed(() => {
  const cutoffIndex = RANK_ORDER.indexOf(props.collapseAboveRank)
  const rankIndex = RANK_ORDER.findIndex((group) => props.taxon?.rank_string?.includes(group))
  if (cutoffIndex === -1 || rankIndex === -1) return false
  return rankIndex >= cutoffIndex
})

// Set once a flat-rank page's fetched total exceeds collapseThreshold — see
// onMounted, which fetches the flat table first and promotes to the summary
// view after the fact rather than probing the count up front, since flat-rank
// (usually species) pages are the overwhelming majority of traffic and are
// almost never over threshold.
const forcedSummary = ref(false)

// Higher-rank (above collapseAboveRank) summary state — two directions, fetched
// separately via subject_taxon_name_id/object_taxon_name_id (not the
// ambiguous otu_query[taxon_name_id], which matches either side). Raw rows
// are kept so groupBy can be switched client-side with no re-fetch.
const summaryAsSubjectRows = ref([]) // this taxon (or descendants) is the subject
const summaryAsObjectRows  = ref([]) // this taxon (or descendants) is the object
const summaryTruncated = ref(false) // true if either direction hit SUMMARY_FETCH_CAP
const groupBy = ref('family') // 'family' | 'genus'
const selectedGroup = ref(null) // { key, count, ids } while drilled into one group

const showSummary = computed(() => (!isFlatRank.value || forcedSummary.value) && !selectedGroup.value)

function groupRows(rows, side) {
  const groups = new Map()
  for (const row of rows) {
    const key = row[side]?.[groupBy.value] || 'Unclassified'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(row.id)
  }
  return [...groups.entries()]
    .map(([key, ids]) => ({ key, count: ids.length, ids }))
    .sort((a, b) => b.count - a.count)
}

// This taxon is the subject → the interesting summary is the object side, and vice versa.
const summaryAsSubjectGroups = computed(() => groupRows(summaryAsSubjectRows.value, 'object'))
const summaryAsObjectGroups  = computed(() => groupRows(summaryAsObjectRows.value, 'subject'))

const headerCount = computed(() => {
  if (!showSummary.value) return pagination.value.total
  const ids = new Set([...summaryAsSubjectRows.value, ...summaryAsObjectRows.value].map((r) => r.id))
  return ids.size
})

const biologicalAssociations = ref([])
const isLoading = ref(false)
const pagination = ref({
  page: 1,
  per: props.per,
  total: 0
})

const viewer = reactive({ images: [], index: 0 })
const activeCitation = ref(null)
const dwcTableRef = ref(null)

const dwcPromiseCache = {} // keyed by otuId — used for OTU search locality

function fetchDwcForOtu(otuId) {
  if (dwcPromiseCache[otuId]) return dwcPromiseCache[otuId]
  dwcPromiseCache[otuId] = makeAPIRequest
    .get(`/otus/${otuId}/inventory/dwc.json`)
    .then((r) => r.data)
    .catch(() => [])
  return dwcPromiseCache[otuId]
}


function openViewer(ba) {
  viewer.images = ba.images
  viewer.index = 0
}

function linkify(html) {
  if (!html) return ''
  return html.replace(
    /(?<!href=["'])(?<!">)(https?:\/\/[^\s<>"]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-secondary hover:underline">$1</a>'
  )
}

onMounted(async () => {
  if (isFlatRank.value) {
    await loadBiologicalAssociations()
    if (pagination.value.total > props.collapseThreshold) {
      forcedSummary.value = true
      loadSummary()
    }
  } else {
    loadSummary()
  }
})

/**
 * Fetches every matching /basic row for the whole higher-taxon scope, split
 * by direction (capped at 3000 each — this project's entire dataset is
 * currently ~3000 associations total, and /basic stays flat even at that
 * scale, unlike the live extend[]=taxonomy path). subject_taxon_name_id and
 * object_taxon_name_id are independent top-level filter params on
 * BiologicalAssociation::Filter (unlike otu_query[taxon_name_id], which
 * matches either side and can't tell you which). Grouping itself is the
 * summaryAsSubjectGroups/summaryAsObjectGroups computeds, so switching
 * groupBy needs no re-fetch.
 */
const SUMMARY_FETCH_CAP = 3000

async function loadSummary() {
  isLoading.value = true
  try {
    const [asSubject, asObject] = await Promise.all([
      makeAPIRequest.get('/biological_associations/basic', {
        params: { 'subject_taxon_name_id[]': props.taxonId, descendants: true, per: SUMMARY_FETCH_CAP }
      }),
      makeAPIRequest.get('/biological_associations/basic', {
        params: { 'object_taxon_name_id[]': props.taxonId, descendants: true, per: SUMMARY_FETCH_CAP }
      })
    ])
    summaryAsSubjectRows.value = asSubject.data
    summaryAsObjectRows.value = asObject.data
    summaryTruncated.value =
      Number(asSubject.headers['pagination-total']) > SUMMARY_FETCH_CAP ||
      Number(asObject.headers['pagination-total']) > SUMMARY_FETCH_CAP
  } catch (e) {
    // silently fail
  } finally {
    isLoading.value = false
  }
}

function selectGroup(group) {
  selectedGroup.value = group
  pagination.value = { page: 1, per: props.per, total: group.count }
  loadBiologicalAssociations(1)
}

function clearGroupSelection() {
  selectedGroup.value = null
  biologicalAssociations.value = []
}

function makeGalleryImage(depiction) {
  return {
    id: depiction.image.id,
    thumb: depiction.image.thumb,
    original: depiction.image.original,
    medium: depiction.image.medium,
    attribution: { label: depiction.attribution?.label || '' },
    source: { label: '' },
    // A BA plate is not an Otu/CO/FO depiction — hand the label + caption to
    // ImageLightbox as real fields (it shows label bold, caption beneath).
    // The old shape faked depictions:[{label: figure_label}], which the shared
    // lightbox would have run through its taxon-name parser.
    figure_label: depiction.figure_label || '',
    caption: depiction.caption || '',
    depictions: [],
    _associationId: depiction.depiction_object_id
  }
}

async function fetchDepictions(associationIds) {
  if (!associationIds.length) return new Map()

  const depictionParams = new URLSearchParams()
  depictionParams.append('depiction_object_type', 'BiologicalAssociation')
  associationIds.forEach((id) => depictionParams.append('depiction_object_id[]', id))

  const { data: depictions } = await makeAPIRequest.get(`/depictions?${depictionParams.toString()}`)
  if (!depictions.length) return new Map()

  const galleryParams = new URLSearchParams()
  depictions.forEach((d) => galleryParams.append('depiction_id[]', d.id))
  const { data: galleryItems } = await makeAPIRequest.get(`/depictions/gallery?${galleryParams.toString()}`)

  const result = new Map()
  const allImages = []
  for (const item of galleryItems) {
    const image = makeGalleryImage(item)
    if (!result.has(image._associationId)) result.set(image._associationId, [])
    result.get(image._associationId).push(image)
    allImages.push(image)
  }

  if (allImages.length) {
    try {
      const imgParams = new URLSearchParams()
      allImages.forEach((img) => imgParams.append('image_id[]', img.id))
      imgParams.append('extend[]', 'source')
      const { data: imgDataList } = await makeAPIRequest.get(`/images?${imgParams.toString()}`)
      const sourceByImageId = new Map(imgDataList.map((d) => [d.id, d.source]))
      for (const image of allImages) {
        const src = sourceByImageId.get(image.id)
        if (src?.label) {
          image.source = { label: src.label.replace(/(https?:\/\/[^\s<>"]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-secondary hover:underline">$1</a>') }
        }
      }
    } catch { /* source unavailable */ }
  }
  return result
}

async function fetchCitations(associationIds) {
  if (!associationIds.length) return new Map()

  const citParams = new URLSearchParams()
  citParams.append('citation_object_type', 'BiologicalAssociation')
  citParams.append('extend[]', 'source')
  associationIds.forEach((id) => citParams.append('citation_object_id[]', id))

  const { data: citations } = await makeAPIRequest.get(`/citations?${citParams.toString()}`)

  const result = new Map()
  for (const cit of citations) {
    const entry = {
      id: cit.id,
      short: cit.citation_source_body || '',
      full: cit.source?.cached || cit.citation_source_body || ''
    }
    if (!result.has(cit.citation_object_id)) result.set(cit.citation_object_id, [])
    result.get(cit.citation_object_id).push(entry)
  }
  return result
}

async function fetchDistributions(associationIds) {
  if (!associationIds.length) return new Map()

  const params = new URLSearchParams()
  associationIds.forEach((id) => params.append('biological_association_id[]', id))
  const { data } = await makeAPIRequest.get(`/asserted_distributions?${params.toString()}`)

  const result = new Map()
  for (const dist of data) {
    const baId = dist.asserted_distribution_object_id
    const entry = {
      id: dist.id,
      areaId: dist.asserted_distribution_shape?.id,
      area: dist.asserted_distribution_shape?.name || '',
      isAbsent: !!dist.is_absent
    }
    if (!result.has(baId)) result.set(baId, [])
    result.get(baId).push(entry)
  }
  return result
}

/**
 * Query-string prefix scoping the request to either the taxon (default) or
 * a specific group's association ids (once drilled in from the summary).
 * Built as a literal query string, not an axios params object — id lists
 * need repeated `biological_association_id[]=` entries the same way every
 * other multi-id filter in this file does (see fetchDepictions etc.), which
 * an object passed to axios `params` isn't guaranteed to serialize as.
 */
function scopeQueryString() {
  const params = new URLSearchParams()
  if (selectedGroup.value) {
    selectedGroup.value.ids.forEach((id) => params.append('biological_association_id[]', id))
  } else {
    params.append('otu_query[coordinatify]', 'true')
    params.append('otu_query[taxon_name_id][]', props.taxonId)
    params.append('otu_query[descendants]', 'true')
  }
  return params.toString()
}

/**
 * Fetches the same page from /biological_associations/basic (same scope/
 * page/per params, so it lines up 1:1 with the full-endpoint page by id).
 * Reads from biological_association_indices — cheap even at large per,
 * unlike extend[]=taxonomy on the live model. Returns Map<associationId, basicRow>.
 */
async function fetchBasic(url, params) {
  const { data } = await makeAPIRequest.get(url, { params })
  return new Map(data.map((row) => [row.id, row]))
}

// Guards against a slow request finishing after a newer one (e.g. switching
// summary groups faster than the previous group's fetch resolves) and
// overwriting fresher results with stale ones.
let loadRequestId = 0

async function loadBiologicalAssociations(page = 1) {
  const requestId = ++loadRequestId
  isLoading.value = true

  const scope = scopeQueryString()
  const params = { per: pagination.value.per, page }

  try {
    const { data, headers } = await useOtuPageRequest(
      'panel:biological-associations-v2',
      () => makeAPIRequest.get(`/biological_associations?${scope}`, {
        params: { ...params, extend: fullExtend }
      })
    )

    const associationIds = data.map((d) => d.id)

    const [depictionsMap, distributionsMap, citationsMap, basicMap] = await Promise.all([
      fetchDepictions(associationIds),
      fetchDistributions(associationIds),
      fetchCitations(associationIds),
      fetchBasic(`/biological_associations/basic?${scope}`, params)
    ])

    // Pre-fetch DWC locality for CO/FO subjects (grouped by OTU to avoid duplicate fetches)
    const cosByOtuId = new Map()
    for (const item of data) {
      const basic = basicMap.get(item.id)
      if (!basic) continue
      for (const [entity, otuId] of [
        [item.subject, basic.subject_otu_id],
        [item.object, basic.object_otu_id]
      ]) {
        const specimen = resolveSpecimenRef(entity)
        if (!specimen || !otuId) continue
        if (!cosByOtuId.has(otuId)) cosByOtuId.set(otuId, [])
        cosByOtuId.get(otuId).push(specimen.id)
      }
    }
    const localityByCoId = new Map()
    await Promise.all(
      [...cosByOtuId.entries()].map(async ([otuId, coIds]) => {
        const records = await fetchDwcForOtu(otuId)
        for (const coId of coIds) {
          const record = records.find((r) => r.dwc_occurrence_object_id === coId)
          if (record) {
            const parts = [record.country, record.stateProvince, record.county].filter(Boolean)
            const lat = record.decimalLatitude  ? Number(record.decimalLatitude)  : null
            const lon = record.decimalLongitude ? Number(record.decimalLongitude) : null
            if (parts.length || (lat && lon) || record.recordedBy) {
              localityByCoId.set(coId, { text: parts.join(', '), lat, lon, recordedBy: record.recordedBy || null })
            }
          }
        }
      })
    )

    const associations = data.map((item) =>
      makeBiologicalAssociation(
        item,
        depictionsMap.get(item.id)    || [],
        distributionsMap.get(item.id) || [],
        citationsMap.get(item.id)     || [],
        basicMap.get(item.id)         || null,
        localityByCoId
      )
    )

    if (requestId !== loadRequestId) return // superseded by a newer request

    pagination.value = {
      page: Number(headers['pagination-page']),
      per: Number(headers['pagination-per-page']),
      total: Number(headers['pagination-total'])
    }
    biologicalAssociations.value = associations

  } catch (e) {
    if (requestId === loadRequestId) {
      biologicalAssociations.value = []
      pagination.value = { ...pagination.value, total: 0 }
    }
  } finally {
    if (requestId === loadRequestId) isLoading.value = false
  }
}
</script>
