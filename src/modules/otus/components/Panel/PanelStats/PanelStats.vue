<template>
  <VCard>
    <VCardHeader class="flex justify-between">
      <h2 class="text-md">Stats</h2>
    </VCardHeader>
    <VCardContent class="text-sm">
      <div>
        <p>
          Taxa:
          <span class="capitalize">
            {{ store.catalog.stats.taxa }}
          </span>
        </p>
      </div>
      <div>
        <p>
          Names:
          <span class="capitalize">
            {{ store.catalog.stats.names }}
          </span>
        </p>
      </div>
    </VCardContent>
  </VCard>
</template>

<script setup>
import { useOtuStore } from '@/modules/otus/store/store'

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
