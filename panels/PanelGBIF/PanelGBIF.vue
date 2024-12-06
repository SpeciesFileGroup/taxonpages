<template>
  <VCard v-if="url">
    <VCardHeader><GBIFLogo class="h-6" /></VCardHeader>
    <VCardContent>
      <a
        class="text-sm"
        target="_blank"
        :href="url"
        v-html="taxon.full_name_tag"
      />
    </VCardContent>
  </VCard>
</template>

<script setup>
import axios from 'axios';
import { computed, onMounted, ref } from 'vue';
import GBIFLogo from './components/gbifLogo.vue';

const props = defineProps({
  taxon: {
    type: Object,
    required: true
  },

  perPage: {
    type: Number,
    default: 60
  }
})

const url = computed(() => {
  return usageKey.value
    ? `https://www.gbif.org/species/${usageKey.value}`
    : null
})
const usageKey = ref(null)

function loadUsageKey() {
  axios
    .get('https://api.gbif.org/v1/species/match', {
      params: {
        name: props.taxon.expanded_name
      }
    })
    .then(({ data }) => {
      usageKey.value = data?.usageKey
    })
}

onMounted(loadUsageKey)
</script>
