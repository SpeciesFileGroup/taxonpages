import * as Icons from '../icons'
import * as Shape from '../shapes'

const TYPES = [
  'TypeMaterial',
  'CollectionObject',
  'AssertedDistribution',
  'Georeference',
  'Aggregate'
]

const DEFAULT_OPTIONS = {
  allowEditing: false,
  allowRemoval: false,
  allowCutting: false,
  allowRotation: false,
  draggable: false
}

function getRelevantType(base) {
  const types = base.map((b) => b.type)

  types.sort((a, b) => TYPES.indexOf(a) - TYPES.indexOf(b))

  return types[0]
}

export default (L) => ({
  onEachFeature: (feature, layer) => {
    const labels = (feature.properties.base || [])
      .map((item) => item.label)
      .filter(Boolean)

    if (!labels.length) {
      return
    }

    const label = `
      <div class="max-h-32 overflow-y-auto text-xs">
        <ul>
        ${labels
          .map(
            (label) =>
              `
              <li 
                class="py-2 last:border-0 truncate border-b"
                title="${label}"
              >
                ${label}
              </li>
              `
          )
          .join('')}
        </ul>
      </div>`

    layer.pm.setOptions(DEFAULT_OPTIONS)
    layer.pm.disable()

    layer.bindPopup(label)
  },

  pointToLayer: (feature, latLng) => {
    const type = getRelevantType(feature.properties.base)
    const markerStyle = Icons[type] || Icons.Georeference
    const marker = L.marker(latLng, {
      icon: L.divIcon(markerStyle)
    })

    marker.pm.setOptions(DEFAULT_OPTIONS)

    return marker
  },

  style: (feature) => {
    const type = getRelevantType(feature.properties?.base)

    if (Shape[type]) {
      return Shape[type]
    }
  }
})
