import { describe, it, expect } from 'vitest'
import {
  itemsForTaxonName,
  sourcesCitedBy
} from '@/modules/otus/utils/catalogFilters.js'

const timeline = [
  { label: 'A', protonym_ids: [10], source_id: 1 },
  { label: 'B', protonym_ids: [11, 10], source_id: 2 },
  { label: 'C', protonym_ids: [12], source_id: 3 },
  { label: 'D', protonym_ids: [12, 11], source_id: null },
  { label: 'E', protonym_ids: [10], source_id: null }
]

const sources = [
  { id: 1, cached: 'Source 1' },
  { id: 2, cached: 'Source 2' },
  { id: 3, cached: 'Source 3' },
  { id: 4, cached: 'Source 4' }
]

describe('itemsForTaxonName', () => {
  it('keeps only the items that cite the taxon name', () => {
    expect(itemsForTaxonName(10, timeline).map((i) => i.label)).toEqual([
      'A',
      'B',
      'E'
    ])
  })

  it('accepts the id as a string, as it comes from route params', () => {
    expect(itemsForTaxonName('12', timeline).map((i) => i.label)).toEqual([
      'C',
      'D'
    ])
  })

  it('drops items without protonym ids', () => {
    expect(itemsForTaxonName(10, [{ label: 'X' }])).toEqual([])
  })
})

describe('sourcesCitedBy', () => {
  it('keeps the sources cited by the items, in source order', () => {
    const items = itemsForTaxonName(10, timeline)

    expect(sourcesCitedBy(items, sources).map((s) => s.id)).toEqual([1, 2])
  })

  it('returns nothing when no item cites a source', () => {
    expect(sourcesCitedBy([timeline[3]], sources)).toEqual([])
  })
})
