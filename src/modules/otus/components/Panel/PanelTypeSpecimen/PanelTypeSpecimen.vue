<template>
  <VCard v-if="typeMaterials.length">
    <VCardHeader>
      <h1 class="text-md">
        Type specimen
      </h1>
    </VCardHeader>
    <VCardContent class="text-sm">
      <p>
        {{ typeMaterials[0].label }}
      </p>
    </VCardContent>
  </VCard>
</template>

<script setup>
import { ref, watch } from 'vue'
import { SPECIMEN_TYPES } from '../../../constants'
import TaxonWorks from '../../../services/TaxonWorks'

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

  TaxonWorks.getOtuTypeMaterial(props.otuId).then(({ data }) => {
    typeMaterials.value = data.type_materials_catalog_labels.sort((a, b) => SPECIMEN_TYPES.indexOf(a.type_type) - SPECIMEN_TYPES.indexOf(b.type_type))
  })
}, { immediate: true })
</script>
