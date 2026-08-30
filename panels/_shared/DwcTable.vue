<!--
  Shared DWC detail modal for CollectionObject / FieldOccurrence records.
  Exposes show({ id, type }) via defineExpose — type is 'CollectionObject'
  or 'FieldOccurrence' (see @/constants/objectTypes). Fetches
  /collection_objects/:id/dwc or /field_occurrences/:id/dwc and renders it,
  plus a GRSciColl institution-name lookup and associatedMedia thumbnails.

  Depended on by (relative import paths from panels/_shared/):
    - ../PanelMapV2/PanelMapV2.vue                        — marker/list-row "show details"
    - ../PanelMapV2/components/Search/OtuSearch.vue       — search result rows
    - ./ImageLightbox.vue                                 — image viewer overlay;
        wrap the ref's parent in <Teleport to="body"> since ImageLightbox itself
        renders inside a fixed-position overlay
    - ../PanelBiologicalAssociationsV2/PanelBiologicalAssociationsV2.vue
        — subject/object "ⓘ" button
    - ../PanelSpecimenOccurrences/components/SingleSpeciesOccurrences.vue
        — record-row "ⓘ" button

  This component also opens ./ImageLightbox.vue (async) when a media thumbnail
  is clicked — that instance is passed :show-info-button="false" so it cannot
  re-open a DwcTable and recurse.

  If you change this file, sanity-check all call sites — none of them keep
  their own copy anymore.

  Layout: a "specimen label" reading order — identity (name, type status,
  collector/date/locality at a glance) and media up top, full Location /
  Coordinates always visible below, everything else (catalog provenance,
  identification paperwork, georeference protocol, morphology) folded into
  a single "More details" disclosure. Every DwC field TaxonWorks returns is
  still reachable, just not all competing for attention at once.
