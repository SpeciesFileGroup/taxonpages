<template>
  <VCard v-if="typeMaterials.length">
    <VCardHeader class="flex justify-between">
      <h2 class="text-md">Type specimen</h2>
      <PanelDropdown panel-key="panel:typeMaterial" />
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
import { useOtuPageRequest } from '@/modules/otus/helpers/useOtuPageRequest'
import PanelDropdown from '../PanelDropdown.vue'
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
    if (!props.otuId) {
      return
    }

    useOtuPageRequest('panel:typeMaterial', () =>
      TaxonWorks.getOtuTypeMaterial(props.otuId)
    ).then(({ data }) => {
      typeMaterials.value = data.type_materials_catalog_labels.sort(
        (a, b) =>
          SPECIMEN_TYPES.indexOf(a.type_type) -
          SPECIMEN_TYPES.indexOf(b.type_type)
      )
    })
  },
  { immediate: true }
)
</script>
