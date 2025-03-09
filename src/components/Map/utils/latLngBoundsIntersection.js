import L from "leaflet"

export function latLngBoundsIntersection(b1, b2) {
  if (!b1 && !b2) {
    return L.latLngBounds() // invalid
  } else if (!b1 || !b1.isValid()) {
    return b2
  } else if (!b2 || !b2.isValid()) {
    return b1
  }

  const w = Math.max(b1.getWest(), b2.getWest())
  const e = Math.min(b1.getEast(), b2.getEast())
  const n = Math.min(b1.getNorth(), b2.getNorth())
  const s = Math.max(b1.getSouth(), b2.getSouth())

  return L.latLngBounds([s, w], [n, e])
}
