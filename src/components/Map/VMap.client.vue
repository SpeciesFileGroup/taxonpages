<template>
  <div
    ref="leafletMap"
    :style="{ width: props.width, height: props.height }"
  />
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch, nextTick } from 'vue'
import L from 'leaflet'
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'
import geojsonDefaultOptions from './utils/geojsonOptions'

import '@geoman-io/leaflet-geoman-free'
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css'

delete L.Icon.Default.prototype._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetina,
  iconUrl: iconUrl,
  shadowUrl: shadowUrl
})

const { map_tile_server, map_tile_attribution } = __APP_ENV__

const props = defineProps({
  controls: {
    type: Boolean,
    default: false
  },

  dragging: {
    type: Boolean,
    default: false
  },

  zoomAnimate: {
    type: Boolean,
    default: false
  },

  width: {
    type: String,
    default: undefined
  },

  height: {
    type: String,
    default: undefined
  },

  zoom: {
    type: Number,
    default: 18
  },

  maxZoom: {
    type: Number,
    default: 18
  },

  minZoom: {
    type: Number,
    default: 0
  },

  disableZoom: {
    type: Boolean,
    default: false
  },

  center: {
    type: Array,
    default: () => [0, 0]
  },

  geojson: {
    type: Object,
    default: undefined
  },

  zoomBounds: {
    type: Number,
    default: undefined
  },

  geojsonOptions: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits([
  'geojson:ready',
  'geojson',
  'add:layer',
  'draw:start',
  'edit:layer',
  'drag:layer',
  'zoom:change',
  'zoom:start'
])

let mapObject
let observeMap
let drawnItems
let geoJSONGroup

const leafletMap = ref(null)
const tiles = {
  osm: L.tileLayer(map_tile_server, {
    maxZoom: props.maxZoom,
    minZoom: props.minZoom,
    className: 'map-tiles',
    attribution: map_tile_attribution
  })
}

const fitBoundsOptions = computed(() => ({
  maxZoom: props.zoomBounds,
  zoom: {
    animate: props.zoomAnimate
  }
}))

watch(
  () => props.geojson,
  (newVal) => {
    geoJSONGroup.clearLayers()
    setGeoJSON(newVal)
  },
  { deep: true }
)

watch(
  () => props.dragging,
  (newVal) => {
    if (newVal) {
      mapObject.dragging.enable()
    } else {
      mapObject.dragging.disable()
    }
  }
)

onMounted(() => {
  const options = {
    center: props.center,
    zoom: props.zoom,
    worldCopyJump: true,
    dragging: props.dragging
  }

  if (props.disableZoom) {
    Object.assign(options, {
      scrollWheelZoom: false,
      zoomControl: false,
      doubleClickZoom: false,
      touchZoom: false,
      boxZoom: false
    })
  }

  drawnItems = new L.FeatureGroup()
  geoJSONGroup = new L.FeatureGroup()

  mapObject = L.map(leafletMap.value, options)

  mapObject.pm.setGlobalOptions({
    layerGroup: drawnItems
  })

  geoJSONGroup.addTo(mapObject)

  mapObject.addLayer(drawnItems)
  mapObject.addLayer(geoJSONGroup)

  if (props.geojson) {
    setGeoJSON(props.geojson)
  }

  if (props.controls) {
    mapObject.pm.addControls({
      position: 'topleft',
      drawText: false,
      drawCircle: false,
      drawPolyline: false,
      drawCircleMarker: false,
      drawMarker: false,
      cutPolygon: false
    })

    mapObject.on('pm:create', (e) => {
      emit('geojson', getDrawItemsInGeoJson())
      emit('add:layer', convertGeoJSONWithPointRadius(e.layer))
    })

    drawnItems.on('pm:edit', (e) => {
      emit('geojson', getDrawItemsInGeoJson())
      emit('edit:layer', convertGeoJSONWithPointRadius(e.layer))
    })

    mapObject.on('pm:drawstart', (e) => {
      clearDrawLayers()
      emit('draw:start', e)
    })

    mapObject.on('zoom', (e) => emit('zoom:change', e))
    mapObject.on('zoomstart', (e) => emit('zoom:start', e))
  }

  tiles.osm.addTo(mapObject)
  initEvents()
})

function getDrawItemsInGeoJson() {
  const fg = L.featureGroup()

  drawnItems.eachLayer((layer) => {
    if ((layer instanceof L.Path || layer instanceof L.Marker) && layer.pm) {
      fg.addLayer(layer)
    }
  })

  return fg.toGeoJSON()
}

function clearDrawLayers() {
  drawnItems.clearLayers()
}

function convertGeoJSONWithPointRadius(layer) {
  const layerJson = layer.toGeoJSON()

  if (typeof layer.getRadius === 'function') {
    layerJson.properties.radius = layer.getRadius()
  }

  return layerJson
}

const resizeMap = () => {
  if (!geoJSONGroup) return
  const bounds = geoJSONGroup.getBounds()

  mapObject.invalidateSize()
  nextTick(() => {
    if (Object.keys(bounds).length) {
      mapObject.fitBounds(bounds, fitBoundsOptions.value)
    }
  })
}

const initEvents = () => {
  observeMap = new ResizeObserver((entries) => {
    const { width } = entries[0].contentRect
    resizeMap(width)
  })
  observeMap.observe(leafletMap.value)
}

onUnmounted(() => {
  geoJSONGroup.clearLayers()
  observeMap?.disconnect()
})

function setGeoJSON(geojson) {
  if (geojson) {
    L.geoJSON(geojson, {
      ...geojsonDefaultOptions(L),
      ...props.geojsonOptions
    }).addTo(geoJSONGroup)

    const bounds = geoJSONGroup.getBounds()

    if (bounds.isValid()) {
      mapObject.fitBounds(bounds, fitBoundsOptions.value)
    }
  }

  emit('geojson:ready', geoJSONGroup)
}

function getMapObject() {
  return mapObject
}

defineExpose({
  clearDrawLayers,
  getMapObject,
  resizeMap
})
</script>
