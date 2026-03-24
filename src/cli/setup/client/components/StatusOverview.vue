<template>
  <div>
    <!-- Loading -->
    <div
      v-if="loading"
      class="tp-card rounded bg-base-foreground p-6 flex items-center gap-2 text-sm text-base-soft"
    >
      <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      Loading status...
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="tp-card rounded bg-base-foreground p-6"
    >
      <div class="rounded-md bg-danger/10 text-danger text-sm p-3">
        <p class="font-medium">Failed to load status</p>
        <p class="mt-1">{{ error }}</p>
        <button class="mt-2 text-xs underline hover:no-underline" @click="fetchStatus(true)">
          Retry
        </button>
      </div>
    </div>

    <!-- Status cards -->
    <div v-else-if="data" class="space-y-4">
      <!-- TaxonPages version -->
      <div class="tp-card rounded bg-base-foreground p-4 pl-5 pr-5">
        <h3 class="text-sm font-medium text-base-content mb-3">TaxonPages</h3>
        <div class="flex items-center gap-3">
          <span class="text-2xl font-semibold text-base-content">
            v{{ data.taxonpages.current }}
          </span>
          <span
            v-if="data.taxonpages.hasUpdate"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-warning/15 text-warning"
          >
            v{{ data.taxonpages.latest }} available
          </span>
          <span
            v-else-if="data.taxonpages.hasUpdate === false"
            class="text-xs text-success"
          >
            up to date
          </span>
          <span
            v-else
            class="text-xs text-base-soft"
          >
            could not check for updates
          </span>
        </div>
      </div>

      <!-- Node.js -->
      <div class="tp-card rounded bg-base-foreground p-4 pl-5 pr-5">
        <h3 class="text-sm font-medium text-base-content mb-3">Node.js</h3>
        <div class="flex items-center gap-3">
          <span class="text-base font-mono text-base-content">
            {{ data.node.current }}
          </span>
          <span
            v-if="data.node.satisfies"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-success/15 text-success"
          >
            compatible
          </span>
          <span
            v-else
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-danger/15 text-danger"
          >
            requires {{ data.node.required }}
          </span>
        </div>
      </div>

      <!-- Packages -->
      <div class="tp-card rounded bg-base-foreground p-4 pl-5 pr-5">
        <h3 class="text-sm font-medium text-base-content mb-3">Packages</h3>
        <div class="flex items-center gap-4 text-sm">
          <span class="text-base-content">
            <span class="font-semibold">{{ data.packages.installed }}</span>
            installed
          </span>
          <span v-if="data.packages.withUpdates > 0" class="text-warning">
            {{ data.packages.withUpdates }} update{{ data.packages.withUpdates === 1 ? '' : 's' }} available
          </span>
          <span v-else class="text-success">
            all up to date
          </span>
        </div>
      </div>

      <!-- Environment -->
      <div class="tp-card rounded bg-base-foreground p-4 pl-5 pr-5">
        <h3 class="text-sm font-medium text-base-content mb-3">Environment</h3>
        <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt class="text-base-soft">Platform</dt>
          <dd class="font-mono text-base-content">{{ data.environment.platform }}</dd>
          <dt class="text-base-soft">Project</dt>
          <dd class="font-mono text-base-content truncate" :title="data.environment.projectRoot">
            {{ data.environment.projectRoot }}
          </dd>
        </dl>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useStatus } from '../composables/useStatus.js'

const { data, loading, error, fetchStatus } = useStatus()

onMounted(() => {
  fetchStatus()
})
</script>
