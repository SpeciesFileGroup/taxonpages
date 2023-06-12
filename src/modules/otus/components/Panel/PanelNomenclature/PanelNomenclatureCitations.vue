<template>
  <VCard>
    <VCardHeader class="flex justify-between">
      <h2 class="text-md">Nomenclature ({{ list.length }})</h2>
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
import CitationRow from './PanelCitationRow.vue'
import PanelNomenclatureShowMore from './PanelNomenclatureShowMore.vue'
import PanelDropdown from '../PanelDropdown.vue'

const MAX_CITATIONS = 2

const props = defineProps({
  list: {
    type: Array,
    default: () => []
  }
})

const showAll = ref(false)
const citationList = computed(() => splitList(props.list, MAX_CITATIONS))

const menuOptions = computed(() => [
  {
    label: showAll.value ? 'Show less' : 'Show all',
    action: () => (showAll.value = !showAll.value)
  }
])
</script>
