<template>
  <VCard>
    <VCardHeader class="flex justify-between">
      <h2 class="text-md">Timeline ({{ citations.length }})</h2>
      <Dropdown :items="menuOptions">
        <template #button>
          <IconHamburger class="text-base-soft h-4" />
        </template>
      </Dropdown>
    </VCardHeader>

    <ul class="text-sm">
      <CitationRow
        v-for="citation in citationList.first"
        :key="citation.label"
        :citation="citation"
      />

      <CitationRowShowMore
        v-if="!showAll && citationList.middle.length"
        :count="citationList.middle.length"
        @click="showAll = true"
      />
      <AnimationOpacity>
        <div v-show="showAll">
          <CitationRow
            v-for="citation in citationList.middle"
            :key="citation.label"
            :citation="citation"
          />
        </div>
      </AnimationOpacity>

      <CitationRow
        v-for="citation in citationList.last"
        :key="citation.label"
        :citation="citation"
      />
    </ul>
  </VCard>
  <VCard>
    <VCardHeader class="flex justify-between">
      <h2 class="text-md">References</h2>
    </VCardHeader>
    <ul class="text-sm">
      <PanelReferenceRow
        v-for="source in sources"
        :key="source"
        :source="source"
      />
    </ul>
  </VCard>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import TaxonWorks from '../../../services/TaxonWorks'
import CitationRow from './PanelCitationRow.vue'
import CitationRowShowMore from './PanelCitationShowMore.vue'
import PanelReferenceRow from './PanelReferenceRow.vue'

const MAX_CITATIONS = 5

const props = defineProps({
  otuId: {
    type: [Number, String],
    required: true
  },

  taxonId: {
    type: [Number, String],
    required: true
  }
})

const showAll = ref(false)
const citations = ref([])
const sources = ref([])
const citationList = computed(() => {
  const copyArr = citations.value.slice()
  const first = copyArr.splice(0, MAX_CITATIONS)
  const last = copyArr.splice(-MAX_CITATIONS)
  const middle = copyArr

  return {
    first,
    middle,
    last
  }
})

const menuOptions = computed(() => [
  {
    label: showAll.value ? 'Show less' : 'Show all',
    action: () => (showAll.value = !showAll.value)
  }
])

watch(
  () => props.taxonId,
  async () => {
    if (!props.taxonId) {
      return
    }
    const { data } = await TaxonWorks.getTaxonNameCitations(props.taxonId)

    citations.value = data.timeline
    sources.value = data.sources
  },
  { immediate: true }
)
</script>
