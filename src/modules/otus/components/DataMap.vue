<template>
  <div>
    <VButton
      class="md:block hidden"
      size="sm"
      :title="$t('otus.datamap.button_title')"
      @click="isModalVisible = true"
    >
      <IconJson class="w-4 h-4" />
    </VButton>
    <VModal
      v-if="isModalVisible"
      @close="isModalVisible = false"
    >
      <template #header>
        <h3 class="font-medium">{{ $t('otus.datamap.title') }}</h3>
      </template>
      <div class="p-4 pt-0">
        <p class="text-sm mb-2">
          {{ $t('otus.datamap.description') }}
        </p>

        <VTable>
          <VTableHeader>
            <VTableHeaderRow>
              <VTableHeaderCell>
                {{ $t('otus.datamap.request_key') }}
              </VTableHeaderCell>
              <VTableHeaderCell>{{ $t('otus.datamap.url') }}</VTableHeaderCell>
            </VTableHeaderRow>
          </VTableHeader>
          <VTableBody>
            <VTableBodyRow
              v-for="(item, key) in store.datamap"
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
