<template>
  <header class="border-b border-base-muted pb-4 mb-6">
    <h1 class="text-2xl font-semibold text-base-content">{{ meta.title }}</h1>

    <p v-if="meta.taxonomicScope" class="mt-1 text-base-content">
      <span class="text-base-soft">Scope: </span>
      <RouterLink
        v-if="meta.otuId"
        :to="{ name: 'otus-id', params: { id: meta.otuId } }"
        target="_blank"
        rel="noopener"
        class="italic hover:underline hover:text-secondary"
      >{{ meta.taxonomicScope }}</RouterLink>
      <span v-else class="italic">{{ meta.taxonomicScope }}</span>
    </p>

    <p v-if="meta.description" class="mt-2 text-base-content">{{ meta.description }}</p>

    <p
      v-if="meta.originCitation"
      class="mt-2 text-sm text-base-content [&_i]:italic cursor-pointer hover:underline"
      role="button"
      tabindex="0"
      @click="showCitation = true"
      @keydown.enter="showCitation = true"
      v-html="meta.originCitation"
    />

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
    </div>

    <VModal v-if="showCitation" @close="showCitation = false">
      <template #header><div class="text-sm font-medium">Reference</div></template>
      <div class="px-4 pb-4 text-sm leading-relaxed [&_i]:italic" v-html="meta.originCitation" />
    </VModal>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({ meta: { type: Object, required: true } })

const showCitation = ref(false)

// attribution shape from TaxonWorks attribution_to_json is loosely specified; render a
// best-effort string and never throw.
const attributionText = computed(() => {
  const a = props.meta.attribution
  if (!a) return ''
  if (typeof a === 'string') return a
  return a.label || a.text || ''
})
</script>
