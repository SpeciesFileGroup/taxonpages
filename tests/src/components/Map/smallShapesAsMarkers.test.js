// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'
import L from 'leaflet'
import { createSmallShapeMarkers } from '@/components/Map/utils/smallShapesAsMarkers.js'

// The plugin extends the global L, as it does in the app.
beforeAll(async () => {
  globalThis.L = L
  await import('leaflet.markercluster')
})

// A 1x1 degree square near the equator is ~0.71px wide at zoom 0, so against
// an 8px icon it is collapsed up to zoom 3 and drawn as a shape from zoom 4.
const SQUARE = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1]
]

function makeFeature(type = 'AssertedDistribution') {
  return { type: 'Feature', properties: { base: [{ type }] } }
}

const makeMarker = (feature, latLng) =>
  L.marker(latLng, { icon: L.divIcon({ iconSize: [8, 8] }) })

let container
let map

function setup({ group = L.featureGroup(), zoom = 2, center = [0, 0] } = {}) {
  map = L.map(container, { center, zoom, maxZoom: 18 })
  group.addTo(map)

  const smallShapeMarkers = createSmallShapeMarkers({ L, map, makeMarker })

  return { group, smallShapeMarkers }
}

function addPolygon(group, { latLngs = SQUARE, feature = makeFeature() } = {}) {
  const polygon = L.polygon(latLngs)

  polygon.feature = feature
  group.addLayer(polygon)

  return polygon
}

const markerOf = (group, polygon) =>
  group.getLayers().find((layer) => layer instanceof L.Marker && layer.feature === polygon.feature)

const markersIn = (layer) => layer.getLayers()

const isHidden = (polygon) =>
  polygon.getElement().classList.contains('map-shape-replaced')

beforeEach(() => {
  container = document.createElement('div')
  // happy-dom lays nothing out; Leaflet reads the map size from these.
  Object.defineProperty(container, 'clientWidth', { value: 1024 })
  Object.defineProperty(container, 'clientHeight', { value: 768 })
  document.body.appendChild(container)
})

afterEach(() => {
  map.remove()
  container.remove()
})

