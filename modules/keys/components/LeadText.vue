<template>
  <span>
    <span class="text-base-content">{{ node.text }}</span>
    <span v-if="shortCitations.length" class="text-sm text-base-soft">
      <template v-for="(c, i) in shortCitations" :key="c.id">
        <span> </span>
        <span
          class="cursor-pointer hover:underline"
          role="button"
          tabindex="0"
          @click="$emit('open-citation', c)"
          @keydown.enter="$emit('open-citation', c)"
        >[{{ c.short }}]</span>
      </template>
    </span>
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  node: { type: Object, required: true },
  citations: { type: Object, default: () => ({}) }
})
defineEmits(['open-citation'])

const shortCitations = computed(() => props.citations[props.node.id] || [])
</script>
