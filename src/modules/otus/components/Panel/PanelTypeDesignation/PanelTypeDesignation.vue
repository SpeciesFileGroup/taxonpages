<template>
  <VCard>
    <VCardHeader class="flex justify-between">
      <h2 class="text-md">Type</h2>
      <PanelDropdown panel-key="panel:type" />
    </VCardHeader>
    <VCardContent class="text-sm">
      <p v-html="typeDesignationLabel" />
    </VCardContent>
  </VCard>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useOtuPageRequest } from '@/modules/otus/helpers/useOtuPageRequest'
import PanelDropdown from '../PanelDropdown.vue'
import TaxonWorks from '../../../services/TaxonWorks'

const props = defineProps({
  taxonId: {
    type: [String, Number],
    required: true
  }
})

const typeDesignation = ref({})
const typeDesignationLabel = computed(() =>
  [
    typeDesignation.value.subject_object_tag || '',
    typeDesignation.value.subject_status_tag || '',
    typeDesignation.value.object_object_tag || ''
  ].join(' ')
)

watch(
  () => props.taxonId,
  async () => {
    if (!props.taxonId) {
      return
    }
    useOtuPageRequest('panel:type', () =>
      TaxonWorks.getTaxonTypeDesignation(props.taxonId)
    ).then(({ data }) => {
      typeDesignation.value = data.type_taxon_name_relationship || {}
    })
  },
  { immediate: true }
)
</script>
