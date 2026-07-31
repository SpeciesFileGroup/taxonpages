<template>
  <div>
    <!-- Loading -->
    <div
      v-if="loading"
      class="tp-card p-8 flex flex-col items-center justify-center gap-3"
    >
      <div class="tp-spinner" />
      <span class="text-sm text-base-soft">Loading status…</span>
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="tp-card p-6"
    >
      <div class="rounded-lg bg-danger-light p-4">
        <div class="flex items-start gap-3">
          <svg class="w-5 h-5 text-danger shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p class="font-medium text-sm text-danger">Failed to load status</p>
            <p class="mt-1 text-sm text-base-soft">{{ error }}</p>
            <button class="tp-btn tp-btn-outline tp-btn-sm mt-3" @click="fetchStatus(true)">
              Retry
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Status cards -->
    <div v-else-if="data" class="grid gap-4 sm:grid-cols-2">
      <!-- TaxonPages version -->
      <div class="tp-card p-5 sm:col-span-2">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-xs font-semibold uppercase tracking-wider text-base-soft">TaxonPages</h3>
          <span
            v-if="data.taxonpages.hasUpdate"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-warning-light text-warning"
          >
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            v{{ data.taxonpages.latest }} available
          </span>
          <span
            v-else-if="data.taxonpages.hasUpdate === false"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-success-light text-success"
          >
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Up to date
          </span>
          <span v-else class="text-xs text-base-soft">Could not check for updates</span>
        </div>
        <span class="text-3xl font-bold text-base-content tracking-tight">
          v{{ data.taxonpages.current }}
        </span>
      </div>

      <!-- Node.js -->
      <div class="tp-card p-5">
        <h3 class="text-xs font-semibold uppercase tracking-wider text-base-soft mb-3">Node.js</h3>
        <div class="flex items-center gap-3">
          <span class="text-lg font-mono font-semibold text-base-content">
            {{ data.node.current }}
          </span>
          <span
            v-if="data.node.satisfies"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-success-light text-success"
          >
            Compatible
          </span>
          <span
            v-else
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-danger-light text-danger"
          >
            Requires {{ data.node.required }}
          </span>
        </div>
      </div>

      <!-- Packages -->
      <div class="tp-card p-5">
        <h3 class="text-xs font-semibold uppercase tracking-wider text-base-soft mb-3">Packages</h3>
        <div class="flex items-center gap-3">
          <span class="text-lg font-semibold text-base-content">
            {{ data.packages.installed }}
          </span>
          <span class="text-sm text-base-soft">installed</span>
        </div>
        <div class="mt-1.5">
          <span v-if="data.packages.withUpdates > 0" class="text-xs font-medium text-warning">
            {{ data.packages.withUpdates }} update{{ data.packages.withUpdates === 1 ? '' : 's' }} available
          </span>
          <span v-else class="text-xs font-medium text-success">
            All up to date
          </span>
        </div>
      </div>

      <!-- Environment -->
      <div class="tp-card p-5 sm:col-span-2">
        <h3 class="text-xs font-semibold uppercase tracking-wider text-base-soft mb-3">Environment</h3>
        <dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
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
