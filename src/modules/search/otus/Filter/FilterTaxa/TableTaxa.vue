<template>
  <VTable>
    <VTableHeader>
      <VTableHeaderRow>
        <VTableHeaderCell>Name</VTableHeaderCell>
        <VTableHeaderCell />
      </VTableHeaderRow>
    </VTableHeader>

    <VTableBody>
      <VTableBodyRow
        v-for="(item, index) in list"
        :key="item.id"
      >
        <VTableBodyCell v-html="item.label_html" />
        <VTableBodyCell>
          <VButton
            secondary
            @click="() => emit('remove', index)"
          >
            <IconTrash class="w-4 h-4" />
          </VButton>
        </VTableBodyCell>
      </VTableBodyRow>
    </VTableBody>
  </VTable>
</template>

<script setup>
import VTable from '@/components/Table/VTable.vue'
import VTableBody from '@/components/Table/VTableBody.vue'
import VTableBodyCell from '@/components/Table/VTableBodyCell.vue'
import VTableBodyRow from '@/components/Table/VTableBodyRow.vue'
import VTableHeader from '@/components/Table/VTableHeader.vue'
import VTableHeaderCell from '@/components/Table/VTableHeaderCell.vue'
import VTableHeaderRow from '@/components/Table/VTableHeaderRow.vue'

defineProps({
  list: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['remove'])
</script>
