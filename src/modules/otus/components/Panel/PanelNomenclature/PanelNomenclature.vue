<template>
  <VCard>
    <VSpinner
      v-if="store.catalog.isLoading"
      logo-class="w-8 h-8"
      legend=""
    />
    <VCardHeader class="flex justify-between">
      <h2 class="text-md">
        Nomenclature ({{ store.catalog.timeline.length }})
      </h2>
      <PanelDropdown
        :menu-options="menuOptions"
        panel-key="taxonomy"
      />
    </VCardHeader>
    <ul class="text-sm">
      <CitationRow
        v-for="citation in citationList.first"
        :key="citation.label"
        :citation="citation"
      />

      <PanelNomenclatureShowMore
        v-if="!showAll && citationList.middle.length"
        :count="citationList.middle.length"
        @click="showAll = true"
      />
    </ul>
    <AnimationOpacity>
      <ul
        class="text-sm"
        v-show="showAll"
      >
        <CitationRow
          v-for="citation in citationList.middle"
          :key="citation.label"
          :citation="citation"
        />
      </ul>
    </AnimationOpacity>
    <ul class="text-sm">
      <CitationRow
        v-for="citation in citationList.last"
        :key="citation.label"
        :citation="citation"
      />
    </ul>
  </VCard>
</template>

<script setup>
import { ref, computed } from 'vue'
import { splitList } from './splitList'
import { useOtuStore } from '@/modules/otus/store/store'
import CitationRow from './PanelCitationRow.vue'
import PanelNomenclatureShowMore from './PanelNomenclatureShowMore.vue'
import PanelDropdown from '../PanelDropdown.vue'

const MAX_CITATIONS = 2

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

const showAll = ref(false)
const citationList = computed(() =>
  splitList(store.catalog.timeline, MAX_CITATIONS)
)

const menuOptions = computed(() => [
  {
    label: showAll.value ? 'Show less' : 'Show all',
    action: () => (showAll.value = !showAll.value)
  }
])
</script>
