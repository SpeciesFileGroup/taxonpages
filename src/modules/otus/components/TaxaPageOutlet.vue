<template>
  <LayoutOutlet
    :region="region"
    :entries="entries"
    :context="context"
  />
</template>

<script setup>
import { computed } from 'vue'
import { useOtuStore } from '../store/store'
import { getRegionEntries } from '../constants/regions.js'
import { isAvailableForRank } from '../utils'
import LayoutOutlet from '@/components/Layout/LayoutOutlet.vue'

const props = defineProps({
  region: {
    type: String,
    required: true
  }
})

const store = useOtuStore()

const entries = computed(() =>
  getRegionEntries(props.region).filter((entry) =>
    isAvailableForRank(entry.meta?.rankGroup || [], store.taxon?.rank_string)
  )
)

const context = computed(() => ({
  otu: store.otu,
  otuId: store.otu?.id,
  taxon: store.taxon,
  taxonId: store.taxon?.id
}))
</script>
