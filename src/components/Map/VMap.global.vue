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

const { map_server_tils } = __APP_ENV__

const props = defineProps({
  controls: {
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

const emit = defineEmits(['geojson:ready', 'geojson'])

let mapObject
let observeMap
let drawnItems
let geoJSONGroup

const leafletMap = ref(null)
const tiles = {
  osm: L.tileLayer(map_server_tils, {
    maxZoom: 18,
    className: 'map-tiles'
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

onMounted(() => {
  drawnItems = new L.FeatureGroup()
  geoJSONGroup = new L.FeatureGroup()

  mapObject = L.map(leafletMap.value, {
    center: props.center,
    zoom: props.zoom,
    worldCopyJump: true
  })

  mapObject.pm.setGlobalOptions({
    layerGroup: drawnItems
  })

  geoJSONGroup.addTo(mapObject)

  mapObject.addLayer(drawnItems)
  mapObject.addLayer(geoJSONGroup)

  if (props.controls) {
    mapObject.pm.addControls({
      position: 'topleft',
      drawText: false,
      drawCircle: false,
      drawPolyline: false,
      drawMarker: false,
      cutPolygon: false
    })

    mapObject.on('pm:create', () => {
      const fg = L.featureGroup()

      drawnItems.eachLayer((layer) => {
        if (
          (layer instanceof L.Path || layer instanceof L.Marker) &&
          layer.pm
        ) {
          fg.addLayer(layer)
        }
      })

      emit('geojson', fg.toGeoJSON())
    })
  }

  tiles.osm.addTo(mapObject)
  initEvents()
})

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

const setGeoJSON = (geojson) => {
  if (geojson) {
    L.geoJSON(geojson, {
      ...geojsonDefaultOptions,
      ...props.geojsonOptions
    }).addTo(geoJSONGroup)

    const bounds = geoJSONGroup.getBounds()

    if (bounds.isValid()) {
      mapObject.fitBounds(bounds, fitBoundsOptions.value)
    }
  }

  emit('geojson:ready', geoJSONGroup)
}
</script>

<style></style>
