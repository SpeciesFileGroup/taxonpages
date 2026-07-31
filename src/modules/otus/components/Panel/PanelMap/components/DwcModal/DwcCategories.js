import { makeAPIRequest } from '@/utils'

const DWC_LABELS = {
  // Taxon
  kingdom: 'Kingdom',
  phylum: 'Phylum',
  class: 'Class',
  order: 'Order',
  superfamily: 'Superfamily',
  family: 'Family',
  subfamily: 'Subfamily',
  tribe: 'Tribe',
  genus: 'Genus',
  species: 'Species',
  scientificName: 'Scientific name',
  scientificNameAuthorship: 'Authorship',
  taxonRank: 'Rank',
  taxonID: 'Taxon ID',
  taxonomicStatus: 'Taxonomic status',
  nomenclaturalCode: 'Nomenclatural code',
  specificEpithet: 'Specific epithet',
  infraspecificEpithet: 'Infraspecific epithet',
  higherClassification: 'Higher classification',
  vernacularName: 'Common name',
  nameAccordingTo: 'Name according to',
  namePublishedIn: 'Name published in',
  acceptedNameUsage: 'Accepted name',
  parentNameUsage: 'Parent name',
  originalNameUsage: 'Original name',
  taxonRemarks: 'Taxon remarks',

  // Location
  decimalLatitude: 'Latitude',
  decimalLongitude: 'Longitude',
  coordinateUncertaintyInMeters: 'Coordinate uncertainty (m)',
  geodeticDatum: 'Geodetic datum',
  country: 'Country',
  countryCode: 'Country code',
  stateProvince: 'State/Province',
  county: 'County',
  municipality: 'Municipality',
  locality: 'Locality',
  verbatimLocality: 'Verbatim locality',
  minimumElevationInMeters: 'Min. elevation (m)',
  maximumElevationInMeters: 'Max. elevation (m)',
  verbatimElevation: 'Verbatim elevation',
  continent: 'Continent',
  waterBody: 'Water body',
  island: 'Island',
  islandGroup: 'Island group',
  minimumDepthInMeters: 'Min. depth (m)',
  maximumDepthInMeters: 'Max. depth (m)',
  verbatimDepth: 'Verbatim depth',
  locationRemarks: 'Location remarks',
  georeferencedBy: 'Georeferenced by',
  georeferencedDate: 'Georeferenced date',
  georeferenceProtocol: 'Georeference protocol',
  georeferenceSources: 'Georeference sources',
  georeferenceRemarks: 'Georeference remarks',

  // Event
  eventDate: 'Date',
  eventTime: 'Time',
  year: 'Year',
  month: 'Month',
  day: 'Day',
  verbatimEventDate: 'Verbatim date',
  habitat: 'Habitat',
  samplingProtocol: 'Sampling protocol',
  samplingEffort: 'Sampling effort',
  fieldNotes: 'Field notes',
  eventRemarks: 'Event remarks',
  fieldNumber: 'Field number',

  // Occurrence
  occurrenceID: 'Occurrence ID',
  catalogNumber: 'Catalog number',
  recordNumber: 'Record number',
  recordedBy: 'Recorded by',
  individualCount: 'Individual count',
  sex: 'Sex',
  lifeStage: 'Life stage',
  reproductiveCondition: 'Reproductive condition',
  behavior: 'Behavior',
  occurrenceRemarks: 'Occurrence remarks',
  occurrenceStatus: 'Occurrence status',
  preparations: 'Preparations',
  disposition: 'Disposition',
  associatedMedia: 'Associated media',
  associatedReferences: 'Associated references',
  associatedTaxa: 'Associated taxa',
  otherCatalogNumbers: 'Other catalog numbers',
  typeStatus: 'Type status',

  // Identification
  identifiedBy: 'Identified by',
  dateIdentified: 'Date identified',
  identificationRemarks: 'Identification remarks',
  identificationQualifier: 'Identification qualifier',
  institutionID: 'Institution ID',

  // Record-level
  modified: 'Last modified',
  language: 'Language',
  license: 'License',
  rightsHolder: 'Rights holder',
  bibliographicCitation: 'Citation',
  references: 'References',
  institutionCode: 'Institution code',
  collectionCode: 'Collection code',
  datasetName: 'Dataset',
  basisOfRecord: 'Basis of record',
  informationWithheld: 'Information withheld'
}

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

function formatDate(value) {
  const date = new Date(value)

  if (isNaN(date.getTime())) return { type: 'text', value }

  return {
    type: 'text',
    value: new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(date)
  }
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

export function getLabel(field) {
  return (
    DWC_LABELS[field] ||
    field.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())
  )
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
