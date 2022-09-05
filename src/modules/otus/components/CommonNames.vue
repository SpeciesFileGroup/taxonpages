<template>
  <span>{{ commonNameLabel }}</span>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import TaxonWorks from '../services/TaxonWorks'

const props = defineProps({
  otuId: {
    type: Number,
    default: undefined
  }
})

const commonNames = ref([])
const commonNameLabel = computed(() => commonNames.value.map(item => item.name).join('; '))

watch(
  () => props.otuId,
  id => {
    if (id) {
      TaxonWorks.getOtuDescendants(id, { 
        max_descendants_depth: 0,
        extend: ['common_names']
      }).then(({ data }) => {
        commonNames.value = data.common_names
      })
    } else {
      commonNames.value = []
    }
  }
)




</script>