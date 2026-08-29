<template>
  <div class="text-sm [&_i]:italic space-y-3">
    <p class="text-base-content">
      Keyed at <strong>{{ report.targetRank }}</strong> level —
      {{ report.coveredCount }} of {{ report.expectedCount }} in the key's scope<span v-if="report.isComplete" class="text-base-soft">&nbsp;(complete)</span>.
    </p>

    <section v-for="g in report.groups" :key="g.taxon.id">
      <h4 class="font-medium text-base-content">
        <TaxRefLink :taxon="g.taxon" /><span class="text-base-soft text-xs">&nbsp;({{ coveredInGroup(g) }} / {{ g.members.length }} keyed out)</span>
      </h4>
      <ul class="ml-4 mt-1 space-y-1">
        <li
          v-for="m in g.members"
          :key="m.taxon.id"
          class="flex items-start gap-1"
          :class="m.status === 'missing' ? 'border-l-2 border-danger pl-2 -ml-2' : ''"
        >
          <span
            class="w-5 shrink-0 text-center font-semibold"
            :class="m.status === 'included' ? 'text-success' : 'text-danger'"
            aria-hidden="true"
          >{{ m.status === 'included' ? '✓' : '✗' }}</span>
          <span class="flex-1">
            <TaxRefLink
              :taxon="m.taxon"
              :class="m.status === 'missing' ? 'text-danger font-medium' : ''"
            />
            <ul v-if="m.synonyms.length" class="ml-5 text-base-soft">
              <li v-for="s in m.synonyms" :key="s.id">= <TaxRefLink :taxon="s" /></li>
            </ul>
          </span>
        </li>
      </ul>
    </section>

    <section v-if="report.ungrouped.length">
      <h4 class="font-medium text-base-content">Not placed in a lower group</h4>
      <ul class="ml-4 mt-1 space-y-1">
        <li
          v-for="m in report.ungrouped"
          :key="m.taxon.id"
          class="flex items-start gap-1"
          :class="m.status === 'missing' ? 'border-l-2 border-danger pl-2 -ml-2' : ''"
        >
          <span
            class="w-5 shrink-0 text-center font-semibold"
            :class="m.status === 'included' ? 'text-success' : 'text-danger'"
            aria-hidden="true"
          >{{ m.status === 'included' ? '✓' : '✗' }}</span>
          <span class="flex-1">
            <TaxRefLink
              :taxon="m.taxon"
              :class="m.status === 'missing' ? 'text-danger font-medium' : ''"
            />
          </span>
        </li>
      </ul>
    </section>

    <section v-if="report.outOfScope.length">
      <p class="text-base-soft">Referenced but outside the key's scope:</p>
      <ul class="ml-4 list-disc">
        <li v-for="t in report.outOfScope" :key="t.otuId ?? t.name">
          <TaxRefLink :taxon="t" />
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup>
import TaxRefLink from './TaxRefLink.vue'

defineProps({ report: { type: Object, required: true } })

const coveredInGroup = (g) => g.members.filter((m) => m.status === 'included').length
</script>
