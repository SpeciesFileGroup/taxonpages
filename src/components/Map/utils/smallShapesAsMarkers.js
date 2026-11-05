/**
 * Replaces shapes (polygons and lines) with markers where they would be lost
 * on screen: small, and away from any other shape that shows where they are.
 *
 * - Each part of a shape is measured on its own: a MultiPolygon of islands far
 *   apart is large as a whole, yet every island in it may be invisible.
 * - Parts are not judged alone, but against the whole map, whichever feature
 *   they belong to: small parts that touch form a mass, so neighbouring
 *   provinces too small to see one by one still draw their country.
 * - A mass smaller than a marker gets one, unless it lies next to a visible part
 *   (the islets along a coast). Nearby markers of a same feature are merged, so
 *   a group of islets gets one rather than one each. A shape is hidden only
 *   once all of its parts are replaced.
 * - Sizes are measured once, at zoom 0, and scaled: on screen they grow
 *   linearly with the CRS scale, so syncing on zoom projects nothing. Only
 *   parts around the view are looked at, and `moveend` syncs again after a pan.
 * - A hidden shape stays in its layer, with a CSS class: the bounds used by
 *   fitBounds don't change, and its popup and listeners keep working because
 *   the markers forward their events to it.
 * - Markers go into a layer of their own, never into a marker cluster group:
 *   they stand for shapes, which are not clustered either.
 *
 * Proximity is measured between bounding boxes, not outlines: cheap, and close
 * enough at sizes of a few pixels.
 */

const REPLACED_SHAPE_CLASS = 'map-shape-replaced'
const DEFAULT_MIN_SIZE_IN_PIXELS = 8

// Gap, in pixels, under which two parts count as touching: neighbouring
// polygons rarely share their edges exactly.
const TOUCH_TOLERANCE_IN_PIXELS = 1

const FORWARDED_EVENTS = [
  'click',
  'dblclick',
  'contextmenu',
  'keypress',
  'mouseover',
  'mouseout'
]

function getIconSizeInPixels(L, marker) {
  const iconSize = marker.options.icon?.options.iconSize

  if (!iconSize) return DEFAULT_MIN_SIZE_IN_PIXELS

  const { x, y } = L.point(iconSize)

  return Math.max(x, y)
}

// The outer ring of each polygon of a (Multi)Polygon, or each line of a
// (Multi)LineString.
function getPartLatLngs(L, layer) {
  const latlngs = layer.getLatLngs()

  if (!latlngs.length) return []

  if (layer instanceof L.Polygon) {
    return L.LineUtil.isFlat(latlngs[0])
      ? [latlngs[0]]
      : latlngs.map((polygon) => polygon[0])
  }

  return L.LineUtil.isFlat(latlngs) ? [latlngs] : latlngs
}

function areNear(a, b, distance) {
  return (
    a.min.x - distance <= b.max.x &&
    a.max.x + distance >= b.min.x &&
    a.min.y - distance <= b.max.y &&
    a.max.y + distance >= b.min.y
  )
}

function getSize(bounds) {
  return Math.max(bounds.max.x - bounds.min.x, bounds.max.y - bounds.min.y)
}

// Grid of `cellSize` pixels: finds items close to a point or box without
// comparing every pair.
function makeGrid(cellSize) {
  const cells = new Map()
  const toCell = (value) => Math.floor(value / cellSize)

  function forEachCell(bounds, distance, callback) {
    for (let x = toCell(bounds.min.x - distance); x <= toCell(bounds.max.x + distance); x++) {
      for (let y = toCell(bounds.min.y - distance); y <= toCell(bounds.max.y + distance); y++) {
        callback(`${x}:${y}`)
      }
    }
  }

  return {
    add(bounds, item) {
      forEachCell(bounds, 0, (key) => {
        if (cells.has(key)) {
          cells.get(key).push(item)
        } else {
          cells.set(key, [item])
        }
      })
    },

    some(bounds, distance, predicate) {
      let found = false

      forEachCell(bounds, distance, (key) => {
        found ||= cells.get(key)?.some(predicate) || false
      })

      return found
    },

    forEachNear(bounds, distance, callback) {
      forEachCell(bounds, distance, (key) => cells.get(key)?.forEach(callback))
    }
  }
}

