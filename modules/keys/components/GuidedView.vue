<template>
  <div>
    <nav v-if="trail.length > 1" class="key-print-hide mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
      <template v-for="(step, i) in trail" :key="step.id">
        <RouterLink
          :to="to(step.coupletNumber)"
          class="hover:underline hover:text-secondary"
          :class="i === trail.length - 1 ? 'text-base-content font-medium' : 'text-base-soft'"
        >Couplet {{ step.coupletNumber }}</RouterLink>
        <span v-if="i < trail.length - 1" class="text-base-soft">›</span>
      </template>
    </nav>

    <div class="flex items-baseline justify-between mb-3">
      <h2 class="text-lg font-semibold text-base-content">Couplet {{ current.coupletNumber }}</h2>
      <RouterLink
        v-if="parentCouplet"
        :to="to(parentCouplet.coupletNumber)"
        class="key-print-hide text-sm text-base-soft hover:underline hover:text-secondary"
      >↑ back</RouterLink>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <GuidedChoice
        v-for="choice in choices"
        :key="choice.id"
        :key-id="keyId"
        :choice="choice"
        :nodes="nodes"
        :citations="citations"
        :own-figures="coupletFigures.ownByLeadId ? (coupletFigures.ownByLeadId[choice.id] || []) : null"
        @open-citation="$emit('open-citation', $event)"
      />
    </div>

    <div
      v-if="coupletFigures.shared.length"
      class="mt-4 rounded border border-base-muted bg-base-foreground p-4 sm:max-w-[480px]"
      :style="{ boxShadow: 'var(--tp-card-shadow) 0 2px 4px 0' }"
    >
      <p class="mb-2 text-xs italic text-base-soft">Figure for both leads</p>
      <LeadFigures :figures="coupletFigures.shared" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { rootId, breadcrumb, childChoices, coupletByNumber } from '../lib/tree.js'
import { partitionCoupletFigures } from '../lib/images.js'
import GuidedChoice from './GuidedChoice.vue'
import LeadFigures from './LeadFigures.vue'

const props = defineProps({
  keyId: { type: [String, Number], required: true },
  couplet: { type: String, default: null },
  nodes: { type: Object, required: true },
  citations: { type: Object, default: () => ({}) }
})
defineEmits(['open-citation'])

// Current couplet is a function of the URL. Unknown / absent -> root couplet.
const current = computed(() => {
  if (!Object.keys(props.nodes).length) return {}
  return coupletByNumber(props.couplet, props.nodes) || props.nodes[rootId(props.nodes)] || {}
})

const parentCouplet = computed(() => {
  const p = current.value.parentId == null ? null : props.nodes[current.value.parentId]
  return p && p.isCouplet ? p : null
})

const trail = computed(() => (current.value.id ? breadcrumb(current.value.id, props.nodes) : []))
const choices = computed(() => (current.value.id ? childChoices(current.value.id, props.nodes) : []))

// A figure attached to every lead of this couplet is shown once (below), not repeated
// in each choice card. `ownByLeadId` is null when there is no shared figure — the signal
// for GuidedChoice to fall back to its normal per-lead figure / taxon-image behaviour.
const coupletFigures = computed(() => {
  const leads = choices.value
  if (leads.length < 2) return { shared: [], ownByLeadId: null }
  const { shared, own } = partitionCoupletFigures(leads.map((l) => l.figures || []))
  if (!shared.length) return { shared: [], ownByLeadId: null }
  return {
    shared,
    ownByLeadId: Object.fromEntries(leads.map((l, i) => [l.id, own[i] || []]))
  }
})

// RouterLink target for a couplet number. The root couplet drops the :couplet segment
// so its URL is the clean /key/:id.
function to(coupletNumber) {
  const root = props.nodes[rootId(props.nodes)]
  const params = { id: props.keyId }
  if (!root || String(root.coupletNumber) !== String(coupletNumber)) {
    params.couplet = String(coupletNumber)
  }
  return { name: 'dichotomous-key', params }
}
</script>
