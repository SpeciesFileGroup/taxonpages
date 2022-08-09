<template>
  <VCard>
    <VCardHeader>
      <h1 class="text-md">
        Type
      </h1>
    </VCardHeader>
    <VCardContent class="text-sm">
      <p v-html="typeSpeciesLabel" />
    </VCardContent>
  </VCard>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import OtuService from '../services/OtuService'

const props = defineProps({
  taxonId: {
    type: [String, Number],
    required: true
  }
})

const typeSpecies = ref({})
const typeSpeciesLabel = computed(() => [
  typeSpecies.value.subject_object_tag || '', 
  typeSpecies.value.subject_status_tag || '',
  typeSpecies.value.object_object_tag || ''
].join(' '))

watch(
  () => props.taxonId, async () => {
  if (!props.taxonId) { return }

  OtuService.getTaxonTypeSpecies(props.taxonId).then(({ data }) => {
    typeSpecies.value = data.type_taxon_name_relationship
  })
}, { immediate: true })
</script>