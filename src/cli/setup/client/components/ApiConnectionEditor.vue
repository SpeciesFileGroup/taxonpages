<template>
  <div>
    <!-- Mode tabs -->
    <div class="flex gap-1 p-1 bg-base-muted rounded-lg mb-5 w-fit">
      <button
        v-for="opt in modes"
        :key="opt.value"
        class="px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-150"
        :class="mode === opt.value
          ? 'bg-base-foreground text-base-content shadow-sm'
          : 'text-base-soft hover:text-base-content'"
        @click="mode = opt.value"
      >
        {{ opt.label }}
      </button>
    </div>

    <div class="tp-card p-5 sm:p-6">

      <!-- Browse mode -->
      <template v-if="mode === 'browse'">
        <!-- Base URL selector -->
        <div class="mb-5">
          <label class="block text-sm font-medium text-base-content mb-1.5">
            API Server
          </label>
          <div class="flex gap-2">
            <select
              v-model="selectedBaseUrl"
              class="tp-select flex-1"
              @change="onBaseUrlChange"
            >
              <option
                value=""
                disabled
              >
                Select a server…
              </option>
              <option
                v-for="server in servers"
                :key="server.url"
                :value="server.url"
              >
                {{ server.label }}
              </option>
            </select>
            <button
              class="tp-btn tp-btn-outline shrink-0"
              :disabled="!selectedBaseUrl || loading"
              @click="refresh"
              title="Refresh"
            >
              <svg class="w-4 h-4" :class="{ 'animate-spin': loading }" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Loading state -->
        <div
          v-if="loading"
          class="flex items-center gap-3 py-6 justify-center"
        >
          <div class="tp-spinner-sm" />
          <span class="text-sm text-base-soft">Loading projects…</span>
        </div>

        <!-- Error state -->
        <div
          v-else-if="error"
          class="rounded-lg bg-danger-light p-4 mb-5"
        >
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-danger shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p class="font-medium text-sm text-danger">Failed to load projects</p>
              <p class="mt-1 text-sm text-base-soft">{{ error }}</p>
              <button class="tp-btn tp-btn-outline tp-btn-sm mt-3" @click="refresh">
                Retry
              </button>
            </div>
          </div>
        </div>

        <!-- Project selector -->
        <template v-else-if="projects.length > 0">
          <div class="mb-5">
            <label class="block text-sm font-medium text-base-content mb-1.5">
              Project
            </label>

            <select
              v-model="selectedProjectToken"
              class="tp-select"
              @change="onProjectSelect"
            >
              <option
                value=""
                disabled
              >
                Select a project…
              </option>
              <option
                v-for="project in sortedProjects"
                :key="project.project_token"
                :value="project.project_token"
              >
                {{ project.name }}
              </option>
            </select>

            <p class="text-xs text-base-soft mt-1.5">
              {{ projects.length }} project{{
                projects.length === 1 ? '' : 's'
              }}
              available
            </p>
          </div>

          <!-- Selected project summary -->
          <Transition name="section">
            <div
              v-if="selectedProjectToken"
              class="rounded-lg bg-success-light/50 border border-success/20 p-4 mb-5"
            >
              <div class="flex items-start gap-3">
                <svg class="w-5 h-5 text-success shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p class="font-medium text-sm text-base-content">
                    {{ selectedProject?.name }}
                  </p>
                  <p class="text-xs text-base-soft mt-1 font-mono break-all">
                    {{ selectedProjectToken }}
                  </p>
                </div>
              </div>
            </div>
          </Transition>
        </template>

        <div
          v-else-if="selectedBaseUrl && !loading"
          class="flex items-center gap-2 py-4 text-sm text-base-soft"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-2.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          No projects found at this server.
        </div>
      </template>

      <!-- Manual mode -->
      <template v-else>
        <FormField
          :field="section.fields.url"
          :model-value="getConfigValue(section.file, 'url')"
          @update:model-value="setConfigValue(section.file, 'url', $event)"
        />
        <FormField
          :field="section.fields.project_token"
          :model-value="getConfigValue(section.file, 'project_token')"
          @update:model-value="
            setConfigValue(section.file, 'project_token', $event)
          "
        />

        <TestConnection />
      </template>

      <!-- Current values display (in browse mode) -->
      <div
        v-if="mode === 'browse' && (currentUrl || currentToken)"
        class="rounded-lg bg-base-muted/50 border border-base-border p-4 mb-5"
      >
        <p class="text-xs font-semibold uppercase tracking-wider text-base-soft mb-2">Current configuration</p>
        <div class="space-y-1 text-xs">
          <p class="text-base-soft">
            URL: <span class="font-mono text-base-content">{{ currentUrl || '(not set)' }}</span>
          </p>
          <p class="text-base-soft">
            Token: <span class="font-mono text-base-content">{{ currentToken || '(not set)' }}</span>
          </p>
        </div>
      </div>

      <!-- Save button -->
      <div class="flex items-center gap-3 mt-6 pt-5 border-t border-base-border">
        <button
          class="tp-btn tp-btn-primary"
          :disabled="!isFileDirty(section.file)"
          @click="saveConfig(section.file)"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Save {{ section.label }}
        </button>
        <span v-if="isFileDirty(section.file)" class="text-xs text-warning font-medium">
          Unsaved changes
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import FormField from './FormField.vue'
import TestConnection from './TestConnection.vue'
import { useConfig } from '../composables/useConfig.js'
import { useProjectFetcher } from '../composables/useProjectFetcher.js'

