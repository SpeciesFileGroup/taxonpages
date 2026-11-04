export function itemsForTaxonName(taxonNameId, items, { hasRank = true } = {}) {
  const id = Number(taxonNameId)

  return hasRank
    ? items.filter((item) => item.protonym_ids?.includes(id))
    : items.filter((item) => item.taxon_name_id === id)
}

export function sourcesCitedBy(items, sources) {
  const ids = new Set(items.map((item) => item.source_id).filter(Boolean))

  return sources.filter((source) => ids.has(source.id))
}
