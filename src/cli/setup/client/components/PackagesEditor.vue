<template>
  <div class="tp-card rounded bg-base-foreground p-4 pl-5 pr-5">
    <div v-if="loading" class="text-sm text-base-soft">
      Loading packages...
    </div>

    <div v-else-if="packages.panels.length === 0 && packages.modules.length === 0" class="text-sm text-base-soft">
      No external packages found.
    </div>

    <template v-else>
      <!-- Panels -->
      <div v-if="packages.panels.length > 0" class="mb-4">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-base-soft mb-2">Panels</h3>
        <div
          v-for="pkg in packages.panels"
          :key="pkg.name"
          class="flex items-center gap-3 py-2 px-3 rounded mb-1 border border-base-border"
        >
          <div class="flex-1 min-w-0">
            <div class="text-sm font-mono text-base-content truncate">{{ pkg.name }}</div>
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

      <!-- Modules -->
      <div v-if="packages.modules.length > 0">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-base-soft mb-2">Modules</h3>
        <div
          v-for="pkg in packages.modules"
          :key="pkg.name"
          class="flex items-center gap-3 py-2 px-3 rounded mb-1 border border-base-border"
        >
          <div class="flex-1 min-w-0">
            <div class="text-sm font-mono text-base-content truncate">{{ pkg.name }}</div>
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
    </template>

    <!-- Summary -->
    <div v-if="updateCount > 0" class="mt-4 text-sm text-warning">
      {{ updateCount }} update{{ updateCount > 1 ? 's' : '' }} available.
      Run <code class="bg-base-background px-1 rounded text-xs">taxonpages package add &lt;name&gt;</code> to update.
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
