import { describe, it, expect } from 'vitest'
import { filterFeaturesByOtu } from '@/modules/otus/components/Panel/PanelMap/utils/filterFeaturesByOtu.js'

const point = { type: 'Point', coordinates: [1, 2] }
const polygon = {
  type: 'Polygon',
  coordinates: [
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 0]
    ]
  ]
}

function makeFeature({ otuId, shapeId, geometry = null, baseId }) {
  return {
    type: 'Feature',
    geometry,
    properties: {
      base: { type: 'AssertedDistribution', id: baseId },
      shape: { type: 'GeographicArea', id: shapeId },
      target: { type: 'Otu', id: otuId }
    }
  }
}

describe('filterFeaturesByOtu', () => {
  it('keeps only features targeting the given OTU', () => {
    const features = [
      makeFeature({ otuId: 1, shapeId: 10, geometry: point, baseId: 100 }),
      makeFeature({ otuId: 2, shapeId: 20, geometry: polygon, baseId: 200 })
    ]

    const result = filterFeaturesByOtu(features, 1)

    expect(result.map((f) => f.properties.base.id)).toEqual([100])
  })

  it('restores a geometry sent only with another OTU feature', () => {
    const features = [
      makeFeature({ otuId: 2, shapeId: 10, geometry: polygon, baseId: 200 }),
      makeFeature({ otuId: 1, shapeId: 10, baseId: 100 })
    ]

    const [feature] = filterFeaturesByOtu(features, 1)

    expect(feature.properties.base.id).toBe(100)
    expect(feature.geometry).toEqual(polygon)
  })

  it('keeps the geometry of features that already have one', () => {
    const features = [
      makeFeature({ otuId: 2, shapeId: 10, geometry: polygon, baseId: 200 }),
      makeFeature({ otuId: 1, shapeId: 30, geometry: point, baseId: 100 })
    ]

    const [feature] = filterFeaturesByOtu(features, 1)

    expect(feature.geometry).toEqual(point)
  })

  it('matches OTU ids given as strings', () => {
    const features = [
      makeFeature({ otuId: 1, shapeId: 10, geometry: point, baseId: 100 })
    ]

    expect(filterFeaturesByOtu(features, '1')).toHaveLength(1)
  })

  it('does not mutate the original features', () => {
    const features = [
      makeFeature({ otuId: 2, shapeId: 10, geometry: polygon, baseId: 200 }),
      makeFeature({ otuId: 1, shapeId: 10, baseId: 100 })
    ]

    filterFeaturesByOtu(features, 1)

    expect(features[1].geometry).toBeNull()
  })
})
