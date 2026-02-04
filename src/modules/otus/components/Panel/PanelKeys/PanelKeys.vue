<template>
  <VCard v-if="count">
    <VCardHeader>Keys ({{ count }})</VCardHeader>
    <VCardContent>
      <template
        v-for="(group, key) in keys"
        :key="key"
      >
        <div v-if="[...group.matrices, ...group.leads].length">
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
                v-for="{ id, name, is_media } in group.matrices"
                :key="id"
              >
                <VTableBodyCell>
                  <RouterLink
                    :to="{
                      name: is_media
                        ? 'image-matrices-id'
                        : 'interactive-keys-id',
                      params: { id }
                    }"
                    v-text="name"
                  />
                </VTableBodyCell>
              </VTableBodyRow>
              <VTableBodyRow
                v-for="{ text, id } in group.leads"
                :key="id"
              >
                <VTableBodyCell>
                  <RouterLink
                    :to="{ name: 'keys-id', params: { id } }"
                    v-text="text"
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
    [...Object.values(keys.value.to), ...Object.values(keys.value.in)].flat()
      .length
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
