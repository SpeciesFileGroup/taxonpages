<template>
  <div class="tp-card p-5 sm:p-6">
    <div v-if="loading" class="flex items-center justify-center gap-3 py-8">
      <div class="tp-spinner" />
      <span class="text-sm text-base-soft">Loading packages…</span>
    </div>

    <div v-else-if="packages.panels.length === 0 && packages.modules.length === 0" class="flex flex-col items-center py-8 text-center">
      <svg class="w-10 h-10 text-base-muted mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
      <p class="text-sm text-base-soft">No external packages found.</p>
    </div>

    <template v-else>
      <!-- Panels -->
      <div v-if="packages.panels.length > 0" class="mb-6">
        <h3 class="text-xs font-semibold uppercase tracking-wider text-base-soft mb-3">Panels</h3>
        <div class="space-y-2">
          <div
            v-for="pkg in packages.panels"
            :key="pkg.name"
            class="flex items-center gap-3 py-2.5 px-3.5 rounded-lg border border-base-border hover:border-base-soft/30 transition-colors"
          >
            <div class="w-8 h-8 rounded-lg bg-secondary-light flex items-center justify-center shrink-0">
              <svg class="w-4 h-4 text-secondary-color" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium font-mono text-base-content truncate">{{ pkg.name }}</div>
              <div class="text-xs text-base-soft">
                {{ pkg.source === 'npm' ? `v${pkg.version}` : 'local' }}
              </div>
            </div>
            <UpdateBadge
              v-if="pkg.source === 'npm'"
              :update="getUpdate(pkg.name)"
              :checking="updatesLoading"
            />
          </div>
        </div>
      </div>

      <!-- Modules -->
      <div v-if="packages.modules.length > 0">
        <h3 class="text-xs font-semibold uppercase tracking-wider text-base-soft mb-3">Modules</h3>
        <div class="space-y-2">
          <div
            v-for="pkg in packages.modules"
            :key="pkg.name"
            class="flex items-center gap-3 py-2.5 px-3.5 rounded-lg border border-base-border hover:border-base-soft/30 transition-colors"
          >
            <div class="w-8 h-8 rounded-lg bg-secondary-light flex items-center justify-center shrink-0">
              <svg class="w-4 h-4 text-secondary-color" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium font-mono text-base-content truncate">{{ pkg.name }}</div>
              <div class="text-xs text-base-soft">
                {{ pkg.source === 'npm' ? `v${pkg.version}` : 'local' }}
              </div>
            </div>
            <UpdateBadge
              v-if="pkg.source === 'npm'"
              :update="getUpdate(pkg.name)"
              :checking="updatesLoading"
            />
          </div>
        </div>
      </div>
    </template>

    <!-- Summary -->
    <div v-if="updateCount > 0" class="mt-5 pt-4 border-t border-base-border">
      <div class="flex items-center gap-2 text-sm text-warning">
        <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
        {{ updateCount }} update{{ updateCount > 1 ? 's' : '' }} available.
        Run <code class="bg-base-muted px-1.5 py-0.5 rounded text-xs font-mono">taxonpages package add &lt;name&gt;</code> to update.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import UpdateBadge from './UpdateBadge.vue'

const packages = ref({ panels: [], modules: [] })
const updates = ref([])
const loading = ref(true)
const updatesLoading = ref(true)

function getUpdate(name) {
  return updates.value.find((u) => u.name === name) || null
}

const updateCount = computed(() =>
  updates.value.filter((u) => u.hasUpdate).length
)

onMounted(async () => {
  try {
    const res = await fetch('/api/packages')
    packages.value = await res.json()
  } catch {
    packages.value = { panels: [], modules: [] }
  }
  loading.value = false

  try {
    const res = await fetch('/api/packages/outdated')
    updates.value = await res.json()
  } catch {
    updates.value = []
  }
  updatesLoading.value = false
})
</script>
