import * as ClusterType from '../clusters'

export function makeClusterIconFor({ L, cluster }) {
  const items = cluster
    .getAllChildMarkers()
    .map((item) => item.feature.properties.base.map((i) => i.type))
    .flat()

  return L.divIcon(ClusterType.Mixed(cluster))
}
