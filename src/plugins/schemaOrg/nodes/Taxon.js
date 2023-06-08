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

function makeUrlPath(host, path) {
  const { hash_mode, base_url = '' } = __APP_ENV__
  const fullPath = (base_url + (hash_mode ? '/#' + path : path)).replaceAll(
    '//',
    '/'
  )

  return [host, fullPath].join('')
}

export function taxonResolver(
  {
    id,
    childTaxon,
    parentTaxon,
    taxonRank,
    name,
    scientificName,
    identifier,
    commonNames,
    alternateName
  },
  { host }
) {
  return removeEmptyProperties({
    '@type': 'Taxon',
    '@id': makeUrlPath(host, id),
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
