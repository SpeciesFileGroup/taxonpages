<template>
  <VTable>
    <VTableHeader>
      <VTableHeaderRow>
        <VTableHeaderCell> Descriptor </VTableHeaderCell>
        <VTableHeaderCell class="w-full"> Value </VTableHeaderCell>
      </VTableHeaderRow>
    </VTableHeader>
    <VTableBody>
      <VTableBodyRow
        v-for="observation in observations"
        :key="observation.id"
      >
        <VTableBodyCell
          class="font-bold text-nowrap"
          v-html="observation.descriptorName"
        />
        <VTableBodyCell v-html="observation.value" />
      </VTableBodyRow>
    </VTableBody>
  </VTable>
</template>

<script setup>
import { ref } from 'vue'
import { makeObservation } from '../utils'
import TaxonWorks from '@/modules/otus/services/TaxonWorks'

const props = defineProps({
  soundId: {
    type: Number,
    required: true
  }
})

const isLoading = ref(true)
const observations = ref([])

TaxonWorks.getObservations({
  sound_id: props.soundId,
  extend: ['character_state', 'depictions', 'image', 'descriptor']
})
  .then(({ data }) => {
    const list = data.map((item) => makeObservation(item))

    list.sort((a, b) => a.descriptorName.localeCompare(b.descriptorName))

    observations.value = list
  })
  .catch(() => {})
  .finally(() => {
    isLoading.value = false
  })
</script>
