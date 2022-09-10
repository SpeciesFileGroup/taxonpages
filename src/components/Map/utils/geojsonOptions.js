import L, { Icon } from 'leaflet'
import * as Icons from '../icons'
import * as Shape from '../shapes'

export default ({
  onEachFeature: (feature, layer) => {
    if (!feature.properties?.base?.label) return
    layer.bindTooltip(
      `<div>${feature.properties.base.label}</div>`,
      { 
        permanent: false,
        sticky: true
      }
    )
  },

  pointToLayer: (feature, latLng) => {
    const type = feature.properties?.base.type
  
    return L.marker(latLng, { icon: Icons[type] || Icon.Georeference })
  },

  style: (feature) => {
    const type = feature.properties?.base.type
  
    if (Shape[type]) {
      return Shape[type]
    }
  }
})
