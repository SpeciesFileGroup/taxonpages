export function TypeMaterial(cluster) {
  return {
    html: `<div class="bg-map-type-material"><span>${cluster.getChildCount()}</span></div>`,
    className:
      'leaflet-marker-icon leaflet-zoom-animated leaflet-interactive marker-cluster bg-map-type-material bg-opacity-60 text-white',
    iconSize: [40, 40]
  }
}
