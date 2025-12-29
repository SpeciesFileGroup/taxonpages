<template>
  <div
    v-if="!items.length"
    class="text-xl text-center flex flex-col justify-center h-36"
  >
    No records found.
  </div>
  <div
    v-for="item in items"
    class="flex justify-between flex-col gap-2 text-sm px-4 py-4 border-b"
    :key="item.id"
  >
    <div class="flex flex-col">
      <span class="font-medium">{{ item.typeStatus }}</span>
      <span v-html="makeSpecimenLabel(item)" />
    </div>
    <GalleryThumbnailList
      v-if="item.associatedMedia"
      :images="item.associatedMedia"
      class="flex-row flex-wrap gap-2"
      @select-index="(index) => emit('select', { item, index })"
    />
  </div>
</template>

<script setup>
import GalleryThumbnailList from '@/components/Gallery/GalleryThumbnailList.vue'

const props = defineProps({
  items: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['select'])

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
</script>