-->
<template>
  <VModal
    v-if="isModalVisible"
    container-class="!max-w-xl"
    @close="isModalVisible = false"
  >
    <template #header>
      <div class="text-sm font-medium">{{ typeLabel }}</div>
      <div
        v-if="subtitle"
        class="text-xs mt-0.5"
      >{{ subtitle }}</div>
    </template>

    <div class="px-5 pb-5 text-sm">
      <div
        v-if="isLoading"
        class="flex items-center gap-2 opacity-60 py-2"
      >
        <VSpinner class="h-4 w-4" />
        <span>Loading…</span>
      </div>

      <template v-else-if="dwc">
        <!-- ── Identity: the two things a visitor actually came for ── -->
        <div class="pt-1 pb-4 border-b border-base-muted">
          <div class="flex items-baseline flex-wrap gap-x-2 gap-y-1">
            <span class="font-serif text-lg leading-snug">
              <RouterLink
                v-if="otuId"
                :to="{ name: 'otus-id', params: { id: otuId } }"
                class="text-secondary hover:underline"
                @click="isModalVisible = false"
              ><em>{{ scientificNameParts.italic }}</em><span v-html="scientificNameSuffix" /></RouterLink>
              <template v-else><em>{{ scientificNameParts.italic }}</em><span v-html="scientificNameSuffix" /></template>
            </span>
          </div>
          <div
            v-if="dwc.typeStatus"
            class="mt-1.5 inline-block text-xs font-medium bg-danger text-white rounded px-1.5 py-0.5"
            v-html="typeStatusHtml"
          />

          <!-- Determination: who called it this, and when — as important as the name itself -->
          <div
            v-if="dwc.identifiedBy || dwc.dateIdentified || dwc.identificationQualifier"
            class="mt-2 text-sm flex flex-wrap items-baseline gap-x-1.5"
          >
            <span class="text-base-soft shrink-0">Identified by</span>
            <a v-if="dwc.identifiedByID?.startsWith('http')" :href="dwc.identifiedByID" target="_blank" rel="noopener noreferrer" class="hover:text-secondary hover:underline">{{ dwc.identifiedBy }}</a>
            <span v-else-if="dwc.identifiedBy">{{ dwc.identifiedBy }}</span>
            <span v-if="dwc.dateIdentified">{{ dwc.identifiedBy ? ', ' : '' }}{{ dwc.dateIdentified }}</span>
            <span v-if="dwc.identificationQualifier" class="italic">({{ dwc.identificationQualifier }})</span>
          </div>

          <!-- Repository: where the specimen is physically held -->
          <div
            v-if="heldAt"
            class="mt-1 text-sm flex flex-wrap items-baseline gap-x-1.5"
          >
            <span class="text-base-soft shrink-0">Held at</span>
            <span class="font-semibold">{{ heldAt.name || heldAt.code }}</span>
            <span v-if="heldAt.name && heldAt.code">({{ heldAt.code }})</span>
          </div>

          <!-- Prior determination history — kept with the current determination, not filed away -->
          <div
            v-if="dwc.previousIdentifications"
            class="mt-1 text-sm flex flex-wrap items-baseline gap-x-1.5"
          >
            <span class="text-base-soft shrink-0">Prior det.</span>
            <span>{{ dwc.previousIdentifications }}</span>
          </div>

          <!-- Associated media thumbnails travel with identity, not buried in "Other" -->
          <div
            v-if="mediaImages.length || dwc.associatedMedia"
            class="mt-3"
          >
            <div v-if="mediaImages.length" class="flex flex-wrap gap-1.5">
              <button
                v-for="(img, i) in mediaImages"
                :key="img.id"
                type="button"
                class="block w-24 h-20 rounded border border-base-muted overflow-hidden bg-base-foreground shrink-0 cursor-pointer hover:opacity-80 transition"
                @click="lightboxIndex = i"
              ><img :src="img.thumb" class="w-full h-full object-cover" /></button>
            </div>
            <div v-else class="flex flex-col gap-0.5">
              <a
                v-for="url in dwc.associatedMedia.split(/[\s|,]+/).filter(Boolean)"
                :key="url"
                :href="url"
                target="_blank"
                rel="noopener noreferrer"
                class="text-secondary hover:underline truncate text-xs"
              >{{ url }}</a>
            </div>
          </div>
        </div>

        <!-- ── Primary details: always visible ── -->
        <dl class="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-0.5 pt-4">
          <template v-if="hasAny('recordedBy','eventDate','year','higherGeography','continent','waterBody','islandGroup','island','country','stateProvince','county','municipality','locality','verbatimLocality','locationRemarks')">
            <div class="col-span-2 mb-1">
              <h4 class="text-xs font-semibold uppercase tracking-wide opacity-40">Location</h4>
            </div>
            <template v-if="dwc.recordedBy">
              <dt class="opacity-50 whitespace-nowrap">Recorded by</dt>
              <dd>
                <a v-if="dwc.recordedByID?.startsWith('http')" :href="dwc.recordedByID" target="_blank" rel="noopener noreferrer" class="text-secondary hover:underline">{{ dwc.recordedBy }}</a>
                <template v-else>{{ dwc.recordedBy }}</template>
              </dd>
            </template>
            <template v-if="metaDate">
              <dt class="opacity-50 whitespace-nowrap">Date</dt>
              <dd>{{ metaDate }}</dd>
            </template>
            <template v-if="dwc.higherGeography">
              <dt class="opacity-50 whitespace-nowrap">Higher geography</dt>
              <dd>{{ dwc.higherGeography }}</dd>
            </template>
            <template v-if="dwc.continent">
              <dt class="opacity-50 whitespace-nowrap">Continent</dt>
              <dd>{{ dwc.continent }}</dd>
            </template>
            <template v-if="dwc.waterBody">
              <dt class="opacity-50 whitespace-nowrap">Water body</dt>
              <dd>{{ dwc.waterBody }}</dd>
            </template>
            <template v-if="dwc.islandGroup">
              <dt class="opacity-50 whitespace-nowrap">Island group</dt>
              <dd>{{ dwc.islandGroup }}</dd>
            </template>
            <template v-if="dwc.island">
              <dt class="opacity-50 whitespace-nowrap">Island</dt>
              <dd>{{ dwc.island }}</dd>
            </template>
            <template v-if="dwc.country">
              <dt class="opacity-50 whitespace-nowrap">Country</dt>
              <dd>{{ dwc.country }}</dd>
            </template>
            <template v-if="dwc.stateProvince">
              <dt class="opacity-50 whitespace-nowrap">State / Province</dt>
              <dd>{{ dwc.stateProvince }}</dd>
            </template>
            <template v-if="dwc.county">
              <dt class="opacity-50 whitespace-nowrap">County</dt>
              <dd>{{ dwc.county }}</dd>
            </template>
            <template v-if="dwc.municipality">
              <dt class="opacity-50 whitespace-nowrap">Municipality</dt>
              <dd>{{ dwc.municipality }}</dd>
            </template>
            <template v-if="dwc.locality">
              <dt class="opacity-50 whitespace-nowrap">Locality</dt>
              <dd>{{ dwc.locality }}</dd>
            </template>
            <template v-if="dwc.verbatimLocality && dwc.verbatimLocality !== dwc.locality">
              <dt class="opacity-50 whitespace-nowrap">Verbatim locality</dt>
              <dd>{{ dwc.verbatimLocality }}</dd>
            </template>
            <template v-if="dwc.locationRemarks">
              <dt class="opacity-50 whitespace-nowrap">Location remarks</dt>
              <dd>{{ dwc.locationRemarks }}</dd>
            </template>
          </template>

          <template v-if="hasAny('minimumElevationInMeters','verbatimElevation','minimumDepthInMeters')">
            <div class="col-span-2 mt-3 mb-1">
              <h4 class="text-xs font-semibold uppercase tracking-wide opacity-40">Elevation / Depth</h4>
            </div>
            <template v-if="dwc.minimumElevationInMeters">
              <dt class="opacity-50 whitespace-nowrap">Elevation</dt>
              <dd>
                {{ dwc.minimumElevationInMeters }}<template v-if="dwc.maximumElevationInMeters && dwc.maximumElevationInMeters !== dwc.minimumElevationInMeters"> – {{ dwc.maximumElevationInMeters }}</template> m
              </dd>
            </template>
            <template v-else-if="dwc.verbatimElevation">
              <dt class="opacity-50 whitespace-nowrap">Elevation</dt>
              <dd>{{ dwc.verbatimElevation }}</dd>
            </template>
            <template v-if="dwc.minimumDepthInMeters">
              <dt class="opacity-50 whitespace-nowrap">Depth</dt>
              <dd>
                {{ dwc.minimumDepthInMeters }}<template v-if="dwc.maximumDepthInMeters && dwc.maximumDepthInMeters !== dwc.minimumDepthInMeters"> – {{ dwc.maximumDepthInMeters }}</template> m
              </dd>
            </template>
          </template>

          <template v-if="hasAny('decimalLatitude','verbatimCoordinates')">
            <div class="col-span-2 mt-3 mb-1">
              <h4 class="text-xs font-semibold uppercase tracking-wide opacity-40">Coordinates</h4>
            </div>
            <template v-if="dwc.decimalLatitude">
              <dt class="opacity-50 whitespace-nowrap">Lat / Lon</dt>
              <dd>{{ dwc.decimalLatitude }}, {{ dwc.decimalLongitude }}</dd>
            </template>
            <template v-if="dwc.coordinateUncertaintyInMeters">
              <dt class="opacity-50 whitespace-nowrap">Uncertainty</dt>
              <dd>{{ dwc.coordinateUncertaintyInMeters }} m</dd>
            </template>
            <template v-if="dwc.geodeticDatum">
              <dt class="opacity-50 whitespace-nowrap">Datum</dt>
              <dd>{{ dwc.geodeticDatum }}</dd>
            </template>
            <template v-if="dwc.verbatimCoordinates">
              <dt class="opacity-50 whitespace-nowrap">Verbatim</dt>
              <dd>{{ dwc.verbatimCoordinates }}</dd>
            </template>
            <template v-if="dwc.decimalLatitude && dwc.decimalLongitude">
              <dt class="opacity-50 whitespace-nowrap">Map</dt>
              <dd>
                <a
                  :href="`https://www.openstreetmap.org/?mlat=${dwc.decimalLatitude}&mlon=${dwc.decimalLongitude}&zoom=10`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-secondary hover:underline"
                >Open in OpenStreetMap ↗</a>
              </dd>
            </template>
          </template>
        </dl>

        <p
          v-if="!hasAny('recordedBy','eventDate','year','higherGeography','continent','waterBody','islandGroup','island','country','stateProvince','county','municipality','locality','verbatimLocality','locationRemarks','minimumElevationInMeters','verbatimElevation','minimumDepthInMeters','decimalLatitude','verbatimCoordinates')"
          class="pt-4 text-xs opacity-50"
        >No location or collection event data recorded.</p>

        <!-- ── Biological associations — including ones only reachable via a wrapping
             AnatomicalPart (a nidus, an egg, ...), not just this record directly ── -->
        <dl
          v-if="bioAssociations.length"
          class="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-0.5 pt-4"
        >
          <div class="col-span-2 mb-1">
            <h4 class="text-xs font-semibold uppercase tracking-wide opacity-40">Biological associations</h4>
          </div>
          <template
            v-for="ba in bioAssociations"
            :key="ba.id"
          >
            <dt class="opacity-50 whitespace-nowrap">{{ ba.relationshipLabel }}</dt>
            <dd>
              <RouterLink
                v-if="ba.otherOtuId"
                :to="{ name: 'otus-id', params: { id: ba.otherOtuId } }"
                class="text-secondary hover:underline"
                @click="isModalVisible = false"
              ><em>{{ ba.otherName.italic }}</em>{{ ba.otherName.plain ? ' ' + ba.otherName.plain : '' }}</RouterLink>
              <template v-else><em v-if="ba.otherName.italic">{{ ba.otherName.italic }}</em>{{ ba.otherName.plain ? ' ' + ba.otherName.plain : '' }}</template>
            </dd>
          </template>
        </dl>
        <div
          v-else-if="isLoadingBioAssociations"
          class="pt-4 flex items-center gap-2 text-xs opacity-60"
        >
          <VSpinner class="h-3 w-3" />
          <span>Loading biological associations…</span>
        </div>

        <!-- ── Everything else: catalog provenance, ID paperwork, georeference, morphology ── -->
        <details
          v-if="hasMoreDetails"
          class="mt-4 pt-3 border-t border-base-muted group"
        >
          <summary class="cursor-pointer text-xs font-semibold uppercase tracking-wide opacity-50 hover:opacity-80 select-none list-none flex items-center gap-1.5">
            <span class="inline-block motion-safe:transition-transform group-open:rotate-90">›</span>
            More details
          </summary>

          <dl class="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-0.5 mt-3">
            <!-- ── Record ── -->
            <div class="col-span-2 mb-1">
              <h4 class="text-xs font-semibold uppercase tracking-wide opacity-40">Record</h4>
            </div>
            <template v-if="dwc.basisOfRecord">
              <dt class="opacity-50 whitespace-nowrap">Basis of record</dt>
              <dd>{{ dwc.basisOfRecord }}</dd>
            </template>
            <template v-if="dwc.catalogNumber">
              <dt class="opacity-50 whitespace-nowrap">Catalog no.</dt>
              <dd>{{ dwc.catalogNumber }}</dd>
            </template>
            <template v-if="dwc.recordNumber">
              <dt class="opacity-50 whitespace-nowrap">Record no.</dt>
              <dd>{{ dwc.recordNumber }}</dd>
            </template>
            <template v-if="dwc.otherCatalogNumbers">
              <dt class="opacity-50 whitespace-nowrap">Other catalog nos.</dt>
              <dd>{{ dwc.otherCatalogNumbers }}</dd>
            </template>
            <template v-if="dwc.occurrenceID">
              <dt class="opacity-50 whitespace-nowrap">Occurrence ID</dt>
              <dd class="break-all">{{ dwc.occurrenceID }}</dd>
            </template>
            <!-- For database maintainers: the TaxonWorks record itself, not just the DwC export of it -->
            <dt class="opacity-50 whitespace-nowrap">TaxonWorks ID</dt>
            <dd>
              <a
                :href="taxonWorksUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="text-secondary hover:underline"
              >{{ currentId }} ↗</a>
            </dd>

            <!-- ── Identification (paperwork not already surfaced as "Identified by" above) ── -->
            <template v-if="hasAny('verbatimIdentification','identificationRemarks')">
              <div class="col-span-2 mt-3 mb-1">
                <h4 class="text-xs font-semibold uppercase tracking-wide opacity-40">Identification</h4>
              </div>
              <template v-if="dwc.verbatimIdentification">
                <dt class="opacity-50 whitespace-nowrap">Verbatim ID</dt>
                <dd>{{ dwc.verbatimIdentification }}</dd>
              </template>
              <template v-if="dwc.identificationRemarks">
                <dt class="opacity-50 whitespace-nowrap">ID remarks</dt>
                <dd>{{ dwc.identificationRemarks }}</dd>
              </template>
            </template>

            <!-- ── Label ── -->
            <template v-if="dwc.verbatimLabel">
              <div class="col-span-2 mt-3 mb-1">
                <h4 class="text-xs font-semibold uppercase tracking-wide opacity-40">Verbatim label</h4>
              </div>
              <dd class="col-span-2 whitespace-pre-line">{{ dwc.verbatimLabel }}</dd>
            </template>

            <!-- ── Collection event (detail) ── -->
            <template v-if="hasAny('verbatimEventDate','eventTime','fieldNumber','samplingProtocol','samplingEffort','habitat','fieldNotes','eventRemarks')">
              <div class="col-span-2 mt-3 mb-1">
                <h4 class="text-xs font-semibold uppercase tracking-wide opacity-40">Collection event</h4>
              </div>
              <template v-if="dwc.verbatimEventDate && dwc.verbatimEventDate !== dwc.eventDate">
                <dt class="opacity-50 whitespace-nowrap">Verbatim date</dt>
                <dd>{{ dwc.verbatimEventDate }}</dd>
              </template>
              <template v-if="dwc.eventTime">
                <dt class="opacity-50 whitespace-nowrap">Time</dt>
                <dd>{{ dwc.eventTime }}</dd>
              </template>
              <template v-if="dwc.fieldNumber">
                <dt class="opacity-50 whitespace-nowrap">Field no.</dt>
                <dd>{{ dwc.fieldNumber }}</dd>
              </template>
              <template v-if="dwc.samplingProtocol">
                <dt class="opacity-50 whitespace-nowrap">Method</dt>
                <dd>{{ dwc.samplingProtocol }}</dd>
              </template>
              <template v-if="dwc.samplingEffort">
                <dt class="opacity-50 whitespace-nowrap">Sampling effort</dt>
                <dd>{{ dwc.samplingEffort }}</dd>
              </template>
              <template v-if="dwc.habitat">
                <dt class="opacity-50 whitespace-nowrap">Habitat</dt>
                <dd>{{ dwc.habitat }}</dd>
              </template>
              <template v-if="dwc.fieldNotes">
                <dt class="opacity-50 whitespace-nowrap">Field notes</dt>
                <dd>{{ dwc.fieldNotes }}</dd>
              </template>
              <template v-if="dwc.eventRemarks">
                <dt class="opacity-50 whitespace-nowrap">Event remarks</dt>
                <dd>{{ dwc.eventRemarks }}</dd>
              </template>
            </template>

            <!-- ── Georeference ── -->
            <template v-if="hasAny('georeferencedBy','georeferenceProtocol','georeferenceSources','georeferenceRemarks')">
              <div class="col-span-2 mt-3 mb-1">
                <h4 class="text-xs font-semibold uppercase tracking-wide opacity-40">Georeference</h4>
              </div>
              <template v-if="dwc.georeferencedBy">
                <dt class="opacity-50 whitespace-nowrap">By</dt>
                <dd>{{ dwc.georeferencedBy }}</dd>
              </template>
              <template v-if="dwc.georeferencedDate">
                <dt class="opacity-50 whitespace-nowrap">Date</dt>
                <dd>{{ dwc.georeferencedDate }}</dd>
              </template>
              <template v-if="dwc.georeferenceProtocol">
                <dt class="opacity-50 whitespace-nowrap">Protocol</dt>
                <dd>{{ dwc.georeferenceProtocol }}</dd>
              </template>
              <template v-if="dwc.georeferenceSources">
                <dt class="opacity-50 whitespace-nowrap">Source</dt>
                <dd>{{ dwc.georeferenceSources }}</dd>
              </template>
              <template v-if="dwc.georeferenceRemarks">
                <dt class="opacity-50 whitespace-nowrap">Remarks</dt>
                <dd>{{ dwc.georeferenceRemarks }}</dd>
              </template>
            </template>

            <!-- ── Other ── -->
            <template v-if="hasAny('dynamicProperties','informationWithheld','dataGeneralizations','associatedTaxa','associatedReferences','associatedSequences')">
              <div class="col-span-2 mt-3 mb-1">
                <h4 class="text-xs font-semibold uppercase tracking-wide opacity-40">Other</h4>
              </div>
              <template v-if="dwc.associatedTaxa">
                <dt class="opacity-50 whitespace-nowrap">Associated taxa</dt>
                <dd>{{ dwc.associatedTaxa }}</dd>
              </template>
              <template v-if="dwc.associatedReferences">
                <dt class="opacity-50 whitespace-nowrap">Associated refs.</dt>
                <dd>{{ dwc.associatedReferences }}</dd>
              </template>
              <template v-if="dwc.associatedSequences">
                <dt class="opacity-50 whitespace-nowrap">Associated sequences</dt>
                <dd>{{ dwc.associatedSequences }}</dd>
              </template>
              <template v-if="dwc.dynamicProperties">
                <dt class="opacity-50 whitespace-nowrap">Dynamic properties</dt>
                <dd>{{ dwc.dynamicProperties }}</dd>
              </template>
              <template v-if="dwc.informationWithheld">
                <dt class="opacity-50 whitespace-nowrap">Information withheld</dt>
                <dd>{{ dwc.informationWithheld }}</dd>
              </template>
              <template v-if="dwc.dataGeneralizations">
                <dt class="opacity-50 whitespace-nowrap">Data generalizations</dt>
                <dd>{{ dwc.dataGeneralizations }}</dd>
              </template>
            </template>

            <!-- ── Specimen (least interesting, shown last) ── -->
            <template v-if="hasAny('sex','lifeStage','reproductiveCondition','behavior','preparations','individualCount','organismQuantity','occurrenceStatus','occurrenceRemarks')">
              <div class="col-span-2 mt-3 mb-1">
                <h4 class="text-xs font-semibold uppercase tracking-wide opacity-40">Specimen</h4>
              </div>
              <template v-if="dwc.sex">
                <dt class="opacity-50 whitespace-nowrap">Sex</dt>
                <dd>{{ dwc.sex }}</dd>
              </template>
              <template v-if="dwc.lifeStage">
                <dt class="opacity-50 whitespace-nowrap">Life stage</dt>
                <dd>{{ dwc.lifeStage }}</dd>
              </template>
              <template v-if="dwc.reproductiveCondition">
                <dt class="opacity-50 whitespace-nowrap">Reproductive condition</dt>
                <dd>{{ dwc.reproductiveCondition }}</dd>
              </template>
              <template v-if="dwc.behavior">
                <dt class="opacity-50 whitespace-nowrap">Behavior</dt>
                <dd>{{ dwc.behavior }}</dd>
              </template>
              <template v-if="dwc.preparations">
                <dt class="opacity-50 whitespace-nowrap">Preparations</dt>
                <dd>{{ dwc.preparations }}</dd>
              </template>
              <template v-if="dwc.individualCount">
                <dt class="opacity-50 whitespace-nowrap">Individual count</dt>
                <dd>{{ dwc.individualCount }}</dd>
              </template>
              <template v-if="dwc.organismQuantity">
                <dt class="opacity-50 whitespace-nowrap">Quantity</dt>
                <dd>{{ dwc.organismQuantity }}{{ dwc.organismQuantityType ? ' ' + dwc.organismQuantityType : '' }}</dd>
              </template>
              <template v-if="dwc.occurrenceStatus">
                <dt class="opacity-50 whitespace-nowrap">Occurrence status</dt>
                <dd>{{ dwc.occurrenceStatus }}</dd>
              </template>
              <template v-if="dwc.occurrenceRemarks">
                <dt class="opacity-50 whitespace-nowrap">Remarks</dt>
                <dd>{{ dwc.occurrenceRemarks }}</dd>
              </template>
            </template>
          </dl>
        </details>
      </template>

      <p
        v-else-if="!isLoading"
        class="opacity-50"
      >No details available.</p>

    </div>
  </VModal>

  <!-- Media strip opens the shared lightbox. show-info-button=false: this
       lightbox must not offer its own ⓘ back into a DwcTable (recursion). -->
  <Teleport to="body">
    <ImageLightbox
      v-if="lightboxIndex !== null && mediaImages.length"
      :images="mediaImages"
      :index="lightboxIndex"
      :next="lightboxIndex < mediaImages.length - 1"
      :previous="lightboxIndex > 0"
      :show-info-button="false"
      @select-index="lightboxIndex = $event"
      @next="lightboxIndex++"
      @previous="lightboxIndex--"
      @close="lightboxIndex = null"
    />
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, defineAsyncComponent } from 'vue'
import { makeAPIRequest } from '@/utils'
import { FIELD_OCCURRENCE, COLLECTION_OBJECT } from '@/constants/objectTypes'
import { resolveSpecimenRef } from './specimenRef.js'

