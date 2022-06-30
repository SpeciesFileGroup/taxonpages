<template>
  <VCard>
    <VCardHeader>
      <h1 class="text-md">
        Nomenclature citations
      </h1>
    </VCardHeader>
    <VCardContent>
      <ul class="text-sm">
        <CitationRow
          v-for="citation in citations"
          :key="citation.id"
          :citation="citation"
        />
      </ul>
    </VCardContent>
  </VCard>
</template>

<script setup>
import { ref, watch } from 'vue'
import CitationRow from './CitationRow.vue'
import OtuService from '../../services/OtuService'

const props = defineProps({
  otuId: {
    type: [Number, String],
    required: true
  }
})

const citations = ref([])

watch(() => props.otuId, async () => {
  if (!props.otuId) { return }

  citations.value = (await OtuService.getTaxonNameCitations(props.otuId)).data
}, { immediate: true })

</script>
