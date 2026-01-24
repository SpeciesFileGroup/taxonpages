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
    <VCardContent
      class="text-sm overflow-auto"
      tabindex="0"
    >
      <VTable>
        <caption class="sr-only">
          Summary of taxonomic names by rank, showing valid extant names, fossil
          names, invalid names, and total counts.
        </caption>

        <VTableHeader>
          <VTableHeaderRow>
            <VTableHeaderCell scope="col"> Taxon </VTableHeaderCell>
            <VTableHeaderCell
              v-if="isAdvancedView"
              scope="col"
              title="OTUs linked to valid protonyms"
            >
              Taxa
            </VTableHeaderCell>

            <VTableHeaderCell
              title="Taxon names"
              class="border-l border-r border-base-border"
              colspan="2"
              scope="colgroup"
            >
              Valid names
            </VTableHeaderCell>

            <VTableHeaderCell
              colspan="3"
              scope="colgroup"
              class="bg-base-foreground"
              aria-hidden="true"
            />
          </VTableHeaderRow>

          <VTableHeaderRow>
            <VTableHeaderCell scope="col"> Rank </VTableHeaderCell>
            <VTableHeaderCell
              v-if="isAdvancedView"
              title="OTUs linked to valid protonyms"
              scope="col"
            >
              Total
            </VTableHeaderCell>
            <VTableHeaderCell
              class="border-l border-base-border"
              scope="col"
            >
              Extant
            </VTableHeaderCell>
            <VTableHeaderCell scope="col"> Fossil </VTableHeaderCell>
            <VTableHeaderCell
              class="border-l border-base-border"
              scope="col"
            >
              Invalid
            </VTableHeaderCell>

            <VTableHeaderCell
              title="Taxon names"
              class="border-l border-base-border"
              scope="col"
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
            <VTableHeaderCell
              class="capitalize"
              scope="row"
            >
              {{ rank }}
            </VTableHeaderCell>

            <VTableBodyCell v-if="isAdvancedView">
              {{ taxa }}
            </VTableBodyCell>

            <VTableBodyCell class="border-l border-base-border">
              {{ names.valid_extant }}
            </VTableBodyCell>

            <VTableBodyCell>
              {{ names.valid_fossil }}
            </VTableBodyCell>

            <VTableBodyCell class="border-l border-base-border">
              {{ names.invalid }}
            </VTableBodyCell>

            <VTableBodyCell class="border-l border-base-border">
              {{ names.invalid + names.valid }}
            </VTableBodyCell>
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
