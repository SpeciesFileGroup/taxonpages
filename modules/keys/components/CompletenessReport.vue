<template>
  <div class="text-sm [&_i]:italic space-y-3">
    <p class="text-base-content">
      Keyed at <strong>{{ report.targetRank }}</strong> level —
      {{ report.coveredCount }} of {{ report.expectedCount }} in the key's scope
      <span v-if="report.isComplete" class="text-base-soft">(complete)</span>.
    </p>

    <section v-for="g in report.groups" :key="g.taxon.id">
      <h4 class="font-medium text-base-content">
        <TaxRefLink :taxon="g.taxon" />
      </h4>
      <ul class="ml-4 mt-1 space-y-1">
        <li v-for="m in g.members" :key="m.taxon.id">
          <span :class="m.status === 'included' ? 'text-base-content' : 'text-danger'">
            <span aria-hidden="true">{{ m.status === 'included' ? '✓' : '✗' }}</span>
            <TaxRefLink :taxon="m.taxon" />
          </span>
          <ul v-if="m.synonyms.length" class="ml-5 text-base-soft">
            <li v-for="s in m.synonyms" :key="s.id">= <TaxRefLink :taxon="s" /></li>
          </ul>
        </li>
      </ul>
    </section>

    <section v-if="report.ungrouped.length">
      <ul class="ml-4 space-y-1">
        <li v-for="m in report.ungrouped" :key="m.taxon.id">
          <span :class="m.status === 'included' ? 'text-base-content' : 'text-danger'">
            <span aria-hidden="true">{{ m.status === 'included' ? '✓' : '✗' }}</span>
            <TaxRefLink :taxon="m.taxon" />
          </span>
        </li>
      </ul>
    </section>

    <section v-if="report.outOfScope.length">
      <p class="text-base-soft">Referenced but outside the key's scope:</p>
      <ul class="ml-4 list-disc">
        <li v-for="n in report.outOfScope" :key="n">{{ n }}</li>
      </ul>
    </section>
  </div>
</template>

<script setup>
import TaxRefLink from './TaxRefLink.vue'

defineProps({ report: { type: Object, required: true } })
</script>
