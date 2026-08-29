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

function taxRef(d, tnIdToOtuId) {
  return {
    id: d.id,
    otuId: tnIdToOtuId[d.id] ?? null,
    name: String(d.name || ''),
    authorYear: d.authorYear || ''
  }
}
const authored = (d) => [String(d.name || ''), d.authorYear].filter(Boolean).join(' ')

// Richer report for the header modal: keeps assessCompleteness's first six fields (so the
// chip is unchanged) and adds `groups` (one per grouping-rank taxon — the rank between
// scope and target — each with its target-rank `members` marked included/missing and their
// `synonyms`) and `ungrouped` (target taxa parented directly by the scope). Pure.
export function buildCompletenessReport({
  scopeRank, descendants, terminalTnIds, tnIdToOtuId = {}, outOfScopeTerminals = []
}) {
  const descs = Array.isArray(descendants) ? descendants : []
  const termSet = new Set((terminalTnIds || []).filter((x) => x != null))
  const byId = new Map(descs.map((d) => [d.id, d]))

  const valid = descs.filter((d) => d.valid)
  const targetRank = finestRank(
    valid.filter((d) => termSet.has(d.id)).map((d) => d.rank)
  ) || finestRank(valid.map((d) => d.rank))
  if (!targetRank) return null

  const norm = (r) => normRank(r)
  const scope = norm(scopeRank)

  const synsByValidId = new Map()
  for (const d of descs) {
    if (!d.valid && d.validId != null) {
      if (!synsByValidId.has(d.validId)) synsByValidId.set(d.validId, [])
      synsByValidId.get(d.validId).push(taxRef(d, tnIdToOtuId))
    }
  }

  const targetTaxa = valid.filter((d) => norm(d.rank) === targetRank)
  const isIncluded = (d) =>
    termSet.has(d.id) || (synsByValidId.get(d.id) || []).some((s) => termSet.has(s.id))

  const mkMember = (d) => ({
    taxon: taxRef(d, tnIdToOtuId),
    status: isIncluded(d) ? 'included' : 'missing',
    synonyms: (synsByValidId.get(d.id) || []).slice().sort((a, b) => a.name.localeCompare(b.name))
  })

  // grouping rank = parent rank of target taxa when that parent is finer than scope
  const groupMap = new Map() // parentId -> { taxon, members }
  const ungrouped = []
  for (const d of targetTaxa) {
    const parent = d.parentId != null ? byId.get(d.parentId) : null
    if (parent && norm(parent.rank) !== scope) {
      if (!groupMap.has(parent.id)) groupMap.set(parent.id, { taxon: taxRef(parent, tnIdToOtuId), members: [] })
      groupMap.get(parent.id).members.push(mkMember(d))
    } else {
      ungrouped.push(mkMember(d))
    }
  }
  const bySortName = (a, b) =>
    String(a.taxon.name || '').localeCompare(String(b.taxon.name || ''))
  const groups = [...groupMap.values()]
    .map((g) => ({ ...g, members: g.members.sort(bySortName) }))
    .sort(bySortName)
  ungrouped.sort(bySortName)

  const covered = targetTaxa.filter(isIncluded)
  const missing = targetTaxa.filter((d) => !isIncluded(d)).map(authored)
    .sort((a, b) => a.localeCompare(b))
  const outOfScope = (outOfScopeTerminals || [])
    .map((t) => ({ id: null, otuId: t.otuId ?? null, name: String(t.label || ''), authorYear: '' }))
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))

  return {
    targetRank,
    expectedCount: targetTaxa.length,
    coveredCount: covered.length,
    missing,
    outOfScope,
    isComplete: missing.length === 0 && outOfScope.length === 0,
    groups,
    ungrouped
  }
}
