<template>
  <VCard>
    <VSpinner
      v-if="store.catalog.isLoading"
      logo-class="w-8 h-8"
      legend=""
    />
    <VCardHeader class="flex justify-between">
      <h2 class="text-md">Stats</h2>
      <PanelDropdown panel-key="taxonomy" />
    </VCardHeader>
    <VCardContent class="text-sm">
      <VTable>
        <VTableHeader>
          <VTableHeaderRow>
            <VTableHeaderCell class="bg-base-foreground" />
            <VTableHeaderCell title="OTUs linked to valid protonyms">
              Taxa
            </VTableHeaderCell>
            <VTableHeaderCell
              title="Taxon names"
              class="border-l border-base-border"
            >
              Names
            </VTableHeaderCell>
            <VTableHeaderCell
              colspan="2"
              class="bg-base-foreground"
            />
          </VTableHeaderRow>
          <VTableHeaderRow>
            <VTableHeaderCell>Rank</VTableHeaderCell>
            <VTableHeaderCell title="OTUs linked to valid protonyms"
              >Total</VTableHeaderCell
            >
            <VTableHeaderCell
              title="Taxon names"
              class="border-l border-base-border"
            >
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
import { useOtuStore } from '@/modules/otus/store/store'
import PanelDropdown from '../PanelDropdown.vue'

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
