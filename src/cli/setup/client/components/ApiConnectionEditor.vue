<template>
  <div>
    <!-- Mode tabs -->
    <nav class="mb-4">
      <ul class="inline-flex items-center gap-0.5 flex-wrap">
        <li
          v-for="opt in modes"
          :key="opt.value"
          class="inline-flex items-center text-sm"
        >
          <button
            class="block py-2 px-3 text-base-content border-b-2 transition-colors"
            :class="
              mode === opt.value
                ? 'border-secondary-color text-secondary-color'
                : 'border-transparent hover:text-secondary-color'
            "
            @click="mode = opt.value"
          >
            {{ opt.label }}
          </button>
        </li>
      </ul>
    </nav>

    <div class="tp-card rounded bg-base-foreground p-4 pl-5 pr-5">

      <!-- Browse mode -->
      <template v-if="mode === 'browse'">
        <!-- Base URL selector -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-base-content mb-1">
            API Server
          </label>
          <div class="flex gap-2">
            <select
              v-model="selectedBaseUrl"
              class="box-border flex-1 p-1.5 px-2 text-base-content rounded border border-base-border sm:text-sm focus:ring-1 focus:ring-secondary-color focus:border-secondary-color bg-base-foreground"
              @change="onBaseUrlChange"
            >
              <option
                value=""
                disabled
              >
                Select a server...
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
              class="px-3 py-1.5 rounded-md text-sm bg-base-background text-base-content border border-base-border hover:bg-base-muted"
              :disabled="!selectedBaseUrl || loading"
              :class="{
                'opacity-50 cursor-not-allowed': !selectedBaseUrl || loading
              }"
              @click="refresh"
            >
              ↻
            </button>
          </div>
        </div>

        <!-- Loading state -->
        <div
          v-if="loading"
          class="flex items-center gap-2 py-4 text-sm text-base-soft"
        >
          <svg
            class="animate-spin h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Loading projects...
        </div>

        <!-- Error state -->
        <div
          v-else-if="error"
          class="rounded-md bg-danger/10 text-danger text-sm p-3 mb-4"
        >
          <p class="font-medium">Failed to load projects</p>
          <p class="mt-1">{{ error }}</p>
          <button
            class="mt-2 text-xs underline hover:no-underline"
            @click="refresh"
          >
            Retry
          </button>
        </div>

        <!-- Project selector -->
        <template v-else-if="projects.length > 0">
          <div class="mb-4">
            <label class="block text-sm font-medium text-base-content mb-1">
              Project
            </label>

            <select
              v-model="selectedProjectToken"
              class="box-border w-full p-1.5 px-2 text-base-content rounded border border-base-border sm:text-sm focus:ring-1 focus:ring-secondary-color focus:border-secondary-color bg-base-foreground"
              @change="onProjectSelect"
            >
              <option
                value=""
                disabled
              >
                Select a project...
              </option>
              <option
                v-for="project in sortedProjects"
                :key="project.project_token"
                :value="project.project_token"
              >
                {{ project.name }}
              </option>
            </select>

            <p class="text-xs text-base-soft mt-1">
              {{ projects.length }} project{{
                projects.length === 1 ? '' : 's'
              }}
              available
            </p>
          </div>

          <!-- Selected project summary -->
          <div
            v-if="selectedProjectToken"
            class="rounded-md bg-success/10 text-sm p-3 mb-4"
          >
            <p class="font-medium text-base-content">
              {{ selectedProject?.name }}
            </p>
            <p class="text-base-soft mt-1 text-xs font-mono break-all">
              Token: {{ selectedProjectToken }}
            </p>
          </div>
        </template>

        <div
          v-else-if="selectedBaseUrl && !loading"
          class="text-sm text-base-soft py-2"
        >
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
        class="rounded bg-base-background p-3 mb-4 text-xs"
      >
        <p class="font-medium text-base-content mb-1">Current configuration</p>
        <p class="text-base-soft">
          URL: <span class="font-mono">{{ currentUrl || '(not set)' }}</span>
        </p>
        <p class="text-base-soft">
          Token:
          <span class="font-mono">{{ currentToken || '(not set)' }}</span>
        </p>
      </div>

      <!-- Save button -->
      <div class="flex gap-2 mt-4">
        <button
          class="px-3 py-1 rounded-md bg-secondary-color text-secondary-content hover:bg-secondary-color/80 text-sm"
          :disabled="!isFileDirty(section.file)"
          :class="{
            'opacity-50 cursor-not-allowed': !isFileDirty(section.file)
          }"
          @click="saveConfig(section.file)"
        >
          Save {{ section.label }}
        </button>
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
