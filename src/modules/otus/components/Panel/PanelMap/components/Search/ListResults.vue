<template>
  <VTable
    v-if="list.length"
    class="shadow-md"
  >
    <VTableHeader>
      <VTableHeaderRow>
        <VTableHeaderCell
          class="w-full flex justify-between box-border items-center"
        >
          <span>OTU ({{ list.length }})</span>
          <IconArrowRight
            class="opacity-50 cursor-pointer w-4 h-4"
            @click="emit('close:table')"
          />
        </VTableHeaderCell>
      </VTableHeaderRow>
    </VTableHeader>
    <VTableBody>
      <VTableBodyRow
        v-for="otu in list"
        :key="otu.id"
      >
        <VTableBodyCell>
          <RouterLink
            v-html="otu.object_tag"
            :to="{ name: 'otus-id', params: { id: otu.id } }"
            @click="() => emit('close')"
          />
        </VTableBodyCell>
      </VTableBodyRow>
    </VTableBody>
  </VTable>
  <div
    v-else
    class="text-lg text-center text-base-lighter align-middle p-4"
  >
    No OTUs found in this area
  </div>
</template>

<script setup>
const props = defineProps({
  list: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'close:table'])
</script>
