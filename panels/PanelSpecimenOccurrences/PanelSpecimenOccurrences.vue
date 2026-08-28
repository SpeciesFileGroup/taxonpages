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

// Any rank above species/subspecies has no specimens of its own to fetch
// directly (dwc.json scoped to its own OTU, if one even exists, would
// return little to nothing) — it needs the species-aggregate view instead.
// Species and subspecies fall through to the existing single-OTU view
// unchanged. 'SpeciesGroup' is the same rank_string substring convention
// taxa_page.yml already uses for panel-level rank gating (see
// isAvailableForRank).
//
// Experimentally enabled for every rank above species (not just genus/
// subgenus) — see taxa_page.yml. Genus/subgenus is the only range actually
// verified to perform reasonably (a few seconds to ~25s worst case); tribe
// and up are known to be much slower and possibly impractical (see project
// memory) but left open on purpose to observe real behavior rather than
// pre-judge it.
const isHigherTaxon = computed(() => !(props.taxon?.rank_string || '').includes('SpeciesGroup'))
</script>
