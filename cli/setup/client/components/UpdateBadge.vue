<template>
  <span v-if="checking" class="flex items-center gap-1.5 text-xs text-base-soft">
    <div class="tp-spinner-sm" style="width: 0.75rem; height: 0.75rem;" />
  </span>
  <span
    v-else-if="update?.hasUpdate"
    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-warning-light text-warning"
    :title="`${update.installed} → ${update.latest}`"
  >
    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
      <path stroke-linecap="round" stroke-linejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
    </svg>
    {{ update.latest }}
  </span>
  <span
    v-else-if="update && !update.hasUpdate && update.latest"
    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-success-light text-success"
  >
    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
    </svg>
    Latest
  </span>
</template>

<script setup>
defineProps({
  update: { type: Object, default: null },
  checking: { type: Boolean, default: false }
})
</script>
