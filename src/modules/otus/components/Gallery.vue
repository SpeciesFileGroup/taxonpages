<template>
  <VCard v-if="images.length">
    <CardContent>
      <GalleryMain :images="images" />
    </CardContent>
  </VCard>
</template>

<script setup>
import { ref, watch } from 'vue'
import GalleryMain from '@/components/Gallery/Main.vue'
import OtuService from '../services/OtuService';

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
      extend: ['depictions', 'attribution'],
      otu_scope: ['all']
    }
  
    images.value = (await OtuService.getOtuImages(props.otuId, params)).data
  },
  { immediate: true }
)
</script>
