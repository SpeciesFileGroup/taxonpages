<template>
  <div>
    <div class="flex items-center gap-2">
      <button
        class="px-3 py-1 rounded-md text-sm border border-base-border text-base-content hover:bg-base-muted"
        :disabled="testing || !hasUrl"
        :class="{ 'opacity-50 cursor-not-allowed': testing || !hasUrl }"
        @click="run"
      >
        {{ testing ? 'Testing...' : 'Test connection' }}
      </button>
      <span v-if="!hasUrl" class="text-xs text-base-soft">
        Configure API URL first
      </span>
    </div>

    <div
      v-if="result"
      class="rounded-md text-sm p-3 mt-3"
      :class="result.success ? 'bg-success/10' : 'bg-danger/10'"
    >
      <p
        class="font-medium"
        :class="result.success ? 'text-success' : 'text-danger'"
      >
        {{ result.success ? 'Connected' : 'Connection failed' }}
      </p>
      <p class="text-base-soft mt-1 text-xs">{{ result.message }}</p>
      <p
        v-if="result.projectName"
        class="text-base-content mt-1 text-xs"
      >
        Project: <span class="font-medium">{{ result.projectName }}</span>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useConfig } from '../composables/useConfig.js'
import { useStatus } from '../composables/useStatus.js'

const { getConfigValue } = useConfig()
const { testConnection } = useStatus()

const testing = ref(false)
const result = ref(null)

const hasUrl = computed(() => {
  const url = getConfigValue('api.yml', 'url')
  return url && url.trim().length > 0
})

async function run() {
  testing.value = true
  result.value = null

  try {
    const url = getConfigValue('api.yml', 'url')
    const token = getConfigValue('api.yml', 'project_token')
    result.value = await testConnection(url, token)
  } catch (err) {
    result.value = {
      success: false,
      message: err.message || 'Connection test failed'
    }
  } finally {
    testing.value = false
  }
}
</script>
