<template>
  <VCard>
    <VCardHeader>
      <h1 class="text-md">
        Descendants and synonyms
      </h1>
    </VCardHeader>
    <VCardContent class="text-sm">
      <ul class="tree ml-2">
        <TreeView
          v-if="taxonomy && (taxonomy.nomenclatural_synonyms.length || taxonomy.descendants.length)"
          :taxonomy="taxonomy" 
        />
      </ul>
    </VCardContent>
  </VCard>
</template>

<script setup>
import { ref, watch } from 'vue';
import TreeView from '@/components/TreeView.vue'
import OtuService from '../services/OtuService';

const props = defineProps({
  otuId: {
    type: [String, Number],
    required: true
  }
})

const taxonomy = ref(null)

watch(() => props.otuId, async () => {
  if (!props.otuId) { return }

  OtuService.getDescendants(props.otuId, { max_descendants_depth: 1 }).then(({ data }) => {
    taxonomy.value = data
  })
}, { immediate: true })

</script>

<style scoped>
  .otu-synonyms {
    list-style: none;
    border-left:1px solid rgb(100,100,100);
    padding-left:8px;
    padding-bottom: 8px;
  }
</style>