describe('createSmallShapeMarkers', () => {
  it('swaps a shape smaller than its marker for the marker, and back on zoom in', () => {
    const { group, smallShapeMarkers } = setup({ zoom: 2 })
    const polygon = addPolygon(group)

    smallShapeMarkers.register(polygon)
    smallShapeMarkers.sync()

    expect(markerOf(smallShapeMarkers.markersLayer, polygon)).toBeDefined()
    expect(markerOf(smallShapeMarkers.markersLayer, polygon).getLatLng()).toEqual(polygon.getBounds().getCenter())
    expect(isHidden(polygon)).toBe(true)

    map.setZoom(4, { animate: false })

    expect(markerOf(smallShapeMarkers.markersLayer, polygon)).toBeUndefined()
    expect(isHidden(polygon)).toBe(false)

    map.setZoom(3, { animate: false })

    expect(markerOf(smallShapeMarkers.markersLayer, polygon)).toBeDefined()
  })

  it('does not add the marker twice when synced repeatedly', () => {
    const { group, smallShapeMarkers } = setup()
    const polygon = addPolygon(group)

    smallShapeMarkers.register(polygon)
    smallShapeMarkers.register(polygon)
    smallShapeMarkers.sync()
    smallShapeMarkers.sync()

    expect(smallShapeMarkers.markersLayer.getLayers()).toHaveLength(1)
  })

  it('keeps a zero-sized shape collapsed at every zoom', () => {
    const { group, smallShapeMarkers } = setup({ zoom: 18, center: [1, 1] })
    const polygon = addPolygon(group, { latLngs: [[1, 1], [1, 1], [1, 1]] })

    smallShapeMarkers.register(polygon)
    smallShapeMarkers.sync()

    expect(markerOf(smallShapeMarkers.markersLayer, polygon)).toBeDefined()
  })

  it('forwards marker events to the shape, so its popup and listeners still work', () => {
    const { group, smallShapeMarkers } = setup()
    const polygon = addPolygon(group)
    const onClick = vi.fn()

    polygon.on('click', onClick)
    smallShapeMarkers.register(polygon)
    smallShapeMarkers.sync()
    markerOf(smallShapeMarkers.markersLayer, polygon).fire('click', { latlng: L.latLng(0.5, 0.5) })

    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onClick.mock.calls[0][0].target).toBe(polygon)
  })

  it('registers the shapes of a GeoJSON layer, giving GeometryCollection parts their feature', () => {
    const { group, smallShapeMarkers } = setup()
    const polygon = { type: 'Polygon', coordinates: [SQUARE.map(([lat, lng]) => [lng, lat])] }
    const geojsonLayer = L.geoJSON({
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', geometry: polygon, properties: { base: [] } },
        {
          type: 'Feature',
          geometry: { type: 'GeometryCollection', geometries: [polygon] },
          properties: { base: [] }
        },
        { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: { base: [] } }
      ]
    }).addTo(group)

    smallShapeMarkers.register(geojsonLayer)
    smallShapeMarkers.sync()

    const [, collection] = geojsonLayer.getLayers()
    const markers = smallShapeMarkers.markersLayer.getLayers()

    expect(markers).toHaveLength(2)
    expect(markers.map((marker) => marker.feature)).toContain(collection.feature)
  })

  it('re-hides a collapsed shape when it is added back to the map', () => {
    const { group, smallShapeMarkers } = setup()
    const polygon = addPolygon(group)

    smallShapeMarkers.register(polygon)
    smallShapeMarkers.sync()
    group.removeLayer(polygon)
    group.addLayer(polygon)

    expect(isHidden(polygon)).toBe(true)
  })

  it('clear removes the markers, restores the shapes and stops tracking them', () => {
    const { group, smallShapeMarkers } = setup()
    const polygon = addPolygon(group)

    smallShapeMarkers.register(polygon)
    smallShapeMarkers.sync()
    smallShapeMarkers.clear()

    expect(markerOf(smallShapeMarkers.markersLayer, polygon)).toBeUndefined()
    expect(isHidden(polygon)).toBe(false)

    map.setZoom(1, { animate: false })

    expect(markerOf(smallShapeMarkers.markersLayer, polygon)).toBeUndefined()
  })

  it('destroy stops listening to zoom changes', () => {
    const { group, smallShapeMarkers } = setup({ zoom: 4 })
    const polygon = addPolygon(group)

    smallShapeMarkers.register(polygon)
    smallShapeMarkers.destroy()
    smallShapeMarkers.register(polygon)
    map.setZoom(1, { animate: false })

    expect(markerOf(smallShapeMarkers.markersLayer, polygon)).toBeUndefined()
  })

  describe('multipart shapes', () => {
    // A 0.1° square: ~0.57px at zoom 3, ~4.6px at zoom 6, ~9px at zoom 7.
    const islet = (lat, lng, d = 0.1) => [[
      [lat, lng],
      [lat + d, lng],
      [lat + d, lng + d],
      [lat, lng + d]
    ]]

    it('gives each island of a MultiPolygon its own marker, even if the whole is large', () => {
      const { group, smallShapeMarkers } = setup({ zoom: 3 })
      // Spread over 30°: ~170px wide at zoom 3, yet each island is under 1px.
      const polygon = addPolygon(group, {
        latLngs: [islet(-8, -14), islet(-16, -6), islet(-37, -12), islet(-40, -10)]
      })

      smallShapeMarkers.register(polygon)
      smallShapeMarkers.sync()

      expect(markersIn(smallShapeMarkers.markersLayer)).toHaveLength(4)
      expect(isHidden(polygon)).toBe(true)

      map.setView([-8, -14], 7, { animate: false })

      expect(markersIn(smallShapeMarkers.markersLayer)).toHaveLength(0)
      expect(isHidden(polygon)).toBe(false)
    })

    it('leaves out islands next to a visible part, but not distant ones', () => {
      const { group, smallShapeMarkers } = setup({ zoom: 3 })
      const mainland = [[[0, 0], [20, 0], [20, 20], [0, 20]]]
      const polygon = addPolygon(group, {
        latLngs: [mainland, islet(10, 20.5), islet(10, 60)]
      })

      smallShapeMarkers.register(polygon)
      smallShapeMarkers.sync()

      const markers = markersIn(smallShapeMarkers.markersLayer)

      expect(markers).toHaveLength(1)
      expect(markers[0].getLatLng().lng).toBeCloseTo(60.05)
      expect(isHidden(polygon)).toBe(false)
    })

    it('only looks at parts around the view, and picks up the rest after a pan', () => {
      const { group, smallShapeMarkers } = setup({ zoom: 6 })
      // 1024px at zoom 6 is ~22°, so the view padded by half spans ~±22°.
      const polygon = addPolygon(group, { latLngs: [islet(0, 0), islet(0, 100)] })

      smallShapeMarkers.register(polygon)
      smallShapeMarkers.sync()

      expect(markersIn(smallShapeMarkers.markersLayer).map((m) => Math.round(m.getLatLng().lng))).toEqual([0])

      map.panTo([0, 100], { animate: false })

      expect(markersIn(smallShapeMarkers.markersLayer).map((m) => Math.round(m.getLatLng().lng))).toEqual([100])
    })

    it('gives a group of nearby islets a single marker', () => {
      const { group, smallShapeMarkers } = setup({ zoom: 3 })
      const polygon = addPolygon(group, {
        latLngs: [islet(5, 5), islet(5.3, 5.2), islet(5.1, 5.5), islet(30, 30)]
      })

      smallShapeMarkers.register(polygon)
      smallShapeMarkers.sync()

      expect(markersIn(smallShapeMarkers.markersLayer)).toHaveLength(2)

      // Far enough apart to get a marker each, still too small to draw. The
      // islet at 30,30 is now out of view.
      map.setView([5, 5], 6, { animate: false })

      expect(markersIn(smallShapeMarkers.markersLayer)).toHaveLength(3)
      expect(isHidden(polygon)).toBe(true)
    })
  })

  describe('neighbouring shapes', () => {
    // A 6x6 grid of touching 0.5° "provinces", each its own feature: ~1.4px
    // each at zoom 3, but ~8.5px together.
    function addProvinces(group, { rows = 6, cols = 6 } = {}) {
      const provinces = []

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const lat = row * 0.5
          const lng = col * 0.5

          provinces.push(
            addPolygon(group, {
              latLngs: [[lat, lng], [lat + 0.5, lng], [lat + 0.5, lng + 0.5], [lat, lng + 0.5]]
            })
          )
        }
      }

      return provinces
    }

    it('draws touching shapes that are visible together, though too small alone', () => {
      const { group, smallShapeMarkers } = setup({ zoom: 3 })
      const provinces = addProvinces(group)

      provinces.forEach((province) => smallShapeMarkers.register(province))
      smallShapeMarkers.sync()

      expect(markersIn(smallShapeMarkers.markersLayer)).toHaveLength(0)
      expect(provinces.some(isHidden)).toBe(false)
    })

    it('replaces touching shapes once they are too small even together', () => {
      const { group, smallShapeMarkers } = setup({ zoom: 3 })
      const provinces = addProvinces(group, { rows: 2, cols: 2 })

      provinces.forEach((province) => smallShapeMarkers.register(province))
      smallShapeMarkers.sync()

      // One per feature: each keeps its own popup.
      expect(markersIn(smallShapeMarkers.markersLayer)).toHaveLength(4)
      expect(provinces.every(isHidden)).toBe(true)
    })

    it('draws a small shape next to a visible shape of another feature', () => {
      const { group, smallShapeMarkers } = setup({ zoom: 3 })
      const country = addPolygon(group, { latLngs: [[0, 0], [20, 0], [20, 20], [0, 20]] })
      const island = addPolygon(group, {
        latLngs: [[10, 20.5], [10.1, 20.5], [10.1, 20.6], [10, 20.6]]
      })

      smallShapeMarkers.register(country)
      smallShapeMarkers.register(island)
      smallShapeMarkers.sync()

      expect(markersIn(smallShapeMarkers.markersLayer)).toHaveLength(0)
      expect(isHidden(island)).toBe(false)
    })
  })

  describe('with a marker cluster group', () => {
    it('keeps the markers out of the cluster, which still clusters the points', () => {
      const cluster = L.markerClusterGroup({ maxClusterRadius: 80 })
      const { smallShapeMarkers } = setup({ group: cluster, zoom: 2 })
      const polygon = addPolygon(cluster)
      const points = [L.marker([0.5, 0.5]), L.marker([0.6, 0.6])]

      points.forEach((point) => {
        point.feature = makeFeature('CollectionObject')
        cluster.addLayer(point)
      })
      smallShapeMarkers.register(polygon)
      smallShapeMarkers.sync()

      const marker = markerOf(smallShapeMarkers.markersLayer, polygon)

      expect(marker).toBeDefined()
      expect(cluster.hasLayer(marker)).toBe(false)
      expect(points[0].__parent).toBe(points[1].__parent)
      expect(points[0].__parent.getChildCount()).toBe(2)
    })

    it('hides and restores a shape held by the cluster group', () => {
      const cluster = L.markerClusterGroup()
      const { smallShapeMarkers } = setup({ group: cluster, zoom: 2 })
      const polygon = addPolygon(cluster)

      smallShapeMarkers.register(polygon)
      smallShapeMarkers.sync()

      expect(isHidden(polygon)).toBe(true)

      map.setZoom(5, { animate: false })

      expect(markersIn(smallShapeMarkers.markersLayer)).toHaveLength(0)
      expect(cluster.hasLayer(polygon)).toBe(true)
      expect(isHidden(polygon)).toBe(false)
    })
  })
})
