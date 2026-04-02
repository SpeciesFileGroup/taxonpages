<template>
  <div class="tp-card p-5 sm:p-6">
    <!-- Install input -->
    <div class="flex gap-2 mb-5">
      <input
        v-model="installName"
        type="text"
        placeholder="Package name, e.g. @taxonpages/panel-map"
        class="tp-input flex-1"
        :disabled="busy"
        @keyup.enter="installPackage"
      >
      <button
        class="tp-btn tp-btn-primary shrink-0"
        :disabled="busy || !installName.trim()"
        @click="installPackage"
      >
        <div v-if="busy && busyAction === 'install'" class="tp-spinner-sm" style="width: 0.875rem; height: 0.875rem;" />
        <template v-else>Install</template>
      </button>
    </div>

    <!-- Status message -->
    <div
      v-if="statusMessage"
      class="flex items-center gap-2 text-sm px-3 py-2 rounded-lg mb-4"
      :class="statusError ? 'bg-danger/10 text-danger' : 'bg-success-light text-success'"
    >
      <svg v-if="statusError" class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <svg v-else class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      {{ statusMessage }}
    </div>

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
                {{ pkg.source === 'npm' ? `npm · v${pkg.version}` : 'local' }}
              </div>
            </div>
            <UpdateBadge
              v-if="pkg.source === 'npm'"
              :update="getUpdate(pkg.name)"
              :checking="updatesLoading"
            />
            <div v-if="pkg.source === 'npm'" class="flex items-center gap-1.5 shrink-0">
              <button
                v-if="getUpdate(pkg.name)?.hasUpdate"
                class="tp-btn tp-btn-sm tp-btn-outline"
                :disabled="busy"
                @click="updatePackage(pkg.name)"
              >
                <div v-if="busy && busyPackage === pkg.name && busyAction === 'update'" class="tp-spinner-sm" style="width: 0.75rem; height: 0.75rem;" />
                <template v-else>Update</template>
              </button>
              <button
                class="tp-btn tp-btn-sm tp-btn-danger"
                :disabled="busy"
                @click="uninstallPackage(pkg.name)"
              >
                <div v-if="busy && busyPackage === pkg.name && busyAction === 'uninstall'" class="tp-spinner-sm" style="width: 0.75rem; height: 0.75rem;" />
                <svg v-else class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
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
                {{ pkg.source === 'npm' ? `npm · v${pkg.version}` : 'local' }}
              </div>
            </div>
            <UpdateBadge
              v-if="pkg.source === 'npm'"
              :update="getUpdate(pkg.name)"
              :checking="updatesLoading"
            />
            <div v-if="pkg.source === 'npm'" class="flex items-center gap-1.5 shrink-0">
              <button
                v-if="getUpdate(pkg.name)?.hasUpdate"
                class="tp-btn tp-btn-sm tp-btn-outline"
                :disabled="busy"
                @click="updatePackage(pkg.name)"
              >
                <div v-if="busy && busyPackage === pkg.name && busyAction === 'update'" class="tp-spinner-sm" style="width: 0.75rem; height: 0.75rem;" />
                <template v-else>Update</template>
              </button>
              <button
                class="tp-btn tp-btn-sm tp-btn-danger"
                :disabled="busy"
                @click="uninstallPackage(pkg.name)"
              >
                <div v-if="busy && busyPackage === pkg.name && busyAction === 'uninstall'" class="tp-spinner-sm" style="width: 0.75rem; height: 0.75rem;" />
                <svg v-else class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import UpdateBadge from './UpdateBadge.vue'

const packages = ref({ panels: [], modules: [] })
const updates = ref([])
const loading = ref(true)
const updatesLoading = ref(true)

const busy = ref(false)
const busyPackage = ref(null)
const busyAction = ref(null)
const statusMessage = ref('')
const statusError = ref(false)
const installName = ref('')

function getUpdate(name) {
  return updates.value.find((u) => u.name === name) || null
}

function showStatus(message, isError = false) {
  statusMessage.value = message
  statusError.value = isError
  setTimeout(() => { statusMessage.value = '' }, 5000)
}

async function refreshPackages() {
  try {
    const res = await fetch('/api/packages')
    packages.value = await res.json()
  } catch {
    packages.value = { panels: [], modules: [] }
  }

  updatesLoading.value = true
  try {
    const res = await fetch('/api/packages/outdated')
    updates.value = await res.json()
  } catch {
    updates.value = []
  }
  updatesLoading.value = false
}

async function installPackage() {
  const name = installName.value.trim()
  if (!name || busy.value) return

  busy.value = true
  busyPackage.value = name
  busyAction.value = 'install'
  statusMessage.value = ''

  try {
    const res = await fetch('/api/packages/install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    })
    const data = await res.json()
    if (!data.ok) throw new Error(data.error)
    showStatus(data.message)
    installName.value = ''
    await refreshPackages()
  } catch (err) {
    showStatus(err.message, true)
  } finally {
    busy.value = false
    busyPackage.value = null
    busyAction.value = null
  }
}

async function uninstallPackage(name) {
  if (busy.value) return
  if (!confirm(`Uninstall ${name}? This will remove the package and its configuration.`)) return

  busy.value = true
  busyPackage.value = name
  busyAction.value = 'uninstall'
  statusMessage.value = ''

  try {
    const res = await fetch('/api/packages/uninstall', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    })
    const data = await res.json()
    if (!data.ok) throw new Error(data.error)
    showStatus(data.message)
    await refreshPackages()
  } catch (err) {
    showStatus(err.message, true)
  } finally {
    busy.value = false
    busyPackage.value = null
    busyAction.value = null
  }
}

async function updatePackage(name) {
  if (busy.value) return

  busy.value = true
  busyPackage.value = name
  busyAction.value = 'update'
  statusMessage.value = ''

  try {
    const res = await fetch('/api/packages/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    })
    const data = await res.json()
    if (!data.ok) throw new Error(data.error)
    showStatus(data.message)
    await refreshPackages()
  } catch (err) {
    showStatus(err.message, true)
  } finally {
    busy.value = false
    busyPackage.value = null
    busyAction.value = null
  }
}

onMounted(async () => {
  await refreshPackages()
  loading.value = false
})
</script>
