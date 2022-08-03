<template>
  <VCard>
    <VCardHeader>
      <h1 class="text-md">
        Type specimen
      </h1>
    </VCardHeader>
    <VCardContent class="text-sm">
      <p v-if="typeMaterials.length">
        {{ typeMaterials[0].label }}
      </p>
    </VCardContent>
  </VCard>
</template>

<script setup>
import { ref, watch } from 'vue'
import { SPECIMEN_TYPES } from '../constants'
import OtuService from '../services/OtuService'

const props = defineProps({
  otuId: {
    type: [String, Number],
    required: true
  }
})

const typeMaterials = ref([])

watch(
  () => props.otuId,
  () => {
  if (!props.otuId) { return }

  OtuService.getTypes(props.otuId).then(({ data }) => {
    typeMaterials.value = data.type_materials_catalog_labels.sort((a, b) => SPECIMEN_TYPES.indexOf(a.type_type) - SPECIMEN_TYPES.indexOf(b.type_type))
  })
}, { immediate: true })
</script>
