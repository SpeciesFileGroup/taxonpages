<template>
  <VCard>
    <VSpinner
      v-if="isLoading"
      logo-class="w-8 h-8"
      legend=""
    />
    <VCardHeader class="flex justify-between">
      <h2 class="text-md">References cited ({{ list.length }})</h2>
      <PanelDropdown
        :menu-options="menuOptions"
        panel-key="taxonomy"
      />
    </VCardHeader>
    <ul class="text-sm">
      <CitationRow
        v-for="citation in citationList.first"
        :key="citation.id"
        :citation="citation"
      />

      <ShowMore
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
          :key="citation.id"
          :citation="citation"
        />
      </ul>
    </AnimationOpacity>
    <ul class="text-sm">
      <CitationRow
        v-for="citation in citationList.last"
        :key="citation.id"
        :citation="citation"
      />
    </ul>
  </VCard>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { splitList } from '../PanelNomenclature/splitList'
import CitationRow from './components/PanelCitationsRow.vue'
import ShowMore from '../PanelNomenclature/PanelNomenclatureShowMore.vue'

import PanelDropdown from '../PanelDropdown.vue'
import TaxonWorks from '@/modules/otus/services/TaxonWorks'
import { useOtuPageRequest } from '@/modules/otus/helpers/useOtuPageRequest'

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

const isLoading = ref(false)
const list = ref([])
const showAll = ref(false)
const citationList = computed(() => splitList(list.value, MAX_CITATIONS))

const menuOptions = computed(() => [
  {
    label: showAll.value ? 'Show less' : 'Show all',
    action: () => (showAll.value = !showAll.value)
  }
])

function makeCitationList(items) {
  const citations = items.map((item) => item.citations).flat()

  return citations
}

onMounted(() => {
  isLoading.value = true
  useOtuPageRequest('panel:citations', () =>
    TaxonWorks.getOtuCitations(props.otuId)
  )
    .then(({ data }) => {
      list.value = makeCitationList(data).sort(
        (a, b) => (a.source?.year ?? 0) - (b.source?.year ?? 0)
      )
    })
    .finally(() => {
      isLoading.value = false
    })
})
</script>
