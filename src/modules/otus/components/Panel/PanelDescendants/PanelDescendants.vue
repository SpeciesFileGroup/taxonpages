<template>
  <VCard>
    <ClientOnly>
      <VSpinner
        v-if="isLoading"
        logo-class="w-8 h-8"
        legend=""
      />
    </ClientOnly>
    <VCardHeader class="flex justify-between">
      <h2 class="text-md">Descendants and synonyms</h2>
      <PanelDropdown panel-key="panel:descendants" />
    </VCardHeader>
    <VCardContent class="text-sm">
      <ul class="tree ml-2">
        <AnimationOpacity>
          <DescendantsTree
            v-if="hasRecords"
            :taxonomy="taxonomy"
          />
        </AnimationOpacity>
      </ul>
      <span v-if="!hasRecords && !isLoading">No records found.</span>
    </VCardContent>
  </VCard>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useOtuPageRequest } from '@/modules/otus/helpers/useOtuPageRequest'
import DescendantsTree from './DescendantsTree.vue'
import TaxonWorks from '../../../services/TaxonWorks'
import PanelDropdown from '../PanelDropdown.vue'

const props = defineProps({
  otuId: {
    type: [String, Number],
    required: true
  }
})

const taxonomy = ref(null)
const isLoading = ref(false)

const hasRecords = computed(
  () =>
    taxonomy.value &&
    (taxonomy.value.nomenclatural_synonyms.length ||
      taxonomy.value.descendants.length)
)

watch(
  () => props.otuId,
  async () => {
    if (!props.otuId) {
      return
    }

    isLoading.value = true
    useOtuPageRequest('panel:descendants', () =>
      TaxonWorks.getTaxonomy(props.otuId, {
        params: { max_descendants_depth: 1 }
      })
    )
      .then(({ data }) => {
        taxonomy.value = data
      })
      .catch(() => {})
      .finally(() => (isLoading.value = false))
  },
  { immediate: true }
)
</script>

<style scoped>
.otu-synonyms {
  list-style: none;
  border-left: 1px solid rgb(100, 100, 100);
  padding-left: 8px;
  padding-bottom: 8px;
}
</style>
