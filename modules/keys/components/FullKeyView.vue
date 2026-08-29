<template>
  <div class="[&_i]:italic">
    <section
      v-for="couplet in couplets"
      :key="couplet.id"
      :id="`couplet-${couplet.coupletNumber}`"
      class="mb-5 scroll-mt-24"
    >
      <div class="flex gap-3">
        <span class="font-semibold text-secondary-content shrink-0 tabular-nums">
          {{ couplet.coupletNumber }}
        </span>
        <div class="flex-1">
          <p v-if="fromCouplet(couplet)" class="text-xs text-base-soft mb-1">
            <RouterLink
              :to="coupletTo(fromCouplet(couplet))"
              class="hover:underline hover:text-secondary"
            >from {{ fromCouplet(couplet) }}</RouterLink>
          </p>

          <div
            v-for="(choice, idx) in childrenOf(couplet.id)"
            :key="choice.id"
            class="mb-2"
          >
            <div class="flex gap-2">
              <span class="text-base-soft shrink-0 w-4 text-right">{{ idx === 0 ? '' : '—' }}</span>
              <div class="flex-1">
                <LeadText :node="choice" :citations="citations" @open-citation="$emit('open-citation', $event)" />
                <span> … </span>
                <RouterLink
                  v-if="choice.isCouplet"
                  :to="coupletTo(choice.coupletNumber)"
                  class="font-medium hover:underline hover:text-secondary"
                >couplet {{ choice.coupletNumber }}</RouterLink>
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

                <LeadFigures v-if="choice.figures.length" :figures="choice.figures" class="mt-1" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { watch, nextTick } from 'vue'
import { childChoices } from '../lib/tree.js'
import LeadText from './LeadText.vue'
import TaxonLink from './TaxonLink.vue'
import LeadFigures from './LeadFigures.vue'

const props = defineProps({
  keyId: { type: [String, Number], required: true },
  couplet: { type: [String, null], default: null },
  couplets: { type: Array, required: true },
  nodes: { type: Object, required: true },
  citations: { type: Object, default: () => ({}) }
})
defineEmits(['open-citation'])

const childrenOf = (id) => childChoices(id, props.nodes)

// RouterLink target for a couplet number — same route, :couplet param changes. No hash.
const coupletTo = (n) => ({ name: 'dichotomous-key', params: { id: props.keyId, couplet: String(n) } })

// The couplet number whose lead points into this couplet (its parent couplet), for a back-reference.
function fromCouplet(couplet) {
  const parent = couplet.parentId == null ? null : props.nodes[couplet.parentId]
  return parent && parent.isCouplet ? parent.coupletNumber : null
}

// When the URL names a couplet, bring its section into view (client only).
function scrollToCouplet(n) {
  if (n == null || typeof document === 'undefined') return
  nextTick(() => {
    document.getElementById(`couplet-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}
watch(() => props.couplet, scrollToCouplet, { immediate: true })
watch(() => props.couplets, () => scrollToCouplet(props.couplet))
</script>
