<template>
  <div :class="{ invisible: !taxon.id }">
    <h2 class="text-1xl text-gray-700 capitalize dark:text-gray-400">
      {{ taxon.rank || taxon.type }}
    </h2>
    <h1 class="text-xl dark:text-gray-100">
      <span v-html="taxonNameString" />
    </h1>
    <h2 class="text-1xl text-gray-700 dark:text-gray-200">
      <CommonNames :otu-id="props.otuId" />
    </h2>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import CommonNames from './CommonNames.vue'

const props = defineProps({
  taxon: {
    type: Object,
    default: () => {}
  },

  otuId: {
    type: Number,
    default: undefined
  }
})

const isValid = computed(() => props.taxon.id === props.taxon.cached_valid_taxon_name_id)

const taxonNameString = computed(() => 
  isValid.value
    ? props.taxon.cached_html + ' ' + (props.taxon.cached_author_year || '')
    : props.taxon.original_combination
)
</script>
