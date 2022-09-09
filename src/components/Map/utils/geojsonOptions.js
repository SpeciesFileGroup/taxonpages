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
    console.log(feature.properties?.base?.type)
    if (feature.properties?.base?.type === 'AssertedDistribution') {
      return { 
        color: 'rgb(var(--color-map-asserted))',
        weight: 1,
        dashArray: '3',
        dashOffset: '3',
        fillOpacity: 0.5
      }
    }

    if (feature.properties?.base?.type === 'TypeMaterial') {
      return { 
        color: 'rgb(var(--color-map-type-material))',
        weight: 1,
        fillOpacity: 0.5
      }
    }

    if (feature.properties?.base?.type === 'CollectionObject') {
      return { 
        color: 'rgb(var(--color-map-collection-object))',
        weight: 1,
        fillOpacity: 0.5
      }
    }
  }
})
