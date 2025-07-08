<template>
  <VTable>
    <VTableHeader>
      <VTableHeaderRow>
        <VTableHeaderCell> Descriptor </VTableHeaderCell>
        <VTableHeaderCell> </VTableHeaderCell>
      </VTableHeaderRow>
    </VTableHeader>
    <VTableBody>
      <VTableBodyRow
        v-for="observation in observations"
        :key="observation.id"
      >
        <VTableBodyCell
          class="font-bold text-nowrap"
          v-html="observation.descriptorName"
        />
        <VTableBodyCell v-html="observation.value" />
      </VTableBodyRow>
    </VTableBody>
  </VTable>
</template>

<script setup>
const props = defineProps({
  observations: {
    type: Array,
    required: true
  }
})
</script>
