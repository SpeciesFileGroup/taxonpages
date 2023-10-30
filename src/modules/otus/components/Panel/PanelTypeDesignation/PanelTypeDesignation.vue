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
import { computed } from 'vue'
import { useOtuStore } from '@/modules/otus/store/store'
import PanelDropdown from '../PanelDropdown.vue'

const props = defineProps({
  taxonId: {
    type: [String, Number],
    required: true
  }
})

const store = useOtuStore()

const typeDesignation = computed(
  () => store.taxon?.type_taxon_name_relationship || {}
)
const typeDesignationLabel = computed(() =>
  [
    typeDesignation.value.subject_object_tag || '',
    typeDesignation.value.subject_status_tag || '',
    typeDesignation.value.object_object_tag || ''
  ].join(' ')
)
</script>
