// Pure. Given the key's terminal taxa (with ranks) and the valid descendants of the
// key's scope taxon (with ranks), decide the rank the key operates at and whether every
// taxon of that rank in scope is keyed out. No Vue, no network — Node-testable.

// Coarse -> fine. Anything not listed is "unknown" and ignored by finestRank.
export const RANK_ORDER = [
  'kingdom', 'subkingdom', 'phylum', 'subphylum', 'superclass', 'class', 'subclass',
  'infraclass', 'superorder', 'order', 'suborder', 'infraorder', 'superfamily',
  'family', 'subfamily', 'tribe', 'subtribe', 'genus', 'subgenus', 'section',
  'subsection', 'series', 'subseries', 'species group', 'species', 'subspecies',
  'variety', 'subvariety', 'form', 'subform'
]

// Position of a raw rank string in RANK_ORDER (coarse 0 -> fine). -1 if unknown.
// Accepts 'genus', 'Genus', 'NomenclaturalRank::Iczn::GenusGroup::Genus', etc.
export function rankIndex(rank) {
  return RANK_ORDER.indexOf(normRank(rank))
}

export function normRank(rank) {
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

// The rank a key predominantly operates at: the most frequent rank among the
// given list, ties broken toward the finer rank. Unknown ranks ignored; null if
// none usable. Used for the completeness target rank instead of finestRank so a
// family-level key that resolves one or two branches down to subfamily is still
// measured against families, not against every subfamily in scope.
export function modalRank(ranks) {
  const countByIdx = new Map()
  for (const raw of ranks || []) {
    const idx = RANK_ORDER.indexOf(normRank(raw))
    if (idx < 0) continue
    countByIdx.set(idx, (countByIdx.get(idx) || 0) + 1)
  }
  let bestIdx = -1
  let bestCount = 0
  for (const [idx, count] of countByIdx) {
    if (count > bestCount || (count === bestCount && idx > bestIdx)) {
      bestCount = count
      bestIdx = idx
    }
  }
  return bestIdx === -1 ? null : RANK_ORDER[bestIdx]
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

// Richer report for the header modal: keeps the chip's first six fields unchanged
// and adds `groups` (one per grouping-rank taxon — the rank between
// scope and target — each with its target-rank `members` marked included/missing and their
// `synonyms`) and `ungrouped` (target taxa parented directly by the scope). Pure.
export function buildCompletenessReport({
  scopeRank, descendants, terminalTnIds, tnIdToOtuId = {}, outOfScopeTerminals = []
}) {
  const descs = Array.isArray(descendants) ? descendants : []
  const termSet = new Set((terminalTnIds || []).filter((x) => x != null))
  const byId = new Map(descs.map((d) => [d.id, d]))

  const valid = descs.filter((d) => d.valid)
  // Rank the key operates at = the most common rank among in-scope valid descendants
  // that are actually keyed out (modalRank, not finestRank: a family key that drills
  // one or two branches down to subfamily must still be measured against families).
  // Restricted to keyed-out descendants — no fallback to "any rank in scope", which
  // fabricated a target rank with zero coverage (spurious "0 / N") when no terminal
  // matched (F7).
  const targetRank = modalRank(
    valid.filter((d) => termSet.has(d.id)).map((d) => d.rank)
  )
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

  const childrenByParentId = new Map()
  for (const d of descs) {
    if (d.parentId == null) continue
    if (!childrenByParentId.has(d.parentId)) childrenByParentId.set(d.parentId, [])
    childrenByParentId.get(d.parentId).push(d)
  }

  const keysOutDirectly = (d) =>
    termSet.has(d.id) || (synsByValidId.get(d.id) || []).some((s) => termSet.has(s.id))

  const targetTaxa = valid.filter((d) => norm(d.rank) === targetRank)
  // A target taxon counts as covered when the key names it, names a synonym of it,
  // OR resolves deeper into it — some descendant present in the fetched set is a
  // keyed terminal. Without the last clause, a family-level key that drills one
  // branch down to subfamily/tribe would mark that whole branch "missing" (the
  // modalRank target is the family, but only the sub-taxa are terminals).
  const isIncluded = (d) => {
    if (keysOutDirectly(d)) return true
    const stack = [...(childrenByParentId.get(d.id) || [])]
    const seen = new Set()
    while (stack.length) {
      const c = stack.pop()
      if (seen.has(c.id)) continue
      seen.add(c.id)
      if (keysOutDirectly(c)) return true
      for (const gc of childrenByParentId.get(c.id) || []) stack.push(gc)
    }
    return false
  }

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
