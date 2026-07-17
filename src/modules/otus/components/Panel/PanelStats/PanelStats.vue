<template>
  <VCard>
    <VSpinner
      v-if="store.catalog.isLoading"
      logo-class="w-8 h-8"
      legend=""
    />
    <VCardHeader class="flex justify-between">
      <h2 class="text-md">{{ $t('panel.stats.title') }}</h2>
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
          {{ $t('panel.stats.caption') }}
        </caption>

        <VTableHeader>
          <VTableHeaderRow>
            <VTableHeaderCell scope="col">
              {{ $t('panel.stats.taxon') }}
            </VTableHeaderCell>
            <VTableHeaderCell
              v-if="isAdvancedView"
              scope="col"
              :title="$t('panel.stats.otus_linked')"
            >
              {{ $t('panel.stats.taxa') }}
            </VTableHeaderCell>

            <VTableHeaderCell
              :title="$t('panel.stats.taxon_names')"
              class="border-l border-r border-base-border"
              colspan="2"
              scope="colgroup"
            >
              {{ $t('panel.stats.valid_names') }}
            </VTableHeaderCell>

            <VTableHeaderCell
              colspan="3"
              scope="colgroup"
              class="bg-base-foreground"
              aria-hidden="true"
            />
          </VTableHeaderRow>

          <VTableHeaderRow>
            <VTableHeaderCell scope="col">
              {{ $t('panel.stats.rank') }}
            </VTableHeaderCell>
            <VTableHeaderCell
              v-if="isAdvancedView"
              :title="$t('panel.stats.otus_linked')"
              scope="col"
            >
              {{ $t('common.total') }}
            </VTableHeaderCell>
            <VTableHeaderCell
              class="border-l border-base-border"
              scope="col"
            >
              {{ $t('panel.stats.extant') }}
            </VTableHeaderCell>
            <VTableHeaderCell scope="col">
              {{ $t('panel.stats.fossil') }}
            </VTableHeaderCell>
            <VTableHeaderCell
              class="border-l border-base-border"
              scope="col"
            >
              {{ $t('panel.stats.invalid') }}
            </VTableHeaderCell>

            <VTableHeaderCell
              :title="$t('panel.stats.taxon_names')"
              class="border-l border-base-border"
              scope="col"
            >
              {{ $t('common.total') }}
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
import { useI18n } from 'vue-i18n'
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

const { t } = useI18n()
const store = useOtuStore()
const isAdvancedView = ref(false)

const menuOptions = computed(() => [
  {
    label: isAdvancedView.value
      ? t('panel.stats.hide_taxa')
      : t('panel.stats.show_taxa'),
    action: () => (isAdvancedView.value = !isAdvancedView.value)
  }
])
</script>
