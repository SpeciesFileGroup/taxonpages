<template>
  <FilterContainer>
    <h3 class="text-md mb-2 font-medium">Taxon name</h3>
    <Autocomplete
      class="w-full mb-4"
      url="/taxon_names/autocomplete"
      placeholder="Search..."
      query-param="term"
      label="label_html"
      @select="addTaxonName"
    />

    <TableTaxa
      v-if="taxonNames.length"
      :list="taxonNames"
      @remove="removeTaxonName"
    />
  </FilterContainer>
</template>

<script setup>
import FilterContainer from '../FilterContainer.vue'
import TableTaxa from './TableTaxa.vue'
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue'])

const taxonNames = ref([])

const params = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

function addTaxonName(item) {
  taxonNames.value.push(item)
}

function removeTaxonName(index) {
  taxonNames.value.splice(index, 1)
}
</script>
