<template>
  <VCard>
    <VCardHeader class="flex justify-between">
      <h2 class="text-md">Descendants and synonyms</h2>
      <PanelDropdown panel-key="panel:descendants" />
    </VCardHeader>
    <VCardContent class="text-sm">
      <ul class="tree ml-2">
        <AnimationOpacity>
          <DescendantsTree
            v-if="
              taxonomy &&
              (taxonomy.nomenclatural_synonyms.length ||
                taxonomy.descendants.length)
            "
            :taxonomy="taxonomy"
          />
        </AnimationOpacity>
      </ul>
    </VCardContent>
  </VCard>
</template>

<script setup>
import { ref, watch } from 'vue'
import DescendantsTree from './DescendantsTree.vue'
import TaxonWorks from '../../../services/TaxonWorks'
import PanelDropdown from '../PanelDropdown.vue'
import { useOtuPageRequest } from '@/modules/otus/helpers/useOtuPageRequest'

const props = defineProps({
  otuId: {
    type: [String, Number],
    required: true
  }
})

const taxonomy = ref(null)

watch(
  () => props.otuId,
  async () => {
    if (!props.otuId) {
      return
    }

    useOtuPageRequest('panel:descendants', () =>
      TaxonWorks.getTaxonomy(props.otuId, { max_descendants_depth: 1 })
    ).then(({ data }) => {
      taxonomy.value = data
    })
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
