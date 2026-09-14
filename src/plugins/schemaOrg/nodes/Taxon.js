import { toLanguageTag } from '@/i18n/languageTags'
import { localePath, stripLocale } from '@/i18n/locale'

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

function makeUrlPath(host, path, locale) {
  return [
    host,
    localePath(stripLocale(path, __APP_ENV__), locale, __APP_ENV__)
  ].join('')
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
  { host, locale }
) {
  return removeEmptyProperties({
    '@type': 'Taxon',
    '@id': makeUrlPath(host, id, locale),
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
  return commonNames.map(({ name, language }) => {
    // JSON-LD requires @language to be a BCP-47 tag. The API reports an ISO
    // 639-2 English name ("Spanish; Castilian") or null, so emitting it raw
    // produced invalid structured data. A language we cannot map is left
    // untagged rather than tagged wrongly — an untagged value is valid.
    const tag = toLanguageTag(language)

    return tag ? { '@language': tag, '@value': name } : { '@value': name }
  })
}
