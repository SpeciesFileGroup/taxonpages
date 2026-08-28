<template>
  <SpeciesBars v-if="isHigherTaxon" :taxon-id="taxonId" :taxon="taxon" :otu-id="otuId" />
  <SingleSpeciesOccurrences v-else :otu-id="otuId" />
</template>

<script setup>
import { computed } from 'vue'
import SingleSpeciesOccurrences from './components/SingleSpeciesOccurrences.vue'
import SpeciesBars from './components/SpeciesBars.vue'

const props = defineProps({
  otuId: {
    type: Number,
    required: true
  },
  taxonId: {
    type: Number,
    required: true
  },
  taxon: {
    type: Object,
    default: () => ({})
  }
})

// A genus/subgenus-rank page has no specimens of its own to fetch (dwc.json
// scoped to its own OTU, if one even exists, would return little to
// nothing) — it needs the species-aggregate view instead. Species and
// subspecies (and anything below, e.g. variety) fall through to the
// existing single-OTU view unchanged. 'GenusGroup' is the same rank_string
// substring convention taxa_page.yml already uses for panel-level rank
// gating (see isAvailableForRank).
const isHigherTaxon = computed(() => (props.taxon?.rank_string || '').includes('GenusGroup'))
</script>
