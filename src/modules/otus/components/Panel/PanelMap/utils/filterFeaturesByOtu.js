function makeShapeKey({ properties }) {
  return `${properties.shape?.type}_${properties.shape?.id}`
}

// TODO: Temporary workaround, remove it when the API lets us skip coordinate OTUs
export function filterFeaturesByOtu(features, otuId) {
  const geometries = new Map()

  features.forEach((feature) => {
    const key = makeShapeKey(feature)

    if (feature.geometry && !geometries.has(key)) {
      geometries.set(key, feature.geometry)
    }
  })

  return features
    .filter(
      (feature) => String(feature.properties.target?.id) === String(otuId)
    )
    .map((feature) =>
      feature.geometry
        ? feature
        : {
            ...feature,
            geometry: geometries.get(makeShapeKey(feature)) ?? null
          }
    )
}
