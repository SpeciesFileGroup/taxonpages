<template>
  <VCard>
    <VCardHeader class="flex justify-between">
      <h2 class="text-md">Type</h2>
      <PanelDropdown panel-key="panel:type" />
    </VCardHeader>
    <VCardContent class="text-sm">
      <p>
        <RouterLink
          v-if="typeDesignation.valid_subject_otu_id"
          :to="{
            name: 'otus-id',
            params: { id: typeDesignation.valid_subject_otu_id }
          }"
          v-html="typeDesignation.subject_taxon_name"
        />
        <span
          v-else
          v-html="typeDesignation.subject_taxon_name"
        />
        {{ typeDesignation.subject_status }}
        <span v-html="typeDesignation.object_taxon_name" />
      </p>
    </VCardContent>
  </VCard>
</template>

<script setup>
import { computed } from 'vue'
import { useOtuStore } from '@/modules/otus/store/store'
import PanelDropdown from '../PanelDropdown.vue'

const props = defineProps({
  taxonId: {
    type: [String, Number],
    required: true
  }
})

const store = useOtuStore()

const typeDesignation = computed(
  () => store.taxon?.type_taxon_name_relationship || {}
)
</script>
