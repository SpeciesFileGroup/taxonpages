// Pure transforms over the /leads/key/:id payload. No Vue, no network — Node-testable.
//
// `entries` contains ONLY couplet nodes (those with children). `leads` contains every
// lead including couplet roots. A node is a couplet iff it has an entry.

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