const props = defineProps({
  section: { type: Object, required: true }
})

const { getConfigValue, setConfigValue, saveConfig, isFileDirty } = useConfig()
const { projects, loading, error, fetchProjects, clearCache } =
  useProjectFetcher()

const servers = [
  {
    label: 'Species File Group (sfg.taxonworks.org)',
    url: 'https://sfg.taxonworks.org/api/v1/'
  },
  {
    label: 'Species File Group (sandbox.taxonworks.org)',
    url: 'https://sandbox.taxonworks.org/api/v1/'
  },
  {
    label: 'Species File Group (sandcastle.taxonworks.org)',
    url: 'https://sandcastle.taxonworks.org/api/v1/'
  },
  {
    label: 'Species File Group (sandfly.taxonworks.org)',
    url: 'https://sandfly.taxonworks.org/api/v1/'
  }
]

const modes = [
  { value: 'browse', label: 'Browse projects' },
  { value: 'manual', label: 'Manual input' }
]

const mode = ref('browse')
const selectedBaseUrl = ref('')
const selectedProjectToken = ref('')

const currentUrl = computed(() => getConfigValue(props.section.file, 'url'))
const currentToken = computed(() =>
  getConfigValue(props.section.file, 'project_token')
)

const sortedProjects = computed(() =>
  [...projects.value].sort((a, b) => a.name.localeCompare(b.name))
)

const selectedProject = computed(() =>
  projects.value.find((p) => p.project_token === selectedProjectToken.value)
)

function onBaseUrlChange() {
  selectedProjectToken.value = ''
  fetchProjects(selectedBaseUrl.value)
}

function onProjectSelect() {
  if (!selectedProjectToken.value || !selectedBaseUrl.value) return

  setConfigValue(props.section.file, 'url', selectedBaseUrl.value)
  setConfigValue(
    props.section.file,
    'project_token',
    selectedProjectToken.value
  )
}

function refresh() {
  clearCache(selectedBaseUrl.value)
  fetchProjects(selectedBaseUrl.value)
}

// On mount, try to match current config to a known server and pre-select
onMounted(() => {
  const url = currentUrl.value
  const token = currentToken.value

  if (url) {
    const match = servers.find((s) => url === s.url)
    if (match) {
      selectedBaseUrl.value = match.url
      fetchProjects(match.url).then(() => {
        if (token && projects.value.some((p) => p.project_token === token)) {
          selectedProjectToken.value = token
        }
      })
    } else {
      // URL doesn't match known servers — switch to manual mode
      mode.value = 'manual'
    }
  }
})
</script>
