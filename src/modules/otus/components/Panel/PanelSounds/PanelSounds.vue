<template>
  <VCard v-if="sounds.length">
    <VCardHeader class="flex justify-between">
      <h2 class="text-md">Sounds ({{ sounds.length }})</h2>
    </VCardHeader>
    <ul>
      <PanelSoundRow
        v-for="sound in sounds"
        :key="sound.id"
        :sound="sound"
      />
    </ul>
  </VCard>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useOtuPageRequest } from '../../../helpers/useOtuPageRequest'
import TaxonWorks from '../../../services/TaxonWorks'
import PanelSoundRow from './PanelSoundRow.vue'

const props = defineProps({
  otuId: {
    type: [String, Number],
    required: true
  }
})

const sounds = ref([])

onMounted(() => {
  useOtuPageRequest('panel:sounds', () =>
    TaxonWorks.getSounds({
      otu_id: props.otuId,
      otu_scope: ['field_occurrences', 'otus', 'collection_objects'],
      extend: ['attribution', 'conveyances']
    })
  ).then(({ data }) => {
    sounds.value = data
  })
})
</script>
