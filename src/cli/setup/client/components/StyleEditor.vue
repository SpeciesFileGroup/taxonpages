<template>
  <div>
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
import { ref, reactive, computed, onMounted } from 'vue'

const DEFAULTS = {
  light: {
    '--tp-primary': 'rgb(0, 0, 0)',
    '--tp-primary-content': 'rgb(255, 255, 255)',
    '--tp-secondary': 'rgb(3, 105, 161)',
    '--tp-secondary-content': 'rgb(255, 255, 255)',
    '--tp-secondary-on-dark': 'rgb(56, 189, 248)',
    '--tp-success': 'rgb(34, 197, 94)',
    '--tp-warning': 'rgb(245, 158, 11)',
    '--tp-danger': 'rgb(239, 68, 68)',
    '--tp-base-foreground': 'rgb(255, 255, 255)',
    '--tp-base-background': 'rgb(245, 247, 251)',
    '--tp-base-muted': 'rgb(226, 232, 240)',
    '--tp-base-soft': 'rgb(107, 114, 128)',
    '--tp-base-lighter': 'rgb(55, 65, 81)',
    '--tp-base-border': 'rgb(203, 213, 225)',
    '--tp-base-content': 'rgb(0, 0, 0)',
    '--tp-map-georeference': 'rgb(239, 68, 68)',
    '--tp-map-aggregate': 'rgb(3, 115, 22)',
    '--tp-map-asserted': 'rgb(249, 115, 22)',
    '--tp-map-asserted-absent': 'rgb(106, 81, 163)',
    '--tp-map-type-material': 'rgb(51, 136, 255)',
    '--tp-map-collection-object': 'rgb(239, 68, 68)',
    '--tp-map-field-occurrence': 'rgb(49, 163, 84)',
    '--tp-scrollbar-thumb': 'rgb(156, 163, 175)',
    '--tp-scrollbar-track': 'rgb(229, 231, 235)',
    '--tp-map-shape-opacity': '0.5',
    '--tp-map-marker-opacity': '0.75'
  },
  dark: {
    '--tp-primary': 'rgb(23, 23, 23)',
    '--tp-primary-content': 'rgb(255, 255, 255)',
    '--tp-secondary': 'rgb(14, 165, 233)',
    '--tp-secondary-content': 'rgb(255, 255, 255)',
    '--tp-secondary-on-dark': 'rgb(14, 165, 233)',
    '--tp-success': 'rgb(22, 163, 74)',
    '--tp-warning': 'rgb(217, 119, 6)',
    '--tp-danger': 'rgb(185, 28, 28)',
    '--tp-base-background': 'rgb(23, 23, 23)',
    '--tp-base-foreground': 'rgb(38, 38, 38)',
    '--tp-base-muted': 'rgb(48, 48, 48)',
    '--tp-base-soft': 'rgb(200, 200, 200)',
    '--tp-base-lighter': 'rgb(220, 220, 220)',
    '--tp-base-border': 'rgb(70, 70, 70)',
    '--tp-base-content': 'rgb(255, 255, 255)',
    '--tp-scrollbar-thumb': 'rgb(156, 163, 175)',
    '--tp-scrollbar-track': 'rgb(55, 65, 81)'
  }
}

const variableGroups = [
  {
    label: 'Brand',
    vars: [
      { key: '--tp-primary', type: 'color' },
      { key: '--tp-primary-content', type: 'color' },
      { key: '--tp-secondary', type: 'color' },
      { key: '--tp-secondary-content', type: 'color' },
      { key: '--tp-secondary-on-dark', type: 'color' }
    ]
  },
  {
    label: 'Semantic',
    vars: [
      { key: '--tp-success', type: 'color' },
      { key: '--tp-warning', type: 'color' },
      { key: '--tp-danger', type: 'color' }
    ]
  },
  {
    label: 'Base Theme',
    vars: [
      { key: '--tp-base-foreground', type: 'color' },
      { key: '--tp-base-background', type: 'color' },
      { key: '--tp-base-muted', type: 'color' },
      { key: '--tp-base-soft', type: 'color' },
      { key: '--tp-base-lighter', type: 'color' },
      { key: '--tp-base-border', type: 'color' },
      { key: '--tp-base-content', type: 'color' }
    ]
  },
  {
    label: 'Map Markers',
    vars: [
      { key: '--tp-map-georeference', type: 'color' },
      { key: '--tp-map-aggregate', type: 'color' },
      { key: '--tp-map-asserted', type: 'color' },
      { key: '--tp-map-asserted-absent', type: 'color' },
      { key: '--tp-map-type-material', type: 'color' },
      { key: '--tp-map-collection-object', type: 'color' },
      { key: '--tp-map-field-occurrence', type: 'color' }
    ]
  },
  {
    label: 'Map Settings',
    vars: [
      { key: '--tp-map-shape-opacity', type: 'range' },
      { key: '--tp-map-marker-opacity', type: 'range' }
    ]
  },
  {
    label: 'Scrollbar',
    vars: [
      { key: '--tp-scrollbar-thumb', type: 'color' },
      { key: '--tp-scrollbar-track', type: 'color' }
    ]
  }
]

const activeMode = ref('light')
const styleData = reactive({ light: {}, dark: {} })
const dirty = ref(false)

function getVarValue(key) {
  return styleData[activeMode.value]?.[key] || ''
}

function getDefault(key) {
  return DEFAULTS[activeMode.value]?.[key] || ''
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
