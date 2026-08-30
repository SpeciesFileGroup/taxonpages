<template>
  <div class="[&_i]:italic">
    <section
      v-for="couplet in couplets"
      :key="couplet.id"
      :id="`couplet-${couplet.coupletNumber}`"
      :data-current="isCurrent(couplet) || null"
      class="mb-5 scroll-mt-24 rounded transition-colors"
      :class="isCurrent(couplet)
        ? 'ring-2 ring-secondary ring-offset-2 ring-offset-base-foreground bg-secondary/5'
        : ''"
    >
      <div class="flex gap-3">
        <RouterLink
          :to="coupletTo(couplet.coupletNumber)"
          class="font-semibold text-secondary shrink-0 tabular-nums hover:underline"
        >{{ couplet.coupletNumber }}</RouterLink>
        <!-- body: the leads, and — when a figure is on every lead — a shared-figure
             block vertically centred beside them -->
        <div
          class="flex-1 min-w-0"
          :class="sharedFiguresOf(couplet.id).length ? 'sm:flex sm:gap-6' : ''"
        >
         <div class="min-w-0 flex-1" :class="hasShared(couplet.id) ? 'sm:max-w-[440px]' : ''">
          <p v-if="fromCouplet(couplet)" class="text-xs text-base-soft mb-1">
            <RouterLink
              :to="coupletTo(fromCouplet(couplet))"
              class="text-base-content hover:underline hover:text-secondary"
            >from {{ fromCouplet(couplet) }}</RouterLink>
          </p>

          <div
            v-for="(choice, idx) in childrenOf(couplet.id)"
            :key="choice.id"
            class="mb-3 last:mb-0"
          >
            <div class="flex gap-2">
              <span class="text-base-soft shrink-0 w-4 text-right">{{ idx === 0 ? '' : '—' }}</span>

              <!-- Without a shared figure: text (capped ~440px) + right-aligned target, then a
                   fixed 320px image column. With a shared figure: this lead's individual
                   figures sit below its text and the shared block owns the couplet's right
                   (the width cap then lives on the leads column above, not here). -->
              <div
                class="flex-1 min-w-0"
                :class="hasShared(couplet.id) ? '' : 'flex flex-col gap-2 sm:flex-row sm:gap-6'"
              >
                <div class="flex-1 min-w-0" :class="hasShared(couplet.id) ? '' : 'sm:max-w-[440px]'">
                  <LeadText :node="choice" :citations="citations" @open-citation="$emit('open-citation', $event)" />
                  <div class="mt-1 flex sm:justify-end">
                    <RouterLink
                      v-if="choice.isCouplet"
                      :to="coupletTo(choice.coupletNumber)"
                      class="inline-flex items-center whitespace-nowrap rounded-full bg-secondary/10 px-2.5 py-0.5 text-sm font-medium text-secondary hover:bg-secondary/20 hover:underline"
                    >couplet {{ choice.coupletNumber }} <span class="ml-1 opacity-60">→</span></RouterLink>
                    <TaxonLink
                      v-else-if="choice.targetType === '/api/v1/otus'"
                      :id="choice.targetId"
                      :label="String(choice.targetLabel)"
                      variant="pill"
                    />
                    <a
                      v-else-if="choice.targetLink"
                      :href="choice.targetLink"
                      target="_blank"
                      rel="noopener"
                      class="inline-flex items-center whitespace-nowrap rounded-full bg-secondary/10 px-2.5 py-0.5 text-sm text-secondary hover:bg-secondary/20 hover:underline"
                    >{{ choice.targetLabel }}</a>
                    <span
                      v-else
                      class="inline-flex items-center whitespace-nowrap rounded-full bg-base-muted px-2.5 py-0.5 text-sm text-base-content"
                    >{{ choice.targetLabel }}</span>
                  </div>

                  <!-- shared-figure couplet: this lead's individual figures sit under its text -->
                  <LeadFigures
                    v-if="hasShared(couplet.id) && ownFiguresOf(couplet.id, choice.id).length"
                    :figures="ownFiguresOf(couplet.id, choice.id)"
                    class="mt-2"
                  />
                </div>

                <div v-if="!hasShared(couplet.id)" class="sm:flex-1 sm:min-w-0 sm:max-w-[480px]">
                  <LeadFigures :node="choice" :figures="ownFiguresOf(couplet.id, choice.id)" />
                </div>
              </div>
            </div>
          </div>
         </div>

         <div
           v-if="hasShared(couplet.id)"
           class="mt-3 sm:mt-0 sm:flex-1 sm:min-w-0 sm:max-w-[480px] sm:self-center"
         >
           <LeadFigures :figures="sharedFiguresOf(couplet.id)" />
         </div>
        </div>
      </div>
    </section>

    <button
      v-if="currentCoupletNumber"
      type="button"
      class="key-print-hide fixed bottom-4 right-4 z-40 flex items-center gap-1 rounded-full bg-primary text-primary-content text-sm px-3 py-2 shadow-lg hover:bg-primary/80"
      @click="scrollToCouplet(currentCoupletNumber)"
    >↑ Couplet {{ currentCoupletNumber }}</button>
  </div>
