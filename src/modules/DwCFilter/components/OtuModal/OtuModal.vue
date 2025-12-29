<template>
  <IconPlusCircle
    class="size-6 text-secondary-color cursor-pointer"
    @click="() => (isModalVisible = true)"
  />
  <VModal
    v-if="isModalVisible"
    @close="() => (isModalVisible = false)"
  >
    <template #header>
      <div class="flex flex-col">
        <div class="text-base font-medium">
          DwC Records - <span v-html="otu.object_tag" />
        </div>
        <i class="text-xs"
          >* The results shown here are based on the filters selected in the DwC
          filter.</i
        >
      </div>
    </template>
    <VSpinner v-if="isLoading" />
    <div class="mx-4 min-h-48">
      <div class="border-b">
        <TabList
          :tabs="tabs"
          v-model="activeIndex"
        />
      </div>
      <template v-if="activeIndex == 0">
        <RecordItems
          :items="typeSpecimenRecords"
          @select="
            ({ index, item }) => setCurrentImages(item.associatedMedia, index)
          "
        />
      </template>

      <template v-if="activeIndex == 1">
        <RecordItems
          :items="specimenRecords"
          @select="
            ({ index, item }) => setCurrentImages(item.associatedMedia, index)
          "
        />
      </template>

      <ImageViewer
        v-if="isViewerVisible"
        :images="currentImages"
        :index="currentIndex"
        :next="currentImages.length - 1 > currentIndex"
        :previous="currentIndex > 0"
        @select-index="(index) => (currentIndex = index)"
        @next="() => currentIndex++"
        @previous="() => currentIndex--"
        @close="() => (isViewerVisible = false)"
      />
    </div>
  </VModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { makeAPIRequest } from '@/utils'
import TabList from './TabList.vue'
import RecordItems from './RecordItems.vue'

const props = defineProps({
  otu: {
    type: Object,
    required: true
  },
  parameters: {
    type: Object,
    required: true
  }
})

const tabs = computed(() => [
  `Type material (${typeSpecimenRecords.value.length})`,
  `Specimen records (${specimenRecords.value.length})`
])

const currentIndex = ref(0)
const currentImages = ref([])
const isViewerVisible = ref(false)
const isLoading = ref(false)
const isModalVisible = ref(false)
const activeIndex = ref(0)

const dwcRecords = ref([])
const specimenRecords = computed(() =>
  dwcRecords.value.filter(
    (item) =>
      item.dwc_occurrence_object_type === 'CollectionObject' && !item.typeStatus
  )
)

const typeSpecimenRecords = computed(() =>
  dwcRecords.value.filter(
    (item) =>
      item.dwc_occurrence_object_type === 'CollectionObject' && item.typeStatus
  )
)

function loadList() {
  isLoading.value = true
  makeAPIRequest
    .get('/dwc_occurrences', {
      params: {
        'collection_object_query[otu_id][]': props.otu.id,
        per: 10000,
        ...props.parameters
      }
    })
    .then(async (response) => {
      response.data.sort((a, b) => {
        if (a.associatedMedia && !b.associatedMedia) {
          return -1
        }
        if (!a.associatedMedia && b.associatedMedia) {
          return 1
        }

        return 0
      })
      for (let i = 0; i < response.data.length; i++) {
        const item = response.data[i]

        if (item.associatedMedia) {
          const images = await getMediaImages(item)

          item.associatedMedia = images
        }
      }
      dwcRecords.value = response.data

      if (!typeSpecimenRecords.value.length) {
        activeIndex.value = 1
      }
    })
    .finally(() => {
      isLoading.value = false
    })
}

watch(isModalVisible, (newVal) => {
  if (newVal) {
    loadList()
  }
})

async function getMediaImages(item) {
  const links = item.associatedMedia.split('|')
  const promises = []

  links.forEach((link) => {
    promises.push(
      makeAPIRequest.get(link.trim(), {
        params: {
          extend: ['attribution', 'depictions', 'source']
        }
      })
    )
  })

  return await Promise.all(promises).then((responses) => {
    return responses.map((item) => item.data)
  })
}

function setCurrentImages(images, index) {
  currentImages.value = images
  currentIndex.value = index
  isViewerVisible.value = true
}
</script>
