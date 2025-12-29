import * as Icons from '../icons'
import * as Shape from '../shapes'
import { DISABLE_LAYER_OPTIONS } from '../constants'
import {
  TYPE_MATERIAL,
  COLLECTION_OBJECT,
  ASSERTED_ABSENT,
  ASSERTED_DISTRIBUTION,
  GEOREFERENCE,
  AGGREGATE
} from '@/constants/objectTypes.js'

const TYPES = [
  TYPE_MATERIAL,
  COLLECTION_OBJECT,
  ASSERTED_ABSENT,
  ASSERTED_DISTRIBUTION,
  GEOREFERENCE,
  AGGREGATE
]

function getRelevantType(base) {
  const types = base.map((b) => b.type)

  types.sort((a, b) => TYPES.indexOf(a) - TYPES.indexOf(b))

  return types[0]
}

export default ({ L }) => ({
  onEachFeature: (feature, layer) => {
    layer.pm.setOptions(DISABLE_LAYER_OPTIONS)
    layer.pm.disable()
  },

  pointToLayer: (feature, latLng) => {
    const type = getRelevantType(feature.properties.base)
    const markerStyle = Icons[type] || Icons.Georeference
    const marker = L.marker(latLng, {
      icon: L.divIcon(markerStyle)
    })

    marker.pm.setOptions(DISABLE_LAYER_OPTIONS)

    return marker
  },

  style: (feature) => {
    const type = getRelevantType(feature.properties?.base)
    const shapeStyle = Shape[type]

    return shapeStyle
  }
})
