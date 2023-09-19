import * as ClusterType from '../clusters'

export function makeClusterIconFor({ L, cluster }) {
  const items = cluster
    .getAllChildMarkers()
    .map((item) => item.feature.properties.base.map((i) => i.type))
    .flat()

  const types = [...new Set(items)]
  const currentType = types.pop()

  const makeClusterOptions = types.length
    ? ClusterType.Mixed
    : ClusterType[currentType] || ClusterType.CollectionObject

  return L.divIcon(makeClusterOptions(cluster))
}
