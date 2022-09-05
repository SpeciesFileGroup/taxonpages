<template>
  <VCard v-if="images.length">
    <VCardContent>
      <GalleryImage :images="images" />
    </VCardContent>
  </VCard>
</template>

<script setup>
import { ref, watch } from 'vue'
import TaxonWorks from '../../../services/TaxonWorks'

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
  
    images.value = (await TaxonWorks.getOtuImages(props.otuId, params)).data
  },
  { immediate: true }
)
</script>