// Of the small parts, those that stand alone: grouped with the small parts they
// touch, the group is still smaller than a marker and no visible part is near.
function findIsolatedParts(L, small, visible, minSize) {
  const parent = small.map((_, index) => index)
  const find = (index) => {
    while (parent[index] !== index) {
      parent[index] = parent[parent[index]]
      index = parent[index]
    }

    return index
  }

  // Small parts span at most two cells of `minSize` per axis.
  const grid = makeGrid(minSize)

  small.forEach((item, index) => {
    grid.forEachNear(item.bounds, TOUCH_TOLERANCE_IN_PIXELS, (other) => {
      if (areNear(item.bounds, small[other].bounds, TOUCH_TOLERANCE_IN_PIXELS)) {
        parent[find(other)] = find(index)
      }
    })
    grid.add(item.bounds, index)
  })

  const groups = new Map()

  small.forEach((item, index) => {
    const root = find(index)
    const group = groups.get(root)

    if (group) {
      group.bounds.extend(item.bounds.min).extend(item.bounds.max)
      group.items.push(item)
    } else {
      groups.set(root, {
        bounds: L.bounds(item.bounds.min, item.bounds.max),
        items: [item]
      })
    }
  })

  const isolated = []

  groups.forEach(({ bounds, items }) => {
    if (getSize(bounds) >= minSize) return
    if (visible.some((other) => areNear(bounds, other, minSize))) return

    isolated.push(...items)
  })

  return isolated
}

