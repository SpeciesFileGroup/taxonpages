// Pure transforms over the /leads/key/:id payload. No Vue, no network — Node-testable.
//
// `entries` contains ONLY couplet nodes (those with children). `leads` contains every
// lead including couplet roots. A node is a couplet iff it has an entry.
//
// `couplet_number` is whatever TaxonWorks holds: an auto integer for most nodes, or a
// curator free-text override ("5a", "II 1", "A"). These can collide — e.g. key/3605's
// root/title lead is auto-numbered 1 while series I's first real couplet is labelled "1"
// — so the same number can appear on two couplets. That is intentional: the module mirrors
// the key exactly as entered in TaxonWorks. Do NOT de-duplicate or renumber.
// (Investigated 2026-08-30; ruled "not a bug" by the curator.)

function toNode(id, lead, entry) {
  return {
    id: Number(id),
    text: lead.text ?? '',
    parentId: lead.parent_id ?? null,
    position: lead.position ?? null,
    targetType: lead.target_type ?? 'internal',
    targetLabel: lead.target_label ?? '',
    targetId: lead.target_id ?? null,
    targetLink: lead.target_link ?? null,
    figures: Array.isArray(lead.figures) ? lead.figures : [],
    children: entry?.children ? entry.children.map(Number) : [],
    coupletNumber: entry?.couplet_number ?? null,
    depth: entry?.depth ?? null,
    isCouplet: !!(entry && entry.children && entry.children.length)
  }
}

export function buildNodes(entries, leads) {
  const nodes = {}
  for (const [id, lead] of Object.entries(leads)) {
    nodes[id] = toNode(id, lead, entries[id])
  }
  return nodes
}

export function rootId(nodes) {
  const root = Object.values(nodes).find((n) => n.parentId === null)
  return root ? root.id : Number(Object.keys(nodes)[0])
}

const byPosition = (a, b) => (a.position ?? 0) - (b.position ?? 0)

export function childChoices(coupletId, nodes) {
  const node = nodes[coupletId]
  if (!node) return []
  return node.children
    .map((cid) => nodes[cid])
    .filter(Boolean)
    .sort(byPosition)
}

export function orderedCouplets(nodes) {
  const out = []
  const walk = (id) => {
    const node = nodes[id]
    if (!node || !node.isCouplet) return
    out.push(node)
    childChoices(id, nodes).forEach((child) => walk(child.id))
  }
  walk(rootId(nodes))
  return out
}

// Every terminal (non-couplet) lead across the whole key that points at an OTU,
// deduped by OTU id (first occurrence wins the label). Returns [{ id, label }].
// Unlike descendantOtus this is not rooted at a node — it scans the entire tree.
export function terminalOtus(nodes) {
  const found = new Map()
  for (const n of Object.values(nodes || {})) {
    if (n.isCouplet || n.targetType !== '/api/v1/otus' || n.targetId == null) continue
    if (!found.has(n.targetId)) {
      found.set(n.targetId, { id: n.targetId, label: String(n.targetLabel || '') })
    }
  }
  return [...found.values()]
}

// chains: an array of ancestor-id arrays, each ordered ROOT -> LEAF.
// Returns the deepest (closest-to-leaf) id present in EVERY chain, or null when
// there is no common id / no usable input. Empty/non-array chains are ignored.
export function lowestCommonAncestor(chains) {
  const valid = (Array.isArray(chains) ? chains : []).filter(
    (c) => Array.isArray(c) && c.length
  )
  if (!valid.length) return null
  const [first, ...rest] = valid
  let lca = null
  for (const id of first) {
    if (rest.every((c) => c.includes(id))) lca = id
  }
  return lca
}

export function descendantOtus(nodeId, nodes) {
  const found = new Map()
  const walk = (id) => {
    const node = nodes[id]
    if (!node) return
    if (!node.isCouplet && node.targetType === '/api/v1/otus' && node.targetId != null) {
      found.set(node.targetId, { id: node.targetId, label: String(node.targetLabel) })
    }
    node.children.forEach(walk)
  }
  walk(nodeId)
  return [...found.values()].sort((a, b) => a.label.localeCompare(b.label))
}

export function breadcrumb(nodeId, nodes) {
  const path = []
  let cursor = nodes[nodeId]
  while (cursor) {
    if (cursor.isCouplet) path.unshift(cursor)
    cursor = cursor.parentId == null ? null : nodes[cursor.parentId]
  }
  return path
}

// Resolve a :couplet route param (a couplet number, possibly a curator string like "A")
// to its node. String-safe. Nullish or unmatched -> null (caller falls back to the root).
export function coupletByNumber(value, nodes) {
  if (value == null || value === '') return null
  const wanted = String(value)
  return (
    Object.values(nodes).find(
      (n) => n.isCouplet && String(n.coupletNumber) === wanted
    ) || null
  )
}
