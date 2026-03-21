<template>
  <span v-if="checking" class="text-xs text-base-soft">
    checking...
  </span>
  <span
    v-else-if="update?.hasUpdate"
    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-warning/15 text-warning"
    :title="`${update.installed} → ${update.latest}`"
  >
    {{ update.latest }} available
  </span>
  <span
    v-else-if="update && !update.hasUpdate && update.latest"
    class="text-xs text-success"
  >
    up to date
  </span>
</template>

<script setup>
defineProps({
  update: { type: Object, default: null },
  checking: { type: Boolean, default: false }
})
</script>
