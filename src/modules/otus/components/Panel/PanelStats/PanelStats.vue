<template>
  <VCard>
    <VCardHeader class="flex justify-between">
      <h2 class="text-md">Stats</h2>
    </VCardHeader>
    <VCardContent class="text-sm">
      <VTable>
        <VTableHeader>
          <VTableHeaderRow>
            <VTableHeaderCell class="bg-base-foreground" />
            <VTableHeaderCell>Taxa</VTableHeaderCell>
            <VTableHeaderCell class="border-l border-base-border"
              >Names</VTableHeaderCell
            >
            <VTableHeaderCell
              colspan="2"
              class="bg-base-foreground"
            />
          </VTableHeaderRow>
          <VTableHeaderRow>
            <VTableHeaderCell>Rank</VTableHeaderCell>
            <VTableHeaderCell>Total</VTableHeaderCell>
            <VTableHeaderCell class="border-l border-base-border">
              Total
            </VTableHeaderCell>
            <VTableHeaderCell> Valid </VTableHeaderCell>
            <VTableHeaderCell> Invalid </VTableHeaderCell>
          </VTableHeaderRow>
        </VTableHeader>
        <VTableBody>
          <VTableBodyRow
            v-for="(value, rank) in store.catalog.stats.taxa"
            :key="rank"
          >
            <VTableBodyCell class="capitalize">{{ rank }}</VTableBodyCell>
            <VTableBodyCell>{{ value }}</VTableBodyCell>

            <VTableBodyCell class="border-l border-base-border">{{
              store.catalog.stats.names[rank].invalid +
              store.catalog.stats.names[rank].valid
            }}</VTableBodyCell>
            <VTableBodyCell>{{
              store.catalog.stats.names[rank].valid
            }}</VTableBodyCell>
            <VTableBodyCell>{{
              store.catalog.stats.names[rank].invalid
            }}</VTableBodyCell>
          </VTableBodyRow>
        </VTableBody>
      </VTable>
    </VCardContent>
  </VCard>
</template>

<script setup>
import VTableHeaderCellGlobal from '@/components/Table/VTableHeaderCell.global.vue'
import { useOtuStore } from '@/modules/otus/store/store'

const props = defineProps({
  otuId: {
    type: [Number, String],
    required: true
  },

  taxonId: {
    type: [Number, String],
    required: true
  },

  taxon: {
    type: Object,
    default: undefined
  },

  otu: {
    type: Object,
    default: undefined
  }
})

const store = useOtuStore()
</script>
