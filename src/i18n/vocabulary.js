/**
 * Labelling the controlled vocabularies that arrive with remote data.
 *
 * TaxonWorks reports things like a taxon rank, a type status, or a Darwin Core
 * term as stable tokens — `order`, `holotype`, `decimalLatitude` — rather than
 * as prose. That is what makes them translatable at all: the token is an
 * identifier, so the catalog decides how it reads. Free text, by contrast — a
 * locality, a verbatim label, a remark — is data, and can only be translated
 * at the source.
 *
 * Every vocabulary needs the same three things: turn the value into a key,
 * translate it if the catalog knows it, and otherwise show something readable
 * rather than a raw key. They differ only in the namespace and in what
 * "readable" means, so they are declared here rather than reimplemented — this
 * file replaced three near-identical copies that had drifted apart, and the
 * point of it is that the fourth vocabulary is one line instead of a fourth
 * copy.
 *
 * Scientific names are never labelled this way. They are not vocabulary, and
 * translating one would be wrong by rule.
 *
 * Free of Node built-ins: imported by build, server and browser code alike.
 */

/** `order` -> `Order`. Leaves the rest of the value alone. */
const capitalizeFirst = (value) => value.charAt(0).toUpperCase() + value.slice(1)

/** `decimalLatitude` -> `Decimal Latitude`. For camelCase term names. */
const splitCamelCase = (value) =>
  value.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())

/**
 * Build the labeller for one vocabulary.
 *
 * @param {object} options
 * @param {string} options.namespace - Catalog namespace, e.g. `dwc.labels`
 * @param {Function} [options.humanize] - Renders a value the catalog does not
 *   cover. Defaults to raising the first letter.
 * @returns {(value: *, i18n: { t: Function, te: Function }) => string}
 */
function createVocabulary({ namespace, humanize = capitalizeFirst }) {
  return (value, { t, te }) => {
    if (typeof value !== 'string' || value.trim() === '') return ''

    // Spaces are not valid in a key path: TaxonWorks reports the root rank as
    // `nomenclatural rank`, which the catalog spells `nomenclatural_rank`.
    const key = `${namespace}.${value.trim().replace(/\s+/g, '_')}`

    return te(key) ? t(key) : humanize(value)
  }
}

/**
 * A taxon rank: `order` -> "Order", "Orden".
 *
 * The English catalog deliberately holds no ranks — the API already sends them
 * in English, so the fallback alone renders them correctly and spelling them
 * out would restate every token. Other locales do define them.
 *
 * Ranks whose meaning depends on the nomenclatural code (`section` and
 * `series` sit in different places for ICZN and ICN) are a single entry; a site
 * governed by the other code redefines them in its own `locales/<locale>.yml`,
 * which already wins over core.
 */
export const rankLabel = createVocabulary({ namespace: 'nomenclature.rank' })

/**
 * A type status: `holotype` -> "Holotype", "Holotipo".
 *
 * Includes the plurals the API reports for a lot holding several specimens.
 */
export const typeStatusLabel = createVocabulary({
  namespace: 'nomenclature.type_status'
})

/**
 * A Darwin Core term name: `decimalLatitude` -> "Latitude", "Latitud".
 *
 * The fallback splits camelCase rather than raising one letter, so a term this
 * version of TaxonPages has never heard of still reads as words.
 */
export const dwcTermLabel = createVocabulary({
  namespace: 'dwc.labels',
  humanize: splitCamelCase
})
