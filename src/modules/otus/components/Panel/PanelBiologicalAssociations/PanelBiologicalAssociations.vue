<template>
  <VCard>
    <ClientOnly>
      <VSpinner v-if="isLoading" />
    </ClientOnly>
    <VCardHeader> Biological associations </VCardHeader>
    <VCardContent class="min-h-[6rem]">
      <VTable v-if="biologicalAssociations.length">
        <VTableHeader class="normal-case">
          <VTableHeaderRow>
            <VTableHeaderCell
              class="border-r"
              colspan="4"
              >Subject</VTableHeaderCell
            >
            <VTableHeaderCell> </VTableHeaderCell>
            <VTableHeaderCell
              class="border-r"
              colspan="2"
            >
              Biological
            </VTableHeaderCell>
            <VTableHeaderCell
              class="border-r"
              colspan="4"
              >Object</VTableHeaderCell
            >
          </VTableHeaderRow>
          <VTableHeaderRow>
            <VTableHeaderCell>Order</VTableHeaderCell>
            <VTableHeaderCell>Family</VTableHeaderCell>
            <VTableHeaderCell>Genus</VTableHeaderCell>
            <VTableHeaderCell>Label</VTableHeaderCell>
            <VTableHeaderCell class="border-l">Properties</VTableHeaderCell>
            <VTableHeaderCell>Relationship</VTableHeaderCell>
            <VTableHeaderCell class="border-r">Properties</VTableHeaderCell>
            <VTableHeaderCell>Order</VTableHeaderCell>
            <VTableHeaderCell>Family</VTableHeaderCell>
            <VTableHeaderCell>Genus</VTableHeaderCell>
            <VTableHeaderCell>Label</VTableHeaderCell>
          </VTableHeaderRow>
        </VTableHeader>
        <VTableBody>
          <VTableBodyRow
            v-for="ba in biologicalAssociations"
            :key="ba.id"
          >
            <VTableBodyCell> {{ ba.subjectOrder }}</VTableBodyCell>
            <VTableBodyCell> {{ ba.subjectFamily }}</VTableBodyCell>
            <VTableBodyCell> {{ ba.subjectGenus }}</VTableBodyCell>
            <VTableBodyCell class="border-r">
              {{ ba.subjectLabel }}</VTableBodyCell
            >
            <VTableBodyCell> {{ ba.biologicalPropertySubject }}</VTableBodyCell>
            <VTableBodyCell> {{ ba.biologicalRelationship }}</VTableBodyCell>
            <VTableBodyCell class="border-r">
              {{ ba.biologicalPropertyObject }}</VTableBodyCell
            >
            <VTableBodyCell> {{ ba.objectOrder }}</VTableBodyCell>
            <VTableBodyCell> {{ ba.objectFamily }}</VTableBodyCell>
            <VTableBodyCell> {{ ba.objectGenus }}</VTableBodyCell>
            <VTableBodyCell> {{ ba.objectLabel }}</VTableBodyCell>
          </VTableBodyRow>
        </VTableBody>
      </VTable>
      <div
        v-if="!isLoading && !biologicalAssociations.length"
        class="text-xl text-center my-8 w-full"
      >
        No records found.
      </div>
    </VCardContent>
  </VCard>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { makeAPIRequest } from '@/utils'
import { useOtuPageRequest } from '@/modules/otus/helpers/useOtuPageRequest.js'
import { makeBiologicalAssociation } from './utils/makeBiologicalAssociation.js'

const extend = [
  'object',
  'subject',
  'biological_relationship',
  'taxonomy',
  'biological_relationship_types'
]

const biologicalAssociations = ref([])
const isLoading = ref(false)

const props = defineProps({
  otuId: {
    type: Number,
    required: true
  }
})

onMounted(() => {
  isLoading.value = true

  useOtuPageRequest('panel:biological-associations', () =>
    makeAPIRequest.get('/biological_associations', {
      params: {
        otu_id: [props.otuId],
        extend
      }
    })
  )
    .then(async ({ data }) => {
      const items = data.map(makeBiologicalAssociation)

      if (data.length) {
        const ids = data.map((d) => d.id)

        const response = await makeAPIRequest.get('/citations', {
          params: {
            citation_object_id: ids,
            citation_object_type: 'BiologicalAssociation'
          }
        })

        items.forEach((item) => {
          item.citations = response.data.filter(
            (c) => c.citation_object_id === item.id
          )
        })
      }

      isLoading.value = false
      biologicalAssociations.value = items
    })
    .catch(() => {
      isLoading.value = false
    })
})
</script>
