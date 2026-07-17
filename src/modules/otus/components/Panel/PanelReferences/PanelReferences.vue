<template>
  <VCard>
    <VSpinner
      v-if="isLoading"
      logo-class="w-8 h-8"
      legend=""
    />
    <VCardHeader class="flex justify-between">
      <h2 class="text-md">{{ panelTitle }} ({{ list.length }})</h2>
      <PanelDropdown
        :menu-options="menuOptions"
        panel-key="panel:citations"
      />
    </VCardHeader>
    <ul class="text-sm">
      <CitationRow
        v-for="reference in citationList.first"
        :key="reference.id"
        :reference="reference"
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
          v-for="reference in citationList.middle"
          :key="reference.id"
          :reference="reference"
        />
      </ul>
    </AnimationOpacity>
    <ul class="text-sm">
      <CitationRow
        v-for="reference in citationList.last"
        :key="reference.id"
        :reference="reference"
      />
    </ul>
  </VCard>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
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
  },

  // Left undefined so the translated default applies. A title supplied by
  // taxa_page.yml (`bind: { title: ... }`) still wins over it.
  title: {
    type: String,
    default: undefined
  }
})

const { t } = useI18n()
const isLoading = ref(false)
const list = ref([])
const showAll = ref(false)
const citationList = computed(() => splitList(list.value, MAX_CITATIONS))

const panelTitle = computed(
  () => props.title ?? t('panel.references_cited.title')
)

const menuOptions = computed(() => [
  {
    label: showAll.value ? t('otus.show_less') : t('otus.show_all_menu'),
    action: () => (showAll.value = !showAll.value)
  }
])

function makeCitationList(items) {
  const citations = items.flatMap((item) => item.citations)
  const references = new Map()

  for (const citation of citations) {
    const sourceId = citation.source.id

    if (!references.has(sourceId)) {
      references.set(sourceId, {
        id: sourceId,
        source: citation.source,
        citations: []
      })
    }

    references.get(sourceId).citations.push(citation)
  }

  return [...references.values()]
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