// Lets a host that renders this above its own overlay (ImageLightbox's ⓘ button)
// know when the modal has been dismissed — so it can re-take key handling / the
// body scroll lock instead of both overlays reacting to one Escape.
const emit = defineEmits(['close'])

// Async: ImageLightbox statically imports this file (its ⓘ button opens a
// DwcTable), so importing it back statically would be a require cycle. It's
// also only needed once a media thumbnail is clicked.
const ImageLightbox = defineAsyncComponent(() => import('./ImageLightbox.vue'))

const isLoading = ref(false)
const isModalVisible = ref(false)
watch(isModalVisible, (visible) => {
  if (!visible) emit('close')
})
const dwc = ref(null)
const itemType = ref(null)
const currentId = ref(null)
const otuId = ref(null)
const institutionFullName = ref(null)
const collectionFullName = ref(null)
const mediaImages = ref([])
const lightboxIndex = ref(null)  // media-strip lightbox: index of open image, null = closed
const bioAssociations = ref([])
const isLoadingBioAssociations = ref(false)

const ENDPOINTS = {
  [COLLECTION_OBJECT]: (id) => `/collection_objects/${id}/dwc`,
  [FIELD_OCCURRENCE]: (id) => `/field_occurrences/${id}/dwc`
}

const TYPE_LABELS = {
  [COLLECTION_OBJECT]: 'Collection Object',
  [FIELD_OCCURRENCE]: 'Field Occurrence'
}

