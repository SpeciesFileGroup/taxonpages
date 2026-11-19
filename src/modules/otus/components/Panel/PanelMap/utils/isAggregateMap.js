import { AGGREGATE } from '@/constants/objectTypes'

export function isAggregateMap(geojson) {
  return !!geojson?.features?.some((feature) =>
    feature.properties?.base?.some((item) => item.type === AGGREGATE)
  )
}
