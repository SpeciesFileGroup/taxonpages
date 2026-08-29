// Pure. Given the key's terminal taxa (with ranks) and the valid descendants of the
// key's scope taxon (with ranks), decide the rank the key operates at and whether every
// taxon of that rank in scope is keyed out. No Vue, no network — Node-testable.

// Coarse -> fine. Anything not listed is "unknown" and ignored by finestRank.
const RANK_ORDER = [
  'kingdom', 'subkingdom', 'phylum', 'subphylum', 'superclass', 'class', 'subclass',
  'infraclass', 'superorder', 'order', 'suborder', 'infraorder', 'superfamily',
  'family', 'subfamily', 'tribe', 'subtribe', 'genus', 'subgenus', 'section',
  'subsection', 'series', 'subseries', 'species group', 'species', 'subspecies',
  'variety', 'subvariety', 'form', 'subform'
]

function normRank(rank) {
  if (!rank) return ''
  let r = String(rank)
  if (r.includes('::')) r = r.split('::').pop()
  if (r.includes('/')) r = r.split('/').pop()
  // "SpeciesGroup::Species" style already handled; camelCase leaf -> spaced words
  r = r.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().trim()
  return r
}

export function finestRank(ranks) {
  let best = -1
  for (const raw of ranks || []) {
    const idx = RANK_ORDER.indexOf(normRank(raw))
    if (idx > best) best = idx
  }
  return best === -1 ? null : RANK_ORDER[best]
}

export function assessCompleteness({ terminals, descendants }) {
  const terms = Array.isArray(terminals) ? terminals : []
  const descs = Array.isArray(descendants) ? descendants : []

  const targetRank = finestRank(terms.map((t) => t.rank))
  if (!targetRank) return null

  const termIds = new Set(terms.map((t) => t.taxonNameId).filter((x) => x != null))
  const descIds = new Set(descs.map((d) => d.taxonNameId).filter((x) => x != null))

  const expected = descs.filter((d) => d.valid && normRank(d.rank) === targetRank)
  const covered = expected.filter((d) => termIds.has(d.taxonNameId))
  const coveredIds = new Set(covered.map((d) => d.taxonNameId))

  const missing = expected
    .filter((d) => !coveredIds.has(d.taxonNameId))
    .map((d) => d.name)
    .sort((a, b) => String(a).localeCompare(String(b)))

  const outOfScope = terms
    .filter((t) => normRank(t.rank) === targetRank && !descIds.has(t.taxonNameId))
    .map((t) => t.label)
    .sort((a, b) => String(a).localeCompare(String(b)))

  return {
    targetRank,
    expectedCount: expected.length,
    coveredCount: covered.length,
    covered: covered.map((d) => d.name),
    missing,
    outOfScope,
    isComplete: missing.length === 0 && outOfScope.length === 0
  }
}
