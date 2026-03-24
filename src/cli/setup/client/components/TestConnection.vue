<template>
  <div class="mb-5">
    <div class="flex items-center gap-3">
      <button
        class="tp-btn tp-btn-outline"
        :disabled="testing || !hasUrl"
        @click="run"
      >
        <div v-if="testing" class="tp-spinner-sm" />
        <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        {{ testing ? 'Testing…' : 'Test connection' }}
      </button>
      <span v-if="!hasUrl" class="text-xs text-base-soft">
        Configure API URL first
      </span>
    </div>

    <Transition name="section">
      <div
        v-if="result"
        class="rounded-lg p-4 mt-4"
        :class="result.success ? 'bg-success-light/50 border border-success/20' : 'bg-danger-light border border-danger/20'"
      >
        <div class="flex items-start gap-3">
          <svg v-if="result.success" class="w-5 h-5 text-success shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <svg v-else class="w-5 h-5 text-danger shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p
              class="font-medium text-sm"
              :class="result.success ? 'text-success' : 'text-danger'"
            >
              {{ result.success ? 'Connected successfully' : 'Connection failed' }}
            </p>
            <p class="text-xs text-base-soft mt-1">{{ result.message }}</p>
            <p
              v-if="result.projectName"
              class="text-xs text-base-content mt-1"
            >
              Project: <span class="font-semibold">{{ result.projectName }}</span>
            </p>
          </div>
        </div>
      </div>
    </Transition>
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
