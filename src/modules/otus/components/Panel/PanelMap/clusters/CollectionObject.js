export function CollectionObject(cluster) {
  return {
    html: `<div class="bg-map-collection-object"><span>${cluster.getChildCount()}</span></div>`,
    className:
      'leaflet-marker-icon leaflet-zoom-animated leaflet-interactive bg-map-collection-object bg-opacity-60 marker-cluster text-white',
    iconSize: [40, 40]
  }
}
