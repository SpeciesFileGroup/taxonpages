const { schema_host } = __APP_ENV__

const TAXON_RANK = {
  species: [
    'http://rs.tdwg.org/ontology/voc/TaxonRank#Species',
    'http://www.wikidata.org/entity/Q7432'
  ],
  genus: [
    'genus',
    'http://rs.tdwg.org/ontology/voc/TaxonRank#Genus',
    'http://www.wikidata.org/entity/Q34740'
  ]
}

function removeEmptyProperties(obj) {
  const copyObj = { ...obj }

  for (const key in obj) {
    const value = obj[key]

    if (!value || (Array.isArray(value) && !value.length)) {
      delete copyObj[key]
    }
  }

  return copyObj
}

function makeUrlPath(path) {
  return schema_host ? `${schema_host}${path}` : ''
}

export function defineTaxon({
  id,
  childTaxon,
  parentTaxon,
  taxonRank,
  name,
  scientificName,
  identifier
}) {
  return removeEmptyProperties({
    '@type': 'Taxon',
    '@id': makeUrlPath(id),
    'dct:conformsTo': {
      '@id': 'https://bioschemas.org/profiles/Taxon/0.8-DRAFT'
    },
    additionalType: [
      'dwc:Taxon',
      'http://rs.tdwg.org/ontology/voc/TaxonConcept#TaxonConcept'
    ],
    name,
    childTaxon,
    parentTaxon,
    scientificName: defineTaxonName(scientificName),
    identifier,
    taxonRank
  })
}

function defineTaxonName({ name, author, taxonRank }) {
  return removeEmptyProperties({
    '@type': 'TaxonName',
    author,
    name,
    taxonRank
  })
}
