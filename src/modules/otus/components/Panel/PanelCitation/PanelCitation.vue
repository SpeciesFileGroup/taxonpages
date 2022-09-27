<template>
  <VCard>
    <VCardHeader class="flex justify-between">
      <h1 class="text-md">
        Nomenclature citations
      </h1>
      <Dropdown
        :items="menuOptions"
      >
        <template #button>
          <IconHamburger class="text-base-soft h-3" />
        </template>
      </Dropdown>
    </VCardHeader>

    <div class="text-sm">
      <CitationRow
        v-for="citation in citationList.first"
        :key="citation.id"
        :citation="citation"
        ref="rowRefs"
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
            :key="citation.id"
            :citation="citation"
            ref="rowRefs"
          />
        </div>
      </AnimationOpacity>

      <CitationRow
        v-for="citation in citationList.last"
        :key="citation.id"
        :citation="citation"
        ref="rowRefs"
        class="last:border-b-0"
      />
    </div>
  </VCard>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import TaxonWorks from '../../../services/TaxonWorks'
import CitationRow from './PanelCitationRow.vue'
import CitationRowShowMore from './PanelCitationShowMore.vue'

const MAX_CITATIONS = 3

const props = defineProps({
  otuId: {
    type: [Number, String],
    required: true
  }
})

const rowRefs = ref([])
const showAll = ref(false)
const citations = ref([])
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
    label: showAll.value
      ? 'Show less'
      : 'Show all',
    action: () => showAll.value = !showAll.value
  },
  {
    label: 'Expand',
    action: () => changeRowExpandedState(true)
  },
  {
    label: 'Collapse',
    action: () => changeRowExpandedState(false)
  }
])

watch(
  () => props.otuId,
  async () => {
    if (!props.otuId) { return }

    citations.value = (await TaxonWorks.getTaxonNameCitations(props.otuId)).data
  },
  {
    immediate: true
  }
)

const changeRowExpandedState = value => {
  rowRefs.value.forEach(component => {
    component.setExpanded(value)
  })
}
</script>
