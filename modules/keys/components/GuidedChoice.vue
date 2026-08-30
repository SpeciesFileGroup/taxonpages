<template>
  <!-- Card surface is the SAME panel grey the rest of the app uses (bg-base-foreground),
       matching the KeyView wrapper it sits in. It is separated from siblings by the
       border alone — NOT by a distinct/recessed fill. bg-base-background here reads as
       white-on-near-black in dark mode (unreadable); do not reintroduce it. (A3) -->
  <div class="rounded border border-base-muted bg-base-foreground p-4 flex flex-col gap-3"
       :style="{ boxShadow: 'var(--tp-card-shadow) 0 2px 4px 0' }">
    <p class="[&_i]:italic leading-relaxed">
      <LeadText :node="choice" :citations="citations" @open-citation="$emit('open-citation', $event)" />
    </p>

    <LeadFigures v-if="choice.figures.length" :figures="choice.figures" />

    <ReachableTaxa :choice="choice" :nodes="nodes" />

    <RouterLink
      v-if="choice.isCouplet"
      :to="{ name: 'dichotomous-key', params: { id: keyId, couplet: String(choice.coupletNumber) } }"
      class="self-start text-sm px-3 py-1 rounded bg-primary text-primary-content hover:bg-primary/80"
    >Go to couplet {{ choice.coupletNumber }} →</RouterLink>
  </div>
</template>

<script setup>
import LeadText from './LeadText.vue'
import LeadFigures from './LeadFigures.vue'
import ReachableTaxa from './ReachableTaxa.vue'

defineProps({
  keyId: { type: [String, Number], required: true },
  choice: { type: Object, required: true },
  nodes: { type: Object, required: true },
  citations: { type: Object, default: () => ({}) }
})
defineEmits(['open-citation'])
</script>
