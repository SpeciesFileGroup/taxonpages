<template>
  <VCard>
    <VCardHeader>
      <h1 class="text-md">
        Status
      </h1>
    </VCardHeader>
    <VCardContent class="text-sm">
      <p v-html="summary.short_status" />
    </VCardContent>
  </VCard>
</template>

<script setup>
import { ref, watch } from 'vue'
import TaxonWorks from '../../../services/TaxonWorks'

const props = defineProps({
  taxonId: {
    type: [String, Number],
    required: true
  }
})

const summary = ref({})

watch(
  () => props.taxonId,
  async () => {
    if (!props.taxonId) { return }

    TaxonWorks.summary(props.taxonId).then(({ data }) => {
      summary.value = data
    })
  },
  { immediate: true }
)
</script>
