import { makeAPIRequest } from '@/utils'

const DWC_CATEGORIES = {
  Taxon: [
    'scientificName',
    'scientificNameAuthorship',
    'vernacularName',
    'taxonRank',
    'taxonomicStatus',
    'kingdom',
    'phylum',
    'class',
    'order',
    'superfamily',
    'family',
    'subfamily',
    'tribe',
    'genus',
    'species',
    'specificEpithet',
    'infraspecificEpithet',
    'higherClassification',
    'nomenclaturalCode',
    'taxonID',
    'nameAccordingTo',
    'namePublishedIn',
    'acceptedNameUsage',
    'parentNameUsage',
    'originalNameUsage',
    'taxonRemarks'
  ],
  Location: [
    'country',
    'stateProvince',
    'county',
    'municipality',
    'locality',
    'decimalLatitude',
    'decimalLongitude',
    'coordinateUncertaintyInMeters',
    'geodeticDatum',
    'verbatimLocality',
    'continent',
    'waterBody',
    'island',
    'islandGroup',
    'minimumElevationInMeters',
    'maximumElevationInMeters',
    'verbatimElevation',
    'minimumDepthInMeters',
    'maximumDepthInMeters',
    'verbatimDepth',
    'locationRemarks',
    'georeferencedBy',
    'georeferencedDate',
    'georeferenceProtocol',
    'georeferenceSources',
    'georeferenceRemarks'
  ],
  Event: [
    'eventDate',
    'eventTime',
    'year',
    'month',
    'day',
    'verbatimEventDate',
    'habitat',
    'samplingProtocol',
    'samplingEffort',
    'fieldNotes',
    'fieldNumber',
    'eventRemarks'
  ],
  Occurrence: [
    'catalogNumber',
    'recordedBy',
    'recordNumber',
    'occurrenceID',
    'individualCount',
    'sex',
    'lifeStage',
    'reproductiveCondition',
    'behavior',
    'preparations',
    'disposition',
    'occurrenceStatus',
    'associatedReferences',
    'associatedTaxa',
    'otherCatalogNumbers',
    'typeStatus',
    'occurrenceRemarks',
    'associatedMedia'
  ],
  Identification: [
    'identifiedBy',
    'dateIdentified',
    'identificationQualifier',
    'identificationRemarks'
  ],
  'Record-level': [
    'basisOfRecord',
    'institutionID',
    'institutionCode',
    'collectionCode',
    'datasetName',
    'modified',
    'language',
    'license',
    'rightsHolder',
    'bibliographicCitation',
    'references',
    'informationWithheld'
  ]
}

// Unparseable values are passed through as raw text: the API sometimes sends
// verbatim dates that are not dates at all.
function formatDate(value) {
  const date = new Date(value)

  if (isNaN(date.getTime())) return { type: 'text', value }

  return { type: 'date', value: date }
}

async function splitMediaUrls(value) {
  const { project_token } = __APP_ENV__
  const urls = value
    .split('|')
    .map((url) => url.trim())
    .filter(Boolean)

  const promises = urls.map((url) =>
    makeAPIRequest.get(`${url}?project_token=${project_token}`, {
      params: {
        extend: ['attribution', 'depictions', 'source']
      }
    })
  )

  const results = await Promise.all(promises)
  const images = results.map((res) => res.data)

  return { type: 'images', images }
}

const DWC_TRANSFORMERS = {
  eventDate: formatDate,
  dateIdentified: formatDate,
  modified: formatDate,
  georeferencedDate: formatDate,
  associatedMedia: splitMediaUrls
}

export async function transformEntries(entries) {
  const results = await Promise.all(
    entries.map(async ([key, value]) => {
      const transformer = DWC_TRANSFORMERS[key]
      const transformed = transformer
        ? await transformer(value)
        : { type: 'text', value }

      return { key, transformed }
    })
  )

  return results
}

export const HIDDEN_FIELDS = new Set([
  'created_by_id',
  'updated_by_id',
  'project_id'
])

/**
 * Human label for a Darwin Core term.
 *
 * Terms the catalog knows are translated; anything else (the API may send
 * terms this version has never heard of) falls back to humanizing the term
 * name, which is language-independent and better than showing a raw key.
 *
 * @param {string} field - Darwin Core term name
 * @param {{ t: Function, te: Function }} i18n - from useI18n()
 * @returns {string}
 */
export function getLabel(field, { t, te }) {
  const key = `dwc.labels.${field}`

  return te(key)
    ? t(key)
    : field.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())
}

const fieldToCategory = new Map()
const fieldOrder = new Map()

for (const [category, fields] of Object.entries(DWC_CATEGORIES)) {
  for (let i = 0; i < fields.length; i++) {
    fieldToCategory.set(fields[i], category)
    fieldOrder.set(fields[i], i)
  }
}

const CATEGORY_ORDER = Object.keys(DWC_CATEGORIES).concat('Other')

// Category names double as internal ids, so their labels live behind a key map
// rather than being translated in place.
const CATEGORY_LABEL_KEYS = {
  Taxon: 'dwc.categories.taxon',
  Location: 'dwc.categories.location',
  Event: 'dwc.categories.event',
  Occurrence: 'dwc.categories.occurrence',
  Identification: 'dwc.categories.identification',
  'Record-level': 'dwc.categories.record_level',
  Other: 'dwc.categories.other'
}

export function groupEntries(entries) {
  const groups = {}

  for (const entry of entries) {
    const key = Array.isArray(entry) ? entry[0] : entry.key
    const category = fieldToCategory.get(key) || 'Other'

    if (!groups[category]) {
      groups[category] = []
    }

    groups[category].push(entry)
  }

  return CATEGORY_ORDER.filter((cat) => groups[cat]?.length).map(
    (category) => ({
      category,
      categoryKey: CATEGORY_LABEL_KEYS[category] ?? 'dwc.categories.other',
      entries: groups[category].sort((a, b) => {
        const keyA = Array.isArray(a) ? a[0] : a.key
        const keyB = Array.isArray(b) ? b[0] : b.key

        return (
          (fieldOrder.get(keyA) ?? Infinity) -
          (fieldOrder.get(keyB) ?? Infinity)
        )
      })
    })
  )
}
