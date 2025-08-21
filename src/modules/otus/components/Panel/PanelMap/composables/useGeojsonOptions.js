import { DISABLE_LAYER_OPTIONS } from '@/components/Map/constants'
import { computed, ref } from 'vue'

export function makeGeojsonOptions({ popupElement, popupItem }) {
  return function () {
    return {
      onEachFeature: (feature, layer) => {
        layer.pm.setOptions(DISABLE_LAYER_OPTIONS)
        layer.pm.disable()

        if (feature.properties.base.some(({ label }) => Boolean(label))) {
          layer.on('popupopen', () => (popupItem.value = feature.properties))
          layer.on('popupclose', () => (popupItem.value = null))

          layer.bindPopup(popupElement.value, {
            minWidth: 400,
            maxWidth: 400
          })
        }
      }
    }
  }
}

export function useGeojsonOptions({ popupElement }) {
  const popupItem = ref(null)

  const geojsonOptions = computed(() =>
    makeGeojsonOptions({ popupElement, popupItem })
  )

  return {
    geojsonOptions,
    popupItem
  }
}