// The bare model-name route (e.g. /collection_objects/:id) is TaxonWorks' own
// resourceful URL for the record itself — same convention this app already
// relies on for /otus/:id RouterLinks. Requires a TaxonWorks login to view.
const TW_RECORD_PATH = {
  [COLLECTION_OBJECT]: (id) => `/collection_objects/${id}`,
  [FIELD_OCCURRENCE]: (id) => `/field_occurrences/${id}`
}
const { url: API_URL } = __APP_ENV__
const TW_BASE = API_URL.replace(/\/api\/v1\/?$/, '')

const taxonWorksUrl = computed(() => {
  if (!currentId.value || !itemType.value) return null
  return `${TW_BASE}${TW_RECORD_PATH[itemType.value](currentId.value)}`
})

// Module-level caches: code → full name (institution and collection are
// separate GRSciColl record types, e.g. code "NHRS" resolves to the
// institution "Swedish Museum of Natural History" but is also, confusingly,
// the code of its "Department of Entomology" collection — cache separately).
const instNameCache = new Map()
const collNameCache = new Map()

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

// Only called when collectionCode differs from institutionCode, i.e. it
// names a sub-collection — pass institutionCode to disambiguate the search.
async function resolveCollectionName(code, institutionCode) {
  if (!code) return null
  const cacheKey = `${institutionCode || ''}|${code}`
  if (collNameCache.has(cacheKey)) return collNameCache.get(cacheKey)
  try {
    const params = new URLSearchParams({ code })
    if (institutionCode) params.set('institutionCode', institutionCode)
    const r = await fetch(`https://api.gbif.org/v1/grscicoll/collection?${params}`)
    if (r.ok) {
      const j = await r.json()
      if (j.results?.length === 1) {
        collNameCache.set(cacheKey, j.results[0].name)
        return j.results[0].name
      }
    }
  } catch {}
  collNameCache.set(cacheKey, null)
  return null
}

