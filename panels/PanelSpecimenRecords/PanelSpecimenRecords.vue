<template>
  <VCard>
    <VCardHeader>Type specimens</VCardHeader>
    <VCardContent :class="isLoading && 'min-h-[6rem]'">
      <VSpinner v-if="isLoading" />
      <template
        v-for="item in typeSpecimenRecords"
        :key="item.id"
      >
        <div class="flex justify-between flex-col gap-2 text-sm px-2 py-4">
          <div class="flex flex-col">
            <span class="font-medium">{{ item.typeStatus }}</span>
            <span v-html="makeSpecimenLabel(item)" />
          </div>
          <GalleryThumbnailList
            v-if="item.associatedMedia"
            :images="item.associatedMedia"
            class="flex-row flex-wrap gap-2"
            @select-index="
              (index) => setCurrentImages(item.associatedMedia, index)
            "
          />
        </div>
        <hr />
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
    </VCardContent>
  </VCard>
  <VCard v-if="specimenRecords.length">
    <VCardHeader>Specimen records</VCardHeader>
    <VCardContent :class="isLoading && 'min-h-[6rem]'">
      <VSpinner v-if="isLoading" />
      <template
        v-for="item in specimenRecords"
        :key="item.id"
      >
        <div class="flex flex-col justify-between text-sm px-2 py-4 gap-2">
          <div class="flex flex-col">
            <span>{{ item.typeStatus }}</span>
            <span v-html="makeSpecimenLabel(item)" />
          </div>
          <GalleryThumbnailList
            v-if="item.associatedMedia"
            :images="item.associatedMedia"
            class="lg:flex-row gap-2 flex-wrap"
            @select-index="
              (index) => setCurrentImages(item.associatedMedia, index)
            "
          />
        </div>
        <hr />
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
    </VCardContent>
  </VCard>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { makeAPIRequest } from '@/utils'
import GalleryThumbnailList from '@/components/Gallery/GalleryThumbnailList.vue'

const props = defineProps({
  otuId: {
    type: Number,
    required: true
  }
})

const currentIndex = ref(0)
const currentImages = ref([])
const isViewerVisible = ref(false)
const isLoading = ref(false)

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

function getLocalityData(data) {
  const area = [
    data.country,
    data.stateProvince,
    data.county,
    data.verbatimLocality
  ]
    .filter(Boolean)
    .join(', ')

  return area
}

function makeSpecimenLabel(item) {
  return [
    getCountAndSex(item),
    getDepositoryData(item),
    item.catalogNumber,
    getLocalityData(item),
    getCoordinates(item),
    getCollector(item)
  ]
    .filter(Boolean)
    .join('; ')
}

function getDepositoryData(data) {
  const { institutionCode, institutionID } = data

  if (!institutionCode) return

  return institutionID
    ? `<a href="${institutionID}" target="_blank">${institutionCode}</a>`
    : `<span>${institutionCode}</span>`
}

function getCountAndSex({ individualCount, sex }) {
  return sex
    ? `${individualCount} ${sex}`
    : `${individualCount} specimen${individualCount > 1 ? 's' : ''}`
}

function getCollector({ recordedBy }) {
  return recordedBy ? `Col. ${recordedBy}` : ''
}

function getCoordinates({ verbatimCoordinates }) {
  const coordinates = verbatimCoordinates?.split(' ').join(', ')

  return coordinates ? `(${coordinates})` : ''
}

onMounted(() => {
  isLoading.value = true
  makeAPIRequest
    .get(`/otus/${props.otuId}/inventory/dwc.json`)
    .then(async (response) => {
      for (let i = 0; i < response.data.length; i++) {
        const item = response.data[i]

        if (item.associatedMedia) {
          const images = await getMediaImages(item)

          item.associatedMedia = images
        }
      }
      dwcRecords.value = response.data
    })
    .finally(() => {
      isLoading.value = false
    })
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