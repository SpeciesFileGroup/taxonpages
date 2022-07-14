<template>
  <div
    ref="leafletMap"
    :style="{ width: props.width, height: props.height }"
  />
</template>

<script setup>

import { 
  computed,
  onMounted,
  onUnmounted,
  ref,
  watch,
  nextTick
} from 'vue'

import L from 'leaflet'
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'
import geojsonDefaultOptions from './utils/geojsonOptions'

delete L.Icon.Default.prototype._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetina,
  iconUrl: iconUrl,
  shadowUrl: shadowUrl
})

const { map_server_tils } = __APP_ENV__

const props = defineProps({
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

const emit = defineEmits(['geojson:ready'])

let mapObject
let observeMap
let geoJSONGroup = new L.FeatureGroup()
const leafletMap = ref(null)
const tiles = {
  osm: L.tileLayer(map_server_tils, {
    maxZoom: 18,
    className: 'map-tiles'
  })
}

const fitBoundsOptions = computed(() =>
  ({
    maxZoom: props.zoomBounds,
    zoom: {
      animate: props.zoomAnimate
    }
  })
)

watch(
  () => props.geojson, 
  newVal => {
    geoJSONGroup.clearLayers()
    setGeoJSON(newVal)
  },
  { deep: true }
)

onMounted(() => {
  mapObject = L.map(leafletMap.value, {
    center: props.center,
    zoom: props.zoom
  })

  geoJSONGroup = new L.FeatureGroup()
  geoJSONGroup.addTo(mapObject)

  tiles.osm.addTo(mapObject)
  initEvents()
})

const resizeMap = () => {
  if(!geoJSONGroup) return
  const bounds = geoJSONGroup.getBounds()

  mapObject.invalidateSize()
  nextTick(() => {
    if (Object.keys(bounds).length) {
      mapObject.fitBounds(bounds, fitBoundsOptions.value)
    }
  })
}

const initEvents = () => {
  observeMap = new ResizeObserver(entries => {
    const { width } = entries[0].contentRect
    resizeMap(width)
  })
  observeMap.observe(leafletMap.value)
}

onUnmounted(() => {
  geoJSONGroup.clearLayers()
  observeMap?.disconnect()
})

const setGeoJSON = geojson => {
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

<style>
.leaflet-marker-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: red;
  opacity: 0.5;
}
</style>