const typeLabel = computed(() => TYPE_LABELS[itemType.value] ?? itemType.value)

// Header subtitle carries provenance (what kind of record, where it's kept)
// so "Record" doesn't need its own always-visible section.
const subtitle = computed(() => {
  if (!dwc.value) return null
  const parts = [dwc.value.basisOfRecord, dwc.value.institutionCode, dwc.value.catalogNumber].filter(Boolean)
  return parts.length ? parts.join(' · ') : null
})

// Repository line under identity: resolved full name(s), raw code(s) as
// fallback while resolving / when GRSciColl has no unambiguous match.
const heldAt = computed(() => {
  if (!dwc.value) return null
  const code = dwc.value.institutionCode
  const collCode = dwc.value.collectionCode
  if (!code && !collCode) return null
  const names = [institutionFullName.value, collectionFullName.value].filter(Boolean)
  const codes = [code, collCode].filter(Boolean)
  return {
    name: names.length ? names.join(' — ') : null,
    code: codes.join(' · ')
  }
})

function hasAny(...keys) {
  return dwc.value && keys.some((k) => dwc.value[k])
}

// The "More details" disclosure always has at least the TaxonWorks ID/link,
// so it's shown whenever a record is loaded.
const hasMoreDetails = computed(() => !!dwc.value)

