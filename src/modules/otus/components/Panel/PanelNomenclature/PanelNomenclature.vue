<template>
  <PanelNomenlcatureCitations :list="citations" />
  <PanelNomenclatureReferences :list="sources" />
</template>

<script setup>
import { ref, watch } from 'vue'
import PanelNomenlcatureCitations from './PanelNomenclatureCitations.vue'
import PanelNomenclatureReferences from './PanelNomenclatureReferences.vue'
import TaxonWorks from '../../../services/TaxonWorks'

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

const citations = ref([])
const sources = ref([])

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
