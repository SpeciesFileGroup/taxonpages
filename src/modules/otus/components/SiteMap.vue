<template>
  <div>
    <VButton
      primary
      class="text-sm md:flex items-center gap-1 hidden"
      title="Links used to obtain the information present on this page in JSON format."
      @click="isModalVisible = true"
    >
      <IconJson class="w-4 h-4" />
      Sitemap
    </VButton>
    <VModal
      v-if="isModalVisible"
      @close="isModalVisible = false"
    >
      <template #header>
        <h3 class="font-medium">Sitemap</h3>
      </template>
      <div class="p-4 pt-0">
        <p class="text-sm mb-2">
          The following links provide the information present on this page in
          JSON format.
        </p>

        <VTable>
          <VTableHeader>
            <VTableHeaderRow>
              <VTableHeaderCell> Request Key </VTableHeaderCell>
              <VTableHeaderCell> URL </VTableHeaderCell>
            </VTableHeaderRow>
          </VTableHeader>
          <VTableBody>
            <VTableBodyRow
              v-for="(item, key) in store.sitemap"
              :key="key"
            >
              <VTableBodyCell class="capitalize">{{
                key.replaceAll(':', ' ')
              }}</VTableBodyCell>
              <VTableBodyCell
                ><a :href="item">{{ item }}</a></VTableBodyCell
              >
            </VTableBodyRow>
          </VTableBody>
        </VTable>
      </div>
    </VModal>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useOtuPageRequestStore } from '../store/request'

const isModalVisible = ref(false)
const store = useOtuPageRequestStore()
</script>
