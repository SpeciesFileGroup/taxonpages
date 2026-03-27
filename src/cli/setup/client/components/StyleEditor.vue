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

const PRESETS = [
  {
    name: 'Chitin',
    description: 'Earth tones inspired by beetle exoskeletons and entomological specimen drawers.',
    swatches: ['rgb(62, 47, 35)', 'rgb(166, 94, 7)', 'rgb(249, 246, 240)', 'rgb(38, 30, 20)', 'rgb(14, 159, 132)'],
    light: {
      '--tp-primary': 'rgb(62, 47, 35)',
      '--tp-primary-content': 'rgb(255, 248, 235)',
      '--tp-secondary': 'rgb(166, 94, 7)',
      '--tp-secondary-content': 'rgb(255, 255, 255)',
      '--tp-secondary-on-dark': 'rgb(245, 171, 53)',
      '--tp-success': 'rgb(22, 163, 74)',
      '--tp-warning': 'rgb(202, 138, 4)',
      '--tp-danger': 'rgb(220, 53, 53)',
      '--tp-base-foreground': 'rgb(255, 255, 255)',
      '--tp-base-background': 'rgb(249, 246, 240)',
      '--tp-base-muted': 'rgb(235, 228, 216)',
      '--tp-base-soft': 'rgb(113, 103, 89)',
      '--tp-base-lighter': 'rgb(72, 63, 52)',
      '--tp-base-border': 'rgb(214, 204, 189)',
      '--tp-base-content': 'rgb(38, 30, 20)',
      '--tp-map-georeference': 'rgb(220, 53, 53)',
      '--tp-map-aggregate': 'rgb(22, 138, 54)',
      '--tp-map-asserted': 'rgb(232, 119, 12)',
      '--tp-map-asserted-absent': 'rgb(128, 71, 168)',
      '--tp-map-type-material': 'rgb(37, 120, 220)',
      '--tp-map-collection-object': 'rgb(194, 65, 105)',
      '--tp-map-field-occurrence': 'rgb(14, 159, 132)',
      '--tp-scrollbar-thumb': 'rgb(172, 160, 143)',
      '--tp-scrollbar-track': 'rgb(235, 228, 216)'
    },
    dark: {
      '--tp-primary': 'rgb(38, 30, 22)',
      '--tp-primary-content': 'rgb(245, 237, 224)',
      '--tp-secondary': 'rgb(232, 156, 40)',
      '--tp-secondary-content': 'rgb(30, 20, 8)',
      '--tp-secondary-on-dark': 'rgb(232, 156, 40)',
      '--tp-success': 'rgb(34, 197, 94)',
      '--tp-warning': 'rgb(234, 170, 30)',
      '--tp-danger': 'rgb(239, 83, 83)',
      '--tp-base-foreground': 'rgb(42, 36, 28)',
      '--tp-base-background': 'rgb(28, 23, 17)',
      '--tp-base-muted': 'rgb(56, 48, 38)',
      '--tp-base-soft': 'rgb(189, 178, 163)',
      '--tp-base-lighter': 'rgb(214, 204, 190)',
      '--tp-base-border': 'rgb(72, 62, 50)',
      '--tp-base-content': 'rgb(240, 233, 222)',
      '--tp-scrollbar-thumb': 'rgb(113, 103, 89)',
      '--tp-scrollbar-track': 'rgb(42, 36, 28)'
    }
  },
  {
    name: 'Bathyal',
    description: 'Deep ocean blues and bioluminescent accents from mesopelagic marine ecosystems.',
    swatches: ['rgb(18, 32, 64)', 'rgb(0, 128, 140)', 'rgb(240, 245, 250)', 'rgb(14, 24, 42)', 'rgb(0, 168, 142)'],
    light: {
      '--tp-primary': 'rgb(18, 32, 64)',
      '--tp-primary-content': 'rgb(224, 240, 255)',
      '--tp-secondary': 'rgb(0, 128, 140)',
      '--tp-secondary-content': 'rgb(255, 255, 255)',
      '--tp-secondary-on-dark': 'rgb(56, 210, 224)',
      '--tp-success': 'rgb(16, 163, 94)',
      '--tp-warning': 'rgb(224, 148, 8)',
      '--tp-danger': 'rgb(210, 48, 62)',
      '--tp-base-foreground': 'rgb(255, 255, 255)',
      '--tp-base-background': 'rgb(240, 245, 250)',
      '--tp-base-muted': 'rgb(218, 228, 240)',
      '--tp-base-soft': 'rgb(90, 105, 124)',
      '--tp-base-lighter': 'rgb(52, 66, 86)',
      '--tp-base-border': 'rgb(195, 210, 228)',
      '--tp-base-content': 'rgb(14, 24, 42)',
      '--tp-map-georeference': 'rgb(220, 50, 50)',
      '--tp-map-aggregate': 'rgb(28, 148, 56)',
      '--tp-map-asserted': 'rgb(240, 124, 16)',
      '--tp-map-asserted-absent': 'rgb(136, 72, 176)',
      '--tp-map-type-material': 'rgb(24, 100, 210)',
      '--tp-map-collection-object': 'rgb(200, 60, 110)',
      '--tp-map-field-occurrence': 'rgb(0, 168, 142)',
      '--tp-scrollbar-thumb': 'rgb(148, 164, 184)',
      '--tp-scrollbar-track': 'rgb(218, 228, 240)'
    },
    dark: {
      '--tp-primary': 'rgb(10, 18, 36)',
      '--tp-primary-content': 'rgb(200, 225, 255)',
      '--tp-secondary': 'rgb(40, 200, 212)',
      '--tp-secondary-content': 'rgb(8, 16, 32)',
      '--tp-secondary-on-dark': 'rgb(40, 200, 212)',
      '--tp-success': 'rgb(34, 197, 110)',
      '--tp-warning': 'rgb(240, 176, 40)',
      '--tp-danger': 'rgb(240, 80, 90)',
      '--tp-base-foreground': 'rgb(22, 32, 52)',
      '--tp-base-background': 'rgb(12, 20, 38)',
      '--tp-base-muted': 'rgb(32, 44, 68)',
      '--tp-base-soft': 'rgb(158, 178, 202)',
      '--tp-base-lighter': 'rgb(195, 210, 228)',
      '--tp-base-border': 'rgb(44, 58, 82)',
      '--tp-base-content': 'rgb(220, 232, 248)',
      '--tp-scrollbar-thumb': 'rgb(72, 88, 112)',
      '--tp-scrollbar-track': 'rgb(22, 32, 52)'
    }
  },
  {
    name: 'Stipule',
    description: 'Muted sage greens and warm clay tones evoking pressed herbarium sheets.',
    swatches: ['rgb(40, 56, 36)', 'rgb(164, 82, 42)', 'rgb(245, 245, 238)', 'rgb(28, 32, 24)', 'rgb(18, 154, 136)'],
    light: {
      '--tp-primary': 'rgb(40, 56, 36)',
      '--tp-primary-content': 'rgb(238, 245, 233)',
      '--tp-secondary': 'rgb(164, 82, 42)',
      '--tp-secondary-content': 'rgb(255, 255, 255)',
      '--tp-secondary-on-dark': 'rgb(222, 148, 100)',
      '--tp-success': 'rgb(34, 168, 82)',
      '--tp-warning': 'rgb(212, 148, 12)',
      '--tp-danger': 'rgb(200, 50, 50)',
      '--tp-base-foreground': 'rgb(255, 255, 255)',
      '--tp-base-background': 'rgb(245, 245, 238)',
      '--tp-base-muted': 'rgb(226, 228, 216)',
      '--tp-base-soft': 'rgb(104, 110, 96)',
      '--tp-base-lighter': 'rgb(62, 68, 56)',
      '--tp-base-border': 'rgb(204, 208, 194)',
      '--tp-base-content': 'rgb(28, 32, 24)',
      '--tp-map-georeference': 'rgb(204, 48, 48)',
      '--tp-map-aggregate': 'rgb(34, 140, 60)',
      '--tp-map-asserted': 'rgb(228, 118, 18)',
      '--tp-map-asserted-absent': 'rgb(118, 74, 162)',
      '--tp-map-type-material': 'rgb(42, 112, 210)',
      '--tp-map-collection-object': 'rgb(192, 58, 106)',
      '--tp-map-field-occurrence': 'rgb(18, 154, 136)',
      '--tp-scrollbar-thumb': 'rgb(164, 170, 154)',
      '--tp-scrollbar-track': 'rgb(226, 228, 216)'
    },
    dark: {
      '--tp-primary': 'rgb(24, 30, 22)',
      '--tp-primary-content': 'rgb(220, 228, 214)',
      '--tp-secondary': 'rgb(212, 140, 90)',
      '--tp-secondary-content': 'rgb(28, 18, 10)',
      '--tp-secondary-on-dark': 'rgb(212, 140, 90)',
      '--tp-success': 'rgb(48, 200, 100)',
      '--tp-warning': 'rgb(236, 178, 42)',
      '--tp-danger': 'rgb(232, 78, 78)',
      '--tp-base-foreground': 'rgb(34, 38, 30)',
      '--tp-base-background': 'rgb(22, 26, 20)',
      '--tp-base-muted': 'rgb(48, 52, 42)',
      '--tp-base-soft': 'rgb(180, 186, 172)',
      '--tp-base-lighter': 'rgb(208, 212, 200)',
      '--tp-base-border': 'rgb(62, 66, 54)',
      '--tp-base-content': 'rgb(232, 236, 226)',
      '--tp-scrollbar-thumb': 'rgb(96, 102, 86)',
      '--tp-scrollbar-track': 'rgb(34, 38, 30)'
    }
  }
]

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
