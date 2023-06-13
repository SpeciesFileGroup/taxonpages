<template>
  <PanelNomenlcatureCitations :list="store.catalog.timeline" />
  <PanelNomenclatureReferences :list="store.catalog.sources" />
</template>

<script setup>
import { useOtuStore } from '@/modules/otus/store/store'
import PanelNomenlcatureCitations from './PanelNomenclatureCitations.vue'
import PanelNomenclatureReferences from './PanelNomenclatureReferences.vue'

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
</script>
