<template>
  <VCard>
    <div class="relative">
      <ClientOnly>
        <VSpinner v-if="isLoading" />

        <Suspense>
          <VMap
            class="h-96 max-h-96"
            dragging
            :zoom="zoom"
            :geojson="geojson"
            @geojson:ready="() => (isLoading = false)"
          />
        </Suspense>
      </ClientOnly>
      <VButton
        class="h-6 text-sm absolute right-3 top-3 z-[400]"
        primary
        @click="() => (isOtuSearchVisible = true)"
      >
        Search
      </VButton>
      <ClientOnly>
        <Suspense>
          <OtuSearch
            v-if="isOtuSearchVisible"
            :otu="otu"
            :shapes="geojson"
            @close="() => (isOtuSearchVisible = false)"
          />
        </Suspense>
      </ClientOnly>
    </div>
    <div
      v-if="errorMessage"
      class="flex flex-row p-2 text-xs italic"
    >
      * {{ errorMessage }}
    </div>
    <div
      class="flex flex-row p-2 gap-2 text-xs"
      v-if="currentShapeTypes.length"
    >
      <div
        v-for="type in currentShapeTypes"
        :key="type"
        class="flex flex-row items-center"
      >
        <div
          class="w-3 h-3 m-1 rounded-sm"
          :class="LEGEND[type].background"
        />
        <span>{{ LEGEND[type].label }}</span>
      </div>
    </div>
  </VCard>
</template>

<script setup>
import { ref, watch } from 'vue'
import TaxonWorks from '../../../services/TaxonWorks'
import OtuSearch from '../../Search/OtuSearch.vue'

const props = defineProps({
  otuId: {
    type: [String, Number],
    required: true
  },

  otu: {
    type: Object,
    required: true
  }
})

const zoom = 2
const geojson = ref(undefined)
const isLoading = ref(true)
const isOtuSearchVisible = ref(false)
const currentShapeTypes = ref([])
const errorMessage = ref(null)

const LEGEND = {
  AssertedDistribution: {
    label: 'Asserted disitrubtion',
    background: 'bg-map-asserted'
  },
  Georeference: {
    label: 'Georeference',
    background: 'bg-map-georeference'
  },
  TypeMaterial: {
    label: 'Type material',
    background: 'bg-map-type-material'
  },
  CollectionObject: {
    label: 'Collection object',
    background: 'bg-map-collection-object'
  }
}

watch(
  () => props.otuId,
  async (newId, oldId) => {
    if (newId === oldId) return
    isLoading.value = true

    const { data } = await TaxonWorks.getOtuDistribution(props.otuId)

    if (data.request_too_large) {
      geojson.value = null
      errorMessage.value = data.message
    } else {
      geojson.value = {
        ...data,
        features: removeDuplicateShapes(data)
      }
    }
  },
  { immediate: true }
)

function removeDuplicateShapes(data) {
  const features = []

  data.features.forEach((feature) => {
    const shapeId = feature.properties.shape.id
    const shapeType = feature.properties.shape.type

    if (!currentShapeTypes.value.includes(feature.properties.base.type)) {
      currentShapeTypes.value.push(feature.properties.base.type)
    }

    const index = features.findIndex(
      (item) =>
        item.properties.shape.id === shapeId &&
        item.properties.shape.type === shapeType
    )

    if (index > -1) {
      const currentFeature = features[index]

      currentFeature.properties.base.push(feature.properties.base)
      currentFeature.properties.target.push(feature.properties.target)
    } else {
      const item = structuredClone(feature)

      item.properties.base = [item.properties.base]
      item.properties.target = [item.properties.target]

      features.push(item)
    }
  })

  currentShapeTypes.value.sort()

  return features
}
</script>
