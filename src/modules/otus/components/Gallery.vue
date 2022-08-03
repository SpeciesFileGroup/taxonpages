<template>
  <VCard v-if="images.length">
    <VCardContent>
      <GalleryImage :images="images" />
    </VCardContent>
  </VCard>
</template>

<script setup>
import { ref, watch } from 'vue'
import OtuService from '../services/OtuService'

const props = defineProps({
  otuId: {
    type: [String, Number],
    required: true
  }
})

const images = ref([])

watch(
  () => props.otuId,
  async () => {
    const params = {
      extend: ['depictions', 'attribution', 'source', 'citations'],
      otu_scope: ['all']
    }
  
    images.value = (await OtuService.getOtuImages(props.otuId, params)).data
  },
  { immediate: true }
)
</script>
