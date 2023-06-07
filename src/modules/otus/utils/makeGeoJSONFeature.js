export function makeGeoJSONFeature(geometry, type) {
  return {
    type: 'Feature',
    geometry,
    properties: {
      base: [
        {
          type
        }
      ]
    }
  }
}
