<template>
  <VCard>
    <VCardHeader>Type specimens</VCardHeader>
    <VCardContent>
      <VTable>
         <VTableBody>
          <VTableBodyRow
            v-for="item in specimenRecords"
            :key="item.id"
          >
          <VTableBodyCell>{{ item.typeStatus }}</VTableBodyCell>
          <VTableBodyCell>
          <div 
            class="flex justify-end flex-col gap-2 sm:flex-row items-center"
            v-if="item.associatedMedia"
          >
            <GalleryThumbnail v-for="image in item.associatedMedia" :image="image"/>
          </div>
          </VTableBodyCell>
          </VTableBodyRow>
        </VTableBody>
      </VTable>
    </VCardContent>
  </VCard>
</template>

<script setup>
import { ref, computed } from 'vue'
import { makeAPIRequest } from '@/utils'
import GalleryThumbnail from '@/components/Gallery/GalleryThumbnail.vue'

const props = defineProps({
  otuId: {
    type: Number,
    required: true
  }
})

const dwcRecords = ref([])
const specimenRecords = computed(() => dwcRecords.value.filter(item => item.dwc_occurrence_object_type === 'CollectionObject' && item.typeStatus))

makeAPIRequest
  .get(
    `/otus/${props.otuId}/inventory/dwc.json`
  )
  .then(async (response) => {
    for(let i = 0; i < response.data.length; i++) {
      const item = response.data[i]

      if (item.associatedMedia) {
        const images = await getMediaImages(item)

        item.associatedMedia = images
      }
    }
    dwcRecords.value = response.data
  })

async function getMediaImages(item) {
  const links = item.associatedMedia.split('|')
  const promises = []

  links.forEach(link => {
    promises.push(makeAPIRequest.get(link.trim()))
  })

  return await Promise.all(promises).then((responses) => {
    return responses.map(item => item.data)
  })
}
</script>
