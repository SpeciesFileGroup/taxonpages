<template>
  <VButton
    class="left-2 bottom-2 !px-2 py-2 rounded-full absolute z-[1500]"
    primary
    @click="isModalVisible = true"
  >
    <IconCheck
      v-if="cachedMap.synced"
      class="w-4 h-4"
    />
    <IconWarning
      v-else
      class="w-4 h-4"
    />
  </VButton>
  <VModal
    v-if="isModalVisible"
    @close="() => (isModalVisible = false)"
  >
    <template #header>
      <h3>Cached map</h3>
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
          <VTableBodyRow>
            <VTableBodyCell> Is synced </VTableBodyCell>
            <VTableBodyCell>
              <p
                class="text-success flex text-sm items-center"
                v-if="cachedMap.synced"
              >
                <IconCheck class="w-4 h-4" />
                <span class="ml-1">Map is synchronized</span>
              </p>
              <p
                class="text-warning flex text-sm items-center"
                v-else
              >
                <IconWarning class="w-4 h-4" />
                <span class="ml-1">Map is not synchronized</span>
              </p>
            </VTableBodyCell>
          </VTableBodyRow>
          <VTableBodyRow>
            <VTableBodyCell> Last update </VTableBodyCell>
            <VTableBodyCell>
              {{ new Date(cachedMap.updated_at) }}
            </VTableBodyCell>
          </VTableBodyRow>
        </VTableBody>
        <VTableHeader>
          <VTableHeaderRow>
            <VTableHeaderCell>Source</VTableHeaderCell>
            <VTableHeaderCell>Total</VTableHeaderCell>
          </VTableHeaderRow>
        </VTableHeader>
        <VTableBody>
          <VTableBodyRow
            v-for="(value, key) in cachedMap.source_scope"
            :key="key"
          >
            <VTableBodyCell class="capitalize">
              {{ key.replaceAll('_', ' ') }}
            </VTableBodyCell>
            <VTableBodyCell>
              {{ value }}
            </VTableBodyCell>
          </VTableBodyRow>
        </VTableBody>
      </VTable>
    </div>
  </VModal>
</template>
<script setup>
import { ref } from 'vue'

defineProps({
  cachedMap: {
    type: Object,
    required: true
  }
})

const isModalVisible = ref(false)
</script>

<style>
.cached-map-icon {
  right: 20px;
  top: 20px;
  z-index: 1098;
}
</style>
