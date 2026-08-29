<template>
  <div class="text-sm">
    <span class="text-base-soft">→ </span>
    <template v-if="choice.isCouplet">
      <span class="text-base-soft">Couplet {{ choice.coupletNumber }} · </span>
      <span class="text-base-content">leads to {{ taxa.length }} {{ taxa.length === 1 ? 'taxon' : 'taxa' }}</span>
      <button
        v-if="taxa.length"
        type="button"
        class="ml-1 text-base-soft hover:underline hover:text-secondary"
        @click="expanded = !expanded"
      >{{ expanded ? 'hide' : 'show names' }}</button>
      <div v-if="expanded || taxa.length <= inlineLimit" class="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
        <TaxonLink v-for="t in taxa" :key="t.id" :id="t.id" :label="t.label" />
      </div>
    </template>
    <TaxonLink
      v-else-if="choice.targetType === '/api/v1/otus'"
      :id="choice.targetId"
      :label="String(choice.targetLabel)"
    />
    <a
      v-else-if="choice.targetLink"
      :href="choice.targetLink"
      target="_blank"
      rel="noopener"
      class="hover:underline hover:text-secondary"
    >{{ choice.targetLabel }}</a>
    <span v-else class="text-base-content">{{ choice.targetLabel }}</span>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { descendantOtus } from '../lib/tree.js'
import TaxonLink from './TaxonLink.vue'

const props = defineProps({
  choice: { type: Object, required: true },
  nodes: { type: Object, required: true }
})

const inlineLimit = 4
const expanded = ref(false)
const taxa = computed(() => descendantOtus(props.choice.id, props.nodes))
</script>
