<template>
  <VButton
    size="xs"
    circle
    :title="$t('keys.metadata')"
    @click="isModalVisible = true"
  >
    <IconInformation class="w-4 h-4" />
  </VButton>
  <VModal
    v-if="isModalVisible"
    @close="() => (isModalVisible = false)"
  >
    <template #header>
      <h3 class="font-medium">{{ $t('keys.metadata') }}</h3>
    </template>
    <div class="p-4 pt-0">
      <VTable>
        <VTableHeader>
          <VTableHeaderRow>
            <VTableHeaderCell>{{ $t('keys.data') }}</VTableHeaderCell>
            <VTableHeaderCell></VTableHeaderCell>
          </VTableHeaderRow>
        </VTableHeader>
        <VTableBody>
          <VTableBodyRow
            v-for="[key, value] in metadataEntries"
            :key="key"
          >
            <VTableBodyCell class="capitalize">
              {{ key.replaceAll(/([a-z])([A-Z])/g, '$1 $2') }}
            </VTableBodyCell>
            <VTableBodyCell>{{ value }}</VTableBodyCell>
          </VTableBodyRow>
        </VTableBody>
      </VTable>
    </div>
  </VModal>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  metadata: {
    type: Object,
    required: true
  }
})

const isModalVisible = ref(false)

const metadataEntries = computed(() => {
  const data = { ...props.metadata }

  delete data.source

  return Object.entries(data)
})
</script>
