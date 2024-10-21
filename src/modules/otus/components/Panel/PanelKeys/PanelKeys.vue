<template>
  <VCard v-if="count">
    <VCardHeader>Keys ({{ count }})</VCardHeader>
    <VCardContent>
      <template
        v-for="(group, key) in observationMatrices"
        :key="key"
      >
        <div v-if="Object.keys(group).length">
          <VTable>
            <VTableHeader>
              <VTableHeaderRow>
                <VTableHeaderCell>
                  {{ key }}
                </VTableHeaderCell>
              </VTableHeaderRow>
            </VTableHeader>
            <VTableBody>
              <VTableBodyRow v-for="(label, id) in group">
                <VTableBodyCell>
                  <RouterLink
                    :to="{ name: 'interactive-keys-id', params: { id } }"
                    v-text="label"
                  />
                </VTableBodyCell>
              </VTableBodyRow>
            </VTableBody>
          </VTable>
        </div>
      </template>
    </VCardContent>
  </VCard>
</template>

<script setup>
import TaxonWorks from '../../../services/TaxonWorks.js'
import { useOtuPageRequest } from '../../../helpers/useOtuPageRequest.js'
import { onMounted, onBeforeUnmount, ref, computed } from 'vue'

const props = defineProps({
  otuId: {
    type: Number
  }
})

const controller = new AbortController()
const observationMatrices = ref({
  to: {},
  in: {}
})

const count = computed(
  () =>
    []
      .concat(...Object.values(observationMatrices.value))
      .filter((item) => Object.keys(item).length).length
)

onMounted(() => {
  const params = {
    otu_id: props.otuId
  }

  useOtuPageRequest('panel keys', () =>
    TaxonWorks.getKeys(props.otuId, { signal: controller.signal, params })
  )
    .then(({ data }) => {
      observationMatrices.value = {
        to: data.observation_matrices.scoped,
        in: data.observation_matrices.in
      }
    })
    .catch(() => {})
})

onBeforeUnmount(() => {
  controller?.abort()
})
</script>