</template>

<script setup>
import { watch, nextTick, computed } from 'vue'
import { childChoices } from '../lib/tree.js'
import { partitionCoupletFigures } from '../lib/images.js'
import LeadText from './LeadText.vue'
import TaxonLink from './TaxonLink.vue'
import LeadFigures from './LeadFigures.vue'

const props = defineProps({
  keyId: { type: [String, Number], required: true },
  couplet: { type: String, default: null },
  couplets: { type: Array, required: true },
  nodes: { type: Object, required: true },
  citations: { type: Object, default: () => ({}) }
})
defineEmits(['open-citation'])

const childrenOf = (id) => childChoices(id, props.nodes)

// Per couplet: figures shared by every lead (hoisted to a couplet-level row) vs.
// the individual figures that stay under each lead. Keyed by couplet id.
const coupletFigures = computed(() => {
  const out = {}
  for (const couplet of props.couplets) {
    const leads = childrenOf(couplet.id)
    const { shared, own } = partitionCoupletFigures(leads.map((l) => l.figures || []))
    out[couplet.id] = {
      shared,
      ownByLeadId: Object.fromEntries(leads.map((l, i) => [l.id, own[i] || []]))
    }
  }
  return out
})
const sharedFiguresOf = (coupletId) => coupletFigures.value[coupletId]?.shared || []
const hasShared = (coupletId) => sharedFiguresOf(coupletId).length > 0
const ownFiguresOf = (coupletId, leadId) =>
  coupletFigures.value[coupletId]?.ownByLeadId?.[leadId] || []

// RouterLink target for a couplet number — same route, :couplet param changes. No hash.
const coupletTo = (n) => ({ name: 'dichotomous-key', params: { id: props.keyId, couplet: String(n) } })

// The couplet number whose lead points into this couplet (its parent couplet), for a back-reference.
function fromCouplet(couplet) {
  const parent = couplet.parentId == null ? null : props.nodes[couplet.parentId]
  return parent && parent.isCouplet ? parent.coupletNumber : null
}

const currentCoupletNumber = computed(() =>
  props.couplet != null && props.couplet !== '' ? String(props.couplet) : null
)
function isCurrent(couplet) {
  return currentCoupletNumber.value != null &&
    String(couplet.coupletNumber) === currentCoupletNumber.value
}

// When the URL names a couplet, bring its section into view (client only).
//
// The framework router's scrollBehavior forces { top: 0 } on every hashless nav,
// so a naive smooth scroll would jump the reader to the top of the key and then
// glide the whole way back down to the target — jarring, and "further than
// necessary" for a hop between neighbouring couplets. Instead: capture where the
// reader actually was (fromY, read synchronously before the router scrolls),
// undo the { top: 0 } jump with no animation, then smooth-scroll the short
// remaining distance to the target.
function scrollToCouplet(n, fromY) {
  if (n == null || n === '' || typeof document === 'undefined') return
  const startY = typeof fromY === 'number'
    ? fromY
    : (typeof window !== 'undefined' ? window.scrollY : 0)
  nextTick(() => {
    const undoRouterJump = () => {
      if (window.scrollY === 0 && startY > 0) window.scrollTo(0, startY)
    }
    requestAnimationFrame(() => {
      undoRouterJump()
      requestAnimationFrame(() => {
        undoRouterJump()
        document.getElementById(`couplet-${n}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    })
  })
}
const currentScrollY = () => (typeof window !== 'undefined' ? window.scrollY : 0)
watch(() => props.couplet, (n) => scrollToCouplet(n, currentScrollY()), { immediate: true })
watch(() => props.couplets, () => scrollToCouplet(props.couplet, currentScrollY()))
</script>

<style>
@media print {
  [data-current] { box-shadow: none !important; background: none !important; }
}
</style>
