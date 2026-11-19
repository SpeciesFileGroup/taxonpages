import { describe, it, expect } from 'vitest'
import { isAggregateMap } from '@/modules/otus/components/Panel/PanelMap/utils/isAggregateMap.js'

const feature = (...types) => ({
  type: 'Feature',
  properties: { base: types.map((type) => ({ type })) }
})

describe('isAggregateMap', () => {
  it('is true when a feature is the aggregate shape, absences alongside', () => {
    expect(isAggregateMap({ features: [feature('Aggregate'), feature('AssertedDistribution')] })).toBe(true)
  })

  it('is false for species-group maps and for no map at all', () => {
    expect(isAggregateMap({ features: [feature('AssertedDistribution', 'CollectionObject')] })).toBe(false)
    expect(isAggregateMap(null)).toBe(false)
    expect(isAggregateMap([])).toBe(false)
  })
})
