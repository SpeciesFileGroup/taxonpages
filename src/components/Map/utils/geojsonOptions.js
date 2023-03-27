import L, { Icon } from 'leaflet'
import * as Icons from '../icons'
import * as Shape from '../shapes'

const TYPES = [
  'TypeMaterial',
  'CollectionObject',
  'AssertedDistribution',
  'Georeference'
]

function getRelevantType(base) {
  const types = base.map((b) => b.type)

  types.sort((a, b) => TYPES.indexOf(a) - TYPES.indexOf(b))

  return types[0]
}

export default {
  onEachFeature: (feature, layer) => {
    const label = `
    <div class="max-h-32 overflow-y-auto text-xs">
    <ul>
    ${feature.properties.base
      .map(
        (item) =>
          `
          <li 
            class="py-2 last:border-0 truncate border-b"
            title="item.label"
          >
            ${item.label}
          </li>
          `
      )
      .join('')}
      </ul></div>`

    layer.bindPopup(label)
  },

  pointToLayer: (feature, latLng) => {
    const type = getRelevantType(feature.properties.base)

    return L.marker(latLng, { icon: Icons[type] || Icon.Georeference })
  },

  style: (feature) => {
    const type = getRelevantType(feature.properties?.base)

    if (Shape[type]) {
      return Shape[type]
    }
  }
}
