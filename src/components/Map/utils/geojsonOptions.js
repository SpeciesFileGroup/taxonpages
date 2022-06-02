import { generateHue } from "@/utils/color"
import { squareMarker } from "../markers"
import L from 'leaflet'

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

  pointToLayer: (_, latLng) => {
    return L.marker(latLng, { icon: squareMarker })
  },

  style: (feature) => {
    if (feature.properties?.base?.type === 'AssertedDistribution') {
      return { 
        color: generateHue(5),
        weight: 1,
        dashArray: '3',
        dashOffset: '3',
        fillOpacity: 0.5
      }
    }
  }
})
