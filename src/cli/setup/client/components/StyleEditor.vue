<template>
  <div>
    <!-- Presets -->
    <div class="mb-6">
      <h3 class="text-sm font-semibold text-base-content mb-3">Presets</h3>
      <div class="grid grid-cols-3 gap-3">
        <div
          v-for="preset in PRESETS"
          :key="preset.name"
          class="tp-card p-4 space-y-2.5"
        >
          <div>
            <div class="text-sm font-semibold text-base-content">{{ preset.name }}</div>
            <div class="text-xs text-base-soft leading-relaxed">{{ preset.description }}</div>
          </div>
          <div class="flex gap-1">
            <span
              v-for="color in preset.swatches"
              :key="color"
              class="w-6 h-6 rounded-md border border-base-border/50"
              :style="{ backgroundColor: color }"
            />
          </div>
          <button
            class="tp-btn tp-btn-outline tp-btn-sm w-full"
            @click="applyPreset(preset)"
          >
            Apply
          </button>
        </div>
      </div>
    </div>

    <!-- Mode tabs -->
    <div class="flex gap-1 p-1 bg-base-muted rounded-lg mb-5 w-fit">
      <button
        v-for="mode in ['light', 'dark']"
        :key="mode"
        class="px-3.5 py-1.5 rounded-md text-sm font-medium transition-all duration-150 capitalize"
        :class="activeMode === mode
          ? 'bg-base-foreground text-base-content shadow-sm'
          : 'text-base-soft hover:text-base-content'"
        @click="activeMode = mode"
      >
        {{ mode }}
      </button>
    </div>

    <!-- Variable groups -->
    <div class="space-y-5">
      <div
        v-for="group in variableGroups"
        :key="group.label"
        class="tp-card"
      >
        <div class="px-5 pt-4 pb-2">
          <h3 class="text-sm font-semibold text-base-content">{{ group.label }}</h3>
        </div>
        <div class="px-5 pb-4 space-y-3">
          <div
            v-for="v in group.vars"
            :key="v.key"
            class="flex items-center gap-3"
          >
            <label class="text-sm text-base-soft w-48 shrink-0 font-mono text-xs">
              {{ v.key }}
            </label>

            <!-- Color input -->
            <template v-if="v.type === 'color'">
              <div class="relative">
                <input
                  type="color"
                  class="w-9 h-9 rounded-md border border-base-border cursor-pointer bg-transparent p-0.5"
                  :value="rgbToHex(getVarValue(v.key) || getDefault(v.key))"
                  @input="setVarFromHex(v.key, $event.target.value)"
                >
              </div>
              <input
                type="text"
                class="tp-input flex-1 font-mono text-xs"
                :value="getVarValue(v.key)"
                :placeholder="getDefault(v.key)"
                @change="setVar(v.key, $event.target.value)"
              >
            </template>

            <!-- Number/opacity input -->
            <template v-else-if="v.type === 'range'">
              <input
                type="range"
                class="flex-1"
                min="0"
                max="1"
                step="0.05"
                :value="getVarValue(v.key) || getDefault(v.key) || 0.5"
                @input="setVar(v.key, $event.target.value)"
              >
              <span class="text-xs text-base-soft font-mono w-10 text-right">
                {{ getVarValue(v.key) || getDefault(v.key) || '—' }}
              </span>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Save -->
    <div class="flex items-center gap-3 mt-5">
      <button
        class="tp-btn tp-btn-primary"
        :disabled="!dirty"
        @click="save"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Save Theme
      </button>
      <span v-if="dirty" class="text-xs text-warning font-medium">
        Unsaved changes
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { DEFAULTS, PRESETS, VARIABLE_GROUPS as variableGroups } from './styleConstants.js'

const activeMode = ref('light')
const styleData = reactive({ light: {}, dark: {} })
const dirty = ref(false)

function getVarValue(key) {
  return styleData[activeMode.value]?.[key] || ''
}

function getDefault(key) {
  return DEFAULTS[activeMode.value]?.[key] || ''
}

function applyPreset(preset) {
  styleData.light = { ...preset.light }
  styleData.dark = { ...preset.dark }
  dirty.value = true
}

function setVar(key, value) {
  if (!value) {
    delete styleData[activeMode.value][key]
  } else {
    styleData[activeMode.value][key] = value
  }
  dirty.value = true
}

function setVarFromHex(key, hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  setVar(key, `rgb(${r}, ${g}, ${b})`)
}

function rgbToHex(rgb) {
  const match = (rgb || 'rgb(0, 0, 0)').match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
  if (!match) return '#000000'

  const r = parseInt(match[1])
  const g = parseInt(match[2])
  const b = parseInt(match[3])

  return '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')
}

async function save() {
  try {
    const res = await fetch('/api/style', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ light: styleData.light, dark: styleData.dark })
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Save failed')
    }

    dirty.value = false
  } catch (err) {
    console.error('Failed to save theme:', err)
  }
}

onMounted(async () => {
  try {
    const res = await fetch('/api/style')
    const data = await res.json()

    styleData.light = data.light || {}
    styleData.dark = data.dark || {}
  } catch {
    styleData.light = {}
    styleData.dark = {}
  }
})
</script>
