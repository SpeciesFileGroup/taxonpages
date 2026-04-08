<template>
  <VModal>
    <template #header>
      <h3 class="font-medium text-sm text-base-content">
        <span class="text-base">Citations</span>
        &mdash;
        {{ biologicalAssociation.objectLabel }}
        <span class="text-base-soft italic">{{
          biologicalAssociation.biologicalRelationship
        }}</span>
        {{ biologicalAssociation.subjectLabel }}
      </h3>
    </template>
    <div class="px-4 pb-4">
      <div
        v-if="isLoading"
        class="min-h-42"
      >
        <VSpinner />
      </div>
      <VTable v-else>
        <VTableHeader>
          <VTableHeaderRow>
            <VTableHeaderCell>Reference</VTableHeaderCell>
            <VTableHeaderCell>Pages</VTableHeaderCell>
          </VTableHeaderRow>
        </VTableHeader>
        <VTableBody>
          <VTableBodyRow
            v-for="citation in citations"
            :key="citation.id"
          >
            <VTableBodyCell
              v-html="sanitizeAndLinkifyHtml(citation.source.cached)"
            />
            <VTableBodyCell>
              {{ citation.pages }}
            </VTableBodyCell>
          </VTableBodyRow>
        </VTableBody>
      </VTable>
    </div>
  </VModal>
</template>

<script setup>
import { makeAPIRequest, sanitizeAndLinkifyHtml } from '@/utils'
import { ref, onBeforeMount } from 'vue'

const props = defineProps({
  biologicalAssociation: {
    type: Object,
    required: true
  }
})

const citations = ref([])
const isLoading = ref(true)

onBeforeMount(async () => {
  try {
    const response = await makeAPIRequest.get('/citations', {
      params: {
        citation_object_id: props.biologicalAssociation.id,
        citation_object_type: 'BiologicalAssociation',
        extend: ['source', 'citation_topics']
      }
    })

    citations.value = response.data
  } catch (error) {
    console.error('Error fetching citations:', error)
  } finally {
    isLoading.value = false
  }
})
</script>
