export function itemsForTaxonName(taxonNameId, items) {
  const id = Number(taxonNameId)

  return items.filter((item) => item.protonym_ids?.includes(id))
}

export function sourcesCitedBy(items, sources) {
  const ids = new Set(items.map((item) => item.source_id).filter(Boolean))

  return sources.filter((source) => ids.has(source.id))
}
