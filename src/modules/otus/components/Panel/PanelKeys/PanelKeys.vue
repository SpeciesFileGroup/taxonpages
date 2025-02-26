<template>
  <VCard v-if="count">
    <VCardHeader>Keys ({{ count }})</VCardHeader>
    <VCardContent>
      <template
        v-for="(group, key) in keys"
        :key="key"
      >
        <div
          v-if="
            [...Object.keys(group.matrices), ...Object.keys(group.leads)].length
          "
        >
          <VTable>
            <VTableHeader>
              <VTableHeaderRow>
                <VTableHeaderCell>
                  {{ key }}
                </VTableHeaderCell>
              </VTableHeaderRow>
            </VTableHeader>
            <VTableBody>
              <VTableBodyRow
                v-for="(label, id) in group.matrices"
                :key="id"
              >
                <VTableBodyCell>
                  <RouterLink
                    :to="{ name: 'interactive-keys-id', params: { id } }"
                    v-text="label"
                  />
                </VTableBodyCell>
              </VTableBodyRow>
              <VTableBodyRow
                v-for="(label, id) in group.leads"
                :key="id"
              >
                <VTableBodyCell>
                  <RouterLink
                    :to="{ name: 'keys-id', params: { id } }"
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
const keys = ref({
  to: {},
  in: {}
})

const count = computed(
  () =>
    []
      .concat(...Object.values(keys.value.to), ...Object.values(keys.value.in))
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
      keys.value = {
        to: {
          matrices: data.observation_matrices.scoped,
          leads: data.leads.scoped
        },
        in: {
          matrices: data.observation_matrices.in,
          leads: data.leads.in
        }
      }
    })
    .catch(() => {})
})

onBeforeUnmount(() => {
  controller?.abort()
})
</script>
