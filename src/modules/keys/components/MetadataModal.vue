<template>
  <VButton
    primary
    class="!px-1 py-1 rounded-full"
    title="Metadata"
    @click="isModalVisible = true"
  >
    <IconInformation class="w-4 h-4" />
  </VButton>
  <VModal
    v-if="isModalVisible"
    @close="() => (isModalVisible = false)"
  >
    <template #header>
      <h3 class="font-medium">Metadata</h3>
    </template>
    <div class="p-4 pt-0">
      <VTable>
        <VTableHeader>
          <VTableHeaderRow>
            <VTableHeaderCell>Data</VTableHeaderCell>
            <VTableHeaderCell></VTableHeaderCell>
          </VTableHeaderRow>
        </VTableHeader>
        <VTableBody>
          <VTableBodyRow
            v-for="[key, value] in Object.entries(metadata)"
            :key="key"
          >
            <VTableBodyCell class="capitalize">
              {{ key.replaceAll('_', ' ') }}
            </VTableBodyCell>
            <VTableBodyCell>{{ value }}</VTableBodyCell>
          </VTableBodyRow>
        </VTableBody>
      </VTable>
    </div>
  </VModal>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  metadata: {
    type: Object,
    required: true
  }
})

const isModalVisible = ref(false)
</script>
