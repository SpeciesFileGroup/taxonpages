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
  identifier,
  commonNames,
  alternateName
}) {
  return removeEmptyProperties({
    '@type': 'Taxon',
    '@id': makeUrlPath(id),
    'http://purl.org/dc/terms/conformsTo': {
      '@id': 'https://bioschemas.org/profiles/Taxon/1.0-RELEASE'
    },
    additionalType: [
      'dwc:Taxon',
      'http://rs.tdwg.org/ontology/voc/TaxonConcept#TaxonConcept'
    ],
    'dwc:vernacularName': defineCommonNames(commonNames),
    name,
    alternateName: alternateName.map((item) => item.replaceAll(/<\/?i>/g, '')),
    childTaxon,
    scientificName: defineTaxonName(scientificName),
    identifier,
    taxonRank,
    parentTaxon: defineTaxonEntity(parentTaxon)
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

function defineTaxonEntity({ name, taxonRank }) {
  return {
    '@type': 'Taxon',
    name,
    taxonRank
  }
}

function defineCommonNames(commonNames) {
  return commonNames.map(({ name, language }) => ({
    '@language': language,
    '@value': name
  }))
}