export function createSmallShapeMarkers({ L, map, makeMarker }) {
  const crs = map.options.crs
  const markersLayer = L.layerGroup().addTo(map)
  const entries = new Map()
  let minSize = DEFAULT_MIN_SIZE_IN_PIXELS
  let lastViewKey = null

  function makePart(latlngs) {
    const bounds = L.latLngBounds(latlngs)

    if (!bounds.isValid()) return null

    const pixelBounds = L.bounds(
      map.project(bounds.getSouthWest(), 0),
      map.project(bounds.getNorthEast(), 0)
    )

    return {
      center: bounds.getCenter(),
      // At zoom 0; scaled on sync.
      pixelBounds,
      size: getSize(pixelBounds),
      marker: null,
      isShown: false,
      isInView: false,
      isCovered: false
    }
  }

  function getMarker(entry, part) {
    if (!part.marker) {
      const marker = makeMarker(entry.feature, part.center)

      marker.feature = entry.feature

      FORWARDED_EVENTS.forEach((type) => {
        marker.on(type, (event) => entry.shape.fire(type, event))
      })

      part.marker = marker
    }

    return part.marker
  }

  function applyShapeVisibility(entry) {
    entry.shape
      .getElement()
      ?.classList.toggle(REPLACED_SHAPE_CLASS, entry.isHidden)
  }

  function register(layer, feature = layer.feature) {
    // L.geoJSON instances and GeometryCollections: their children carry no
    // feature of their own, so they inherit the parent's.
    if (layer instanceof L.LayerGroup) {
      layer.eachLayer((child) => register(child, child.feature || feature))
      return
    }

    // L.Polygon extends L.Polyline; circles and markers are not shapes here.
    if (!(layer instanceof L.Polyline) || !feature || entries.has(layer)) return

    const parts = getPartLatLngs(L, layer).map(makePart).filter(Boolean)

    if (!parts.length) return

    const entry = {
      shape: layer,
      feature,
      parts,
      isHidden: false,
      // Leaflet creates a new path element each time a shape is re-added.
      onShapeAdd: () => applyShapeVisibility(entry)
    }

    // The threshold is the largest marker on the map.
    minSize = Math.max(minSize, getIconSizeInPixels(L, getMarker(entry, parts[0])))

    layer.on('add', entry.onShapeAdd)
    entries.set(layer, entry)
    lastViewKey = null
  }

  // The parts that get a marker. Also flags each part `isInView`, and
  // `isCovered` when a marker stands for it. Only parts within `view` are looked
  // at: off screen they would only cost time, and `moveend` syncs again once
  // they come into view.
  function getPartsToShow(factor, view) {
    const visible = []
    const small = []

    entries.forEach((entry) => {
      entry.parts.forEach((part) => {
        const bounds = L.bounds(
          part.pixelBounds.min.multiplyBy(factor),
          part.pixelBounds.max.multiplyBy(factor)
        )

        part.isInView = view.intersects(bounds)
        part.isCovered = false

        if (!part.isInView) return

        if (part.size * factor >= minSize) {
          visible.push(bounds)
        } else {
          small.push({ entry, part, bounds })
        }
      })
    })

    const shown = new Set()

    if (!small.length) return shown

    // Largest first: they claim the marker of a group of nearby islets.
    const isolated = findIsolatedParts(L, small, visible, minSize).sort(
      (a, b) => b.part.size - a.part.size
    )
    const markers = makeGrid(minSize)

    isolated.forEach(({ entry, part, bounds }) => {
      const point = bounds.getCenter()
      const pointBounds = L.bounds(point, point)
      const isNearMarker = markers.some(
        pointBounds,
        minSize,
        (other) =>
          other.entry === entry &&
          Math.abs(other.point.x - point.x) < minSize &&
          Math.abs(other.point.y - point.y) < minSize
      )

      part.isCovered = true

      if (isNearMarker) return

      markers.add(pointBounds, { entry, point })
      shown.add(part)
    })

    return shown
  }

  function sync() {
    const zoom = map.getZoom()
    // Padded, so short pans don't change anything.
    const view = map.getPixelBounds().pad(0.5)
    const viewKey = `${zoom}|${view.min.x},${view.min.y}|${view.max.x},${view.max.y}`

    // `moveend` follows every `zoom`, with the same view.
    if (viewKey === lastViewKey) return

    lastViewKey = viewKey

    const factor = crs.scale(zoom) / crs.scale(0)

    const shown = getPartsToShow(factor, view)

    entries.forEach((entry) => {
      const isInView = entry.parts.some((part) => part.isInView)
      const isDrawn = entry.parts.some((part) => part.isInView && !part.isCovered)

      entry.parts.forEach((part) => {
        const shouldShow = shown.has(part)

        if (shouldShow === part.isShown) return

        part.isShown = shouldShow

        if (shouldShow) {
          markersLayer.addLayer(getMarker(entry, part))
        } else {
          markersLayer.removeLayer(part.marker)
        }
      })

      // Out of view, it does not matter: keep the shape as it is.
      const isHidden = isInView ? !isDrawn : entry.isHidden

      if (isHidden !== entry.isHidden) {
        entry.isHidden = isHidden
        applyShapeVisibility(entry)
      }
    })
  }

  function clear() {
    entries.forEach((entry) => {
      entry.shape.off('add', entry.onShapeAdd)

      if (entry.isHidden) {
        entry.isHidden = false
        applyShapeVisibility(entry)
      }
    })

    markersLayer.clearLayers()
    entries.clear()
    minSize = DEFAULT_MIN_SIZE_IN_PIXELS
    lastViewKey = null
  }

  function destroy() {
    clear()
    map.off('zoom', sync)
    map.off('moveend', sync)
    markersLayer.remove()
  }

  // `zoom` fires as the zoom changes, pinch zoom included; `moveend` brings in
  // the parts a pan reveals.
  map.on('zoom', sync)
  map.on('moveend', sync)

  return { register, sync, clear, destroy, markersLayer }
}
