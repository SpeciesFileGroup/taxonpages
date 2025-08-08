<template>
  <VCard>
    <VSpinner
      v-if="store.catalog.isLoading"
      logo-class="w-8 h-8"
      legend=""
    />
    <VCardHeader class="flex justify-between">
      <h2 class="text-md">Stats</h2>
      <PanelDropdown
        panel-key="taxonomy"
        :menu-options="menuOptions"
      />
    </VCardHeader>
    <VCardContent class="text-sm overflow-auto">
      <VTable>
        <VTableHeader>
          <VTableHeaderRow>
            <VTableHeaderCell class="bg-base-foreground" />
            <VTableHeaderCell
              v-if="isAdvancedView"
              title="OTUs linked to valid protonyms"
            >
              Taxa
            </VTableHeaderCell>
            <VTableHeaderCell
              title="Taxon names"
              class="border-l border-r border-base-border"
              colspan="2"
            >
              Valid names
            </VTableHeaderCell>
            <VTableHeaderCell
              colspan="3"
              class="bg-base-foreground"
            />
          </VTableHeaderRow>
          <VTableHeaderRow>
            <VTableHeaderCell>Rank</VTableHeaderCell>
            <VTableHeaderCell
              v-if="isAdvancedView"
              title="OTUs linked to valid protonyms"
              >Total</VTableHeaderCell
            >

            <VTableHeaderCell class="border-l border-base-border"
              >Extant</VTableHeaderCell
            >
            <VTableHeaderCell>Fossil</VTableHeaderCell>
            <VTableHeaderCell class="border-l border-base-border"
              >Invalid</VTableHeaderCell
            >
            <VTableHeaderCell
              title="Taxon names"
              class="border-l border-base-border"
            >
              Total
            </VTableHeaderCell>
          </VTableHeaderRow>
        </VTableHeader>
        <VTableBody>
          <VTableBodyRow
            v-for="{ rank, taxa, names } in store.catalog.stats"
            :key="rank"
          >
            <VTableBodyCell class="capitalize">{{ rank }}</VTableBodyCell>
            <VTableBodyCell v-if="isAdvancedView">{{ taxa }}</VTableBodyCell>

            <VTableBodyCell class="border-l border-base-border">{{
              names.valid_extant
            }}</VTableBodyCell>
            <VTableBodyCell>{{ names.valid_fossil }}</VTableBodyCell>
            <VTableBodyCell class="border-l border-base-border">{{
              names.invalid
            }}</VTableBodyCell>
            <VTableBodyCell class="border-l border-base-border">{{
              names.invalid + names.valid
            }}</VTableBodyCell>
          </VTableBodyRow>
        </VTableBody>
      </VTable>
    </VCardContent>
  </VCard>
</template>

<script setup>
import { computed, ref } from 'vue'
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
const isAdvancedView = ref(false)

const menuOptions = computed(() => [
  {
    label: isAdvancedView.value ? 'Hide taxa' : 'Show taxa',
    action: () => (isAdvancedView.value = !isAdvancedView.value)
  }
])
</script>