// Date shown next to the collector's name
const metaDate = computed(() => {
  if (!dwc.value) return null
  if (dwc.value.eventDate) return dwc.value.eventDate
  if (dwc.value.year) return [dwc.value.day, dwc.value.month, dwc.value.year].filter(Boolean).join('.')
  return null
})

function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function splitScientificName(name) {
  const words = (name || '').trim().split(/\s+/)
  let i = 1
  while (i < words.length) {
    const w = words[i]
    if (/^[a-z]/.test(w)) { i++; continue }
    if (/^\(/.test(w) && /^[a-z]/.test(words[i + 1] || '')) { i++; continue }
    if (/^\[/.test(w)) { i++; continue }
    break
  }
  return { italic: words.slice(0, i).join(' '), plain: words.slice(i).join(' ') }
}

const scientificNameParts = computed(() =>
  dwc.value?.scientificName ? splitScientificName(dwc.value.scientificName) : { italic: '', plain: '' }
)

const scientificNameSuffix = computed(() => {
  const plain = scientificNameParts.value.plain
  return plain ? ' ' + escHtml(plain) : ''
})

const typeStatusHtml = computed(() => {
  const s = dwc.value?.typeStatus
  if (!s) return ''
  const idx = s.indexOf(' of ')
  if (idx === -1) return escHtml(s)
  const prefix = s.slice(0, idx + 4)
  const { italic, plain } = splitScientificName(s.slice(idx + 4))
  return escHtml(prefix) + (italic ? `<em>${escHtml(italic)}</em>` : '') + (plain ? ` ${escHtml(plain)}` : '')
})

async function loadMediaImages(associatedMedia) {
  const links = associatedMedia.split('|').map(l => l.trim()).filter(Boolean)
  const results = await Promise.all(
    links.map(link => {
      const m = link.match(/\/api\/v1(.+)/)
      if (!m) return Promise.resolve(null)
      // extend[] so the shared lightbox shows real attribution / source
      // instead of "attribution missing". Not depictions: these are the
      // specimen's own images, its type status is already in the modal.
      return makeAPIRequest
        .get(m[1], { params: { extend: ['attribution', 'source'] } })
        .then(({ data }) => data)
        .catch(() => null)
    })
  )
  mediaImages.value = results.filter(Boolean)
}

// Otu object_label reads like "Genus species Author, Year" — italicize with
// splitScientificName. Anything else (a CO/FO/AnatomicalPart on the other
// side of the relationship, which is rare in practice) falls back to plain
// text rather than trying to parse its catalog-string label.
function bioPartyLabel(entity) {
  if (!entity) return { italic: '', plain: '' }
  if (entity.base_class === 'Otu') return splitScientificName(entity.object_label || '')
  return { italic: '', plain: (entity.object_label || '').split('\n')[0] }
}

// When OUR side of the association is an AnatomicalPart (e.g. "egg:
// FieldOccurrence 4997; ..."), the part name is the substance of the
// relationship — "egg collected from Corylus avellana", not just "collected
// from Corylus avellana" as if the whole organism were the source.
function anatomicalPartPrefix(entity) {
  if (!entity || entity.base_class !== 'AnatomicalPart') return null
  const label = entity.object_label || ''
  const idx = label.indexOf(': ')
  return idx > 0 ? label.slice(0, idx) : null
}

/**
 * Finds biological associations this specific CO/FO participates in — either
 * directly, or via a wrapping AnatomicalPart (a nidus, an egg, ...). There's
 * no server-side filter for "associations of the specimen an AnatomicalPart
 * wraps", so this fetches every association for the specimen's OTU (usually
 * a handful — this endpoint is a single species' worth of records) and
 * matches client-side with the same resolveSpecimenRef() the BA panel uses
 * to go the other direction (AnatomicalPart → wrapped specimen).
 */
async function fetchBioAssociations(otuIdVal, specimenType, specimenId) {
  if (!otuIdVal) return []
  const { data } = await makeAPIRequest.get('/biological_associations', {
    params: {
      'otu_query[otu_id][]': otuIdVal,
      extend: ['subject', 'object', 'biological_relationship'],
      per: 100
    }
  })

  const matches = []
  for (const ba of data) {
    const subjRef = resolveSpecimenRef(ba.subject)
    const objRef = resolveSpecimenRef(ba.object)
    const weAreSubject = subjRef?.type === specimenType && subjRef?.id === specimenId
    const weAreObject = objRef?.type === specimenType && objRef?.id === specimenId
    if (!weAreSubject && !weAreObject) continue

    const us = weAreSubject ? ba.subject : ba.object
    const other = weAreSubject ? ba.object : ba.subject
    const rel = ba.biological_relationship || {}
    const partPrefix = anatomicalPartPrefix(us)
    const verb = weAreSubject ? (rel.name || '') : (rel.inverted_name || rel.name || '')
    matches.push({
      id: ba.id,
      relationshipLabel: partPrefix ? `${partPrefix} ${verb}` : verb,
      otherName: bioPartyLabel(other),
      otherOtuId: other?.base_class === 'Otu' ? other.id : null
    })
  }
  return matches
}

function show({ id, type }) {
  isModalVisible.value = true
  isLoading.value = true
  dwc.value = null
  institutionFullName.value = null
  collectionFullName.value = null
  itemType.value = type
  currentId.value = id
  otuId.value = null
  mediaImages.value = []
  lightboxIndex.value = null
  bioAssociations.value = []

  makeAPIRequest(ENDPOINTS[type](id))
    .then(({ data }) => {
      dwc.value = data
      otuId.value = data.otu_id ?? null
      if (data.institutionCode) {
        resolveInstitutionName(data.institutionCode, data.institutionID).then((name) => {
          institutionFullName.value = name
        })
      }
      if (data.collectionCode) {
        resolveCollectionName(data.collectionCode, data.institutionCode).then((name) => {
          collectionFullName.value = name
        })
      }
      if (data.associatedMedia) loadMediaImages(data.associatedMedia)
      if (data.otu_id) {
        isLoadingBioAssociations.value = true
        fetchBioAssociations(data.otu_id, type, id)
          .then((matches) => { bioAssociations.value = matches })
          .catch(() => {})
          .finally(() => { isLoadingBioAssociations.value = false })
      }
    })
    .catch(() => {})
    .finally(() => {
      isLoading.value = false
    })
}

defineExpose({ show })
</script>
