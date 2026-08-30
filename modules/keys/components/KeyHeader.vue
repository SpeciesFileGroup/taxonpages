<template>
  <header class="border-b border-base-muted pb-4 mb-6">
    <h1 class="text-2xl font-semibold text-base-content">{{ meta.title }}</h1>

    <p v-if="meta.taxonomicScope" class="mt-1 text-base-content [&_i]:italic">
      <span class="text-base-soft">Scope: </span><RouterLink
        v-if="meta.otuId"
        :to="{ name: 'otus-id', params: { id: meta.otuId } }"
        target="_blank"
        rel="noopener"
        class="text-secondary hover:underline"
      ><span v-if="meta.taxonomicScopeHtml" v-html="meta.taxonomicScopeHtml" /><template v-else>{{ meta.taxonomicScope }}</template></RouterLink><span
        v-else-if="meta.taxonomicScopeHtml"
        v-html="meta.taxonomicScopeHtml"
      /><template v-else>{{ meta.taxonomicScope }}</template>
    </p>

    <p v-if="primaryCitation" class="mt-2 text-sm text-base-content [&_i]:italic">
      <span class="text-base-soft">Primary source: </span><span v-html="sanitizeAndLinkifyHtml(primaryCitation)" /><button
        type="button"
        class="ml-1 text-xs text-base-soft hover:underline"
        @click="showCitation = true"
      >(details)</button>
    </p>

    <p v-if="meta.description" class="mt-2 text-base-content">{{ meta.description }}</p>

    <p v-if="meta.attribution" class="mt-1 text-sm text-base-soft">{{ attributionText }}</p>

    <div class="mt-3 flex flex-wrap gap-2 text-xs text-base-soft">
      <span v-if="meta.coupletsCount" class="border border-base-muted rounded px-2 py-0.5">
        {{ meta.coupletsCount }} couplets
      </span>
      <span v-if="meta.otusCount" class="border border-base-muted rounded px-2 py-0.5">
        {{ meta.otusCount }} taxa
      </span>
      <span v-if="meta.updatedInWords" class="border border-base-muted rounded px-2 py-0.5">
        updated {{ meta.updatedInWords }} ago
      </span>
      <button
        v-if="completeness"
        type="button"
        class="border rounded px-2 py-0.5"
        :class="completeness.isComplete
          ? 'border-base-muted text-base-soft'
          : 'border-danger text-danger'"
        @click="showCompleteness = true"
        @keydown.enter="showCompleteness = true"
        @keydown.space.prevent="showCompleteness = true"
      >{{ completeness.isComplete
        ? `complete (${completeness.expectedCount} ${completeness.targetRank})`
        : `${completeness.coveredCount} / ${completeness.expectedCount} ${completeness.targetRank}` }}</button>
    </div>

    <button
      v-if="references.length > 1 || (references.length === 1 && !references[0].isPrimary)"
      type="button"
      class="mt-2 block text-sm text-base-soft hover:underline hover:text-secondary"
      @click="showReferences = true"
    >References cited ({{ references.length }})</button>

    <VModal v-if="showCitation" @close="showCitation = false">
      <template #header><div class="text-sm font-medium">Reference</div></template>
      <div class="px-4 pb-4 text-sm leading-relaxed [&_i]:italic" v-html="sanitizeAndLinkifyHtml(primaryCitation)" />
    </VModal>

    <VModal v-if="showCompleteness && completeness" @close="showCompleteness = false">
      <template #header><div class="text-sm font-medium">Completeness</div></template>
      <div class="px-4 pb-4">
        <CompletenessReport :report="completeness" />
      </div>
    </VModal>

    <VModal v-if="showReferences" @close="showReferences = false">
      <template #header><div class="text-sm font-medium">References cited</div></template>
      <ul class="px-4 pb-4 text-sm leading-relaxed space-y-2 [&_i]:italic">
        <li v-for="(r, i) in references" :key="i">
          <span v-if="r.isPrimary" class="text-base-soft">[primary] </span><span v-html="sanitizeAndLinkifyHtml(r.full)" />
        </li>
      </ul>
    </VModal>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { sanitizeAndLinkifyHtml } from '@/utils'
import CompletenessReport from './CompletenessReport.vue'

const props = defineProps({
  meta: { type: Object, required: true },
  completeness: { type: Object, default: null },
  references: { type: Array, default: () => [] },
  primaryCitation: { type: String, default: null }
})

const showCitation = ref(false)
const showCompleteness = ref(false)
const showReferences = ref(false)

// attribution shape from TaxonWorks attribution_to_json is loosely specified; render a
// best-effort string and never throw.
const attributionText = computed(() => {
  const a = props.meta.attribution
  if (!a) return ''
  if (typeof a === 'string') return a
  return a.label || a.text || ''
})
</script>
