<template>
  <div>
    <!-- Tab bar -->
    <div class="flex items-center gap-1 mb-5">
      <div class="flex gap-1 p-1 bg-base-muted rounded-lg flex-wrap">
        <button
          v-for="(tab, tabKey) in taxaPage"
          :key="tabKey"
          class="px-3.5 py-1.5 rounded-md text-sm font-medium transition-all duration-150"
          :class="activeTab === tabKey
            ? 'bg-base-foreground text-base-content shadow-sm'
            : 'text-base-soft hover:text-base-content'"
          @click="activeTab = tabKey"
        >
          {{ tab.label || tabKey }}
        </button>
      </div>
      <button
        class="tp-btn tp-btn-ghost tp-btn-sm"
        @click="addTab"
      >
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Add Tab
      </button>
    </div>

    <!-- Active tab content -->
    <div v-if="activeTab && taxaPage[activeTab]" class="tp-card">
      <!-- Tab settings -->
      <div class="p-5 border-b border-base-border">
        <div class="flex gap-3 flex-wrap items-end">
          <div class="flex-1 min-w-[140px]">
            <label class="block text-sm font-medium text-base-content mb-1.5">Tab Key</label>
            <input
              type="text"
              class="tp-input"
              :value="activeTab"
              @change="renameTab(activeTab, $event.target.value)"
            >
          </div>
          <div class="flex-1 min-w-[140px]">
            <label class="block text-sm font-medium text-base-content mb-1.5">Label</label>
            <input
              type="text"
              class="tp-input"
              :value="taxaPage[activeTab].label || ''"
              placeholder="Uses tab key if empty"
              @input="updateTabProp(activeTab, 'label', $event.target.value || undefined)"
            >
          </div>
          <div class="flex-1 min-w-[180px]">
            <label class="block text-sm font-medium text-base-content mb-1.5">Rank Groups</label>
            <input
              type="text"
              class="tp-input"
              :value="(taxaPage[activeTab].rank_group || []).join(', ')"
              placeholder="e.g. SpeciesGroup, GenusGroup"
              @change="updateTabProp(activeTab, 'rank_group', parseRankGroups($event.target.value))"
            >
          </div>
          <button
            class="tp-btn tp-btn-danger tp-btn-sm"
            @click="removeTab(activeTab)"
          >
            Remove Tab
          </button>
        </div>
      </div>

      <!-- Rows -->
      <div class="p-5">
        <div
          v-for="(row, rowIdx) in taxaPage[activeTab].panels"
          :key="rowIdx"
          class="border border-base-border rounded-lg mb-3 p-3.5 bg-base-muted/20"
        >
          <div class="flex justify-between items-center mb-3">
            <span class="text-xs font-semibold uppercase tracking-wider text-base-soft">
              Row {{ rowIdx + 1 }}
            </span>
            <button
              class="tp-btn tp-btn-danger tp-btn-sm"
              @click="removeRow(rowIdx)"
            >
              Remove
            </button>
          </div>

          <div class="flex gap-2.5 items-start">
            <!-- Columns -->
            <div
              v-for="(col, colIdx) in row"
              :key="colIdx"
              class="flex-1 min-w-[150px] bg-base-background rounded-lg p-2.5 border border-base-border/50"
            >
              <div class="flex justify-between items-center mb-2">
                <span class="text-[10px] font-semibold uppercase tracking-wider text-base-soft">
                  Col {{ colIdx + 1 }}
                </span>
                <button
                  class="w-5 h-5 flex items-center justify-center rounded text-base-soft hover:bg-danger hover:text-white transition-colors"
                  @click="removeColumn(rowIdx, colIdx)"
                >
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <!-- Panel items -->
              <div
                v-for="(panel, panelIdx) in col"
                :key="panelIdx"
                class="bg-base-foreground border border-base-border rounded-md mb-1.5 cursor-grab active:cursor-grabbing hover:border-secondary-color/40 transition-colors"
                draggable="true"
                @dragstart="onDragStart($event, rowIdx, colIdx, panelIdx)"
                @dragover.prevent
                @drop="onDrop($event, rowIdx, colIdx, panelIdx)"
              >
                <div class="flex items-center gap-1.5 px-2.5 py-1.5">
                  <span class="text-base-soft/50 cursor-grab">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4 8h16M4 16h16" />
                    </svg>
                  </span>
                  <span class="flex-1 text-sm font-mono text-base-content">{{ getPanelId(panel) }}</span>
                  <button
                    v-if="hasBind(panel) || getPanelSchema(getPanelId(panel))"
                    class="tp-btn tp-btn-ghost tp-btn-sm !px-1.5 !py-0.5"
                    @click="toggleBindEditor(rowIdx, colIdx, panelIdx)"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  <button
                    class="w-5 h-5 flex items-center justify-center rounded text-base-soft hover:bg-danger hover:text-white transition-colors"
                    @click="removePanel(rowIdx, colIdx, panelIdx)"
                  >
                    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <!-- Bind editor -->
                <div
                  v-if="isBindEditorOpen(rowIdx, colIdx, panelIdx)"
                  class="px-2.5 pb-2.5 pt-1.5 border-t border-base-border"
                >
                  <PanelConfigEditor
                    v-if="getPanelSchema(getPanelId(panel))"
                    :schema="getPanelSchema(getPanelId(panel))"
                    :model-value="typeof panel === 'object' ? (panel.bind || {}) : {}"
                    @update:model-value="updatePanelBindObject(rowIdx, colIdx, panelIdx, $event)"
                  />
                  <template v-else>
                    <label class="block text-xs font-medium text-base-content mb-1">Bind (JSON)</label>
                    <input
                      type="text"
                      class="tp-input text-xs"
                      :value="JSON.stringify(panel.bind || {})"
                      @change="updatePanelBind(rowIdx, colIdx, panelIdx, $event.target.value)"
                    >
                  </template>
                </div>
              </div>

              <!-- Add panel picker -->
              <select
                class="tp-select text-xs mt-1.5 !border-dashed !bg-transparent"
                @change="addPanel(rowIdx, colIdx, $event)"
              >
                <option value="">+ Add panel</option>
                <option
                  v-for="p in availablePanels"
                  :key="p.id"
                  :value="p.id"
                >
                  {{ p.id }} ({{ p.source }})
                </option>
              </select>
            </div>

            <button
              class="tp-btn tp-btn-outline tp-btn-sm whitespace-nowrap self-stretch"
              @click="addColumn(rowIdx)"
            >
              + Col
            </button>
          </div>
        </div>

        <button
          class="tp-btn tp-btn-outline"
          @click="addRow"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Row
        </button>
      </div>
    </div>

    <div class="flex items-center gap-3 mt-5">
      <button
        class="tp-btn tp-btn-primary"
        :disabled="!isFileDirty('taxa_page.yml')"
        @click="saveConfig('taxa_page.yml')"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Save Layout
      </button>
      <span v-if="isFileDirty('taxa_page.yml')" class="text-xs text-warning font-medium">
        Unsaved changes
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import PanelConfigEditor from './PanelConfigEditor.vue'
import { useConfig } from '../composables/useConfig.js'

const {
  configData,
  setConfigValue,
  saveConfig,
  isFileDirty
} = useConfig()

const activeTab = ref('')
const availablePanels = ref([])
const bindEditorKey = ref(null)
const dragSource = ref(null)

const taxaPage = computed(() => {
  return configData['taxa_page.yml']?.taxa_page || {}
})

function markDirty() {
  setConfigValue('taxa_page.yml', 'taxa_page', { ...taxaPage.value })
}

// --- Tab operations ---

function addTab() {
  const key = prompt('Tab key (e.g. my_tab):')
  if (!key) return

  const tp = { ...taxaPage.value }
  tp[key] = { panels: [[[]]] }
  setConfigValue('taxa_page.yml', 'taxa_page', tp)
  activeTab.value = key
}

function removeTab(tabKey) {
  if (!confirm(`Remove tab "${tabKey}"?`)) return

  const tp = { ...taxaPage.value }
  delete tp[tabKey]
  setConfigValue('taxa_page.yml', 'taxa_page', tp)

  const keys = Object.keys(tp)
  activeTab.value = keys.length ? keys[0] : ''
}

function renameTab(oldKey, newKey) {
  if (!newKey || newKey === oldKey) return

  const tp = {}
  for (const [k, v] of Object.entries(taxaPage.value)) {
    tp[k === oldKey ? newKey : k] = v
  }

  setConfigValue('taxa_page.yml', 'taxa_page', tp)
  activeTab.value = newKey
}

function updateTabProp(tabKey, prop, value) {
  const tp = { ...taxaPage.value }
  const tab = { ...tp[tabKey] }

  if (value === undefined || (Array.isArray(value) && value.length === 0)) {
    delete tab[prop]
  } else {
    tab[prop] = value
  }

  tp[tabKey] = tab
  setConfigValue('taxa_page.yml', 'taxa_page', tp)
}

function parseRankGroups(str) {
  if (!str.trim()) return []
  return str.split(',').map((s) => s.trim()).filter(Boolean)
}

// --- Row/Column operations ---

function addRow() {
  const tab = taxaPage.value[activeTab.value]
  if (!tab) return

  tab.panels.push([[]])
  markDirty()
}

function removeRow(rowIdx) {
  const tab = taxaPage.value[activeTab.value]
  if (!tab) return

  tab.panels.splice(rowIdx, 1)
  markDirty()
}

function addColumn(rowIdx) {
  const tab = taxaPage.value[activeTab.value]
  if (!tab) return

  tab.panels[rowIdx].push([])
  markDirty()
}

function removeColumn(rowIdx, colIdx) {
  const tab = taxaPage.value[activeTab.value]
  if (!tab) return

  tab.panels[rowIdx].splice(colIdx, 1)

  if (tab.panels[rowIdx].length === 0) {
    tab.panels.splice(rowIdx, 1)
  }

  markDirty()
}

// --- Panel operations ---

function getPanelId(panel) {
  return typeof panel === 'string' ? panel : panel.id
}

function hasBind(panel) {
  return typeof panel === 'object' && panel.bind
}

function addPanel(rowIdx, colIdx, event) {
  const panelId = event.target.value
  if (!panelId) return

  event.target.value = ''

  const tab = taxaPage.value[activeTab.value]
  if (!tab) return

  tab.panels[rowIdx][colIdx].push(panelId)
  markDirty()
}

function removePanel(rowIdx, colIdx, panelIdx) {
  const tab = taxaPage.value[activeTab.value]
  if (!tab) return

  tab.panels[rowIdx][colIdx].splice(panelIdx, 1)
  markDirty()
}

function toggleBindEditor(rowIdx, colIdx, panelIdx) {
  const key = `${rowIdx}-${colIdx}-${panelIdx}`
  bindEditorKey.value = bindEditorKey.value === key ? null : key
}

function isBindEditorOpen(rowIdx, colIdx, panelIdx) {
  return bindEditorKey.value === `${rowIdx}-${colIdx}-${panelIdx}`
}

function getPanelSchema(panelId) {
  const panel = availablePanels.value.find((p) => p.id === panelId)
  return panel?.configSchema || null
}

function updatePanelBindObject(rowIdx, colIdx, panelIdx, bind) {
  const tab = taxaPage.value[activeTab.value]
  if (!tab) return

  const panel = tab.panels[rowIdx][colIdx][panelIdx]
  const id = getPanelId(panel)

  if (Object.keys(bind).length === 0) {
    tab.panels[rowIdx][colIdx][panelIdx] = id
  } else {
    tab.panels[rowIdx][colIdx][panelIdx] = { id, bind }
  }

  markDirty()
}

function updatePanelBind(rowIdx, colIdx, panelIdx, jsonStr) {
  const tab = taxaPage.value[activeTab.value]
  if (!tab) return

  try {
    const bind = JSON.parse(jsonStr)
    const panel = tab.panels[rowIdx][colIdx][panelIdx]
    const id = getPanelId(panel)

    if (Object.keys(bind).length === 0) {
      tab.panels[rowIdx][colIdx][panelIdx] = id
    } else {
      tab.panels[rowIdx][colIdx][panelIdx] = { id, bind }
    }

    markDirty()
  } catch {
    // Invalid JSON, ignore
  }
}

// --- Drag and drop ---

function onDragStart(event, rowIdx, colIdx, panelIdx) {
  dragSource.value = { rowIdx, colIdx, panelIdx }
  event.dataTransfer.effectAllowed = 'move'
}

function onDrop(event, toRow, toCol, toPanel) {
  const from = dragSource.value
  if (!from) return

  const tab = taxaPage.value[activeTab.value]
  if (!tab) return

  const fromCol = tab.panels[from.rowIdx][from.colIdx]
  const [moved] = fromCol.splice(from.panelIdx, 1)

  const toColArr = tab.panels[toRow][toCol]
  toColArr.splice(toPanel, 0, moved)

  dragSource.value = null
  markDirty()
}

// --- Init ---

onMounted(async () => {
  const keys = Object.keys(taxaPage.value)
  if (keys.length) {
    activeTab.value = keys[0]
  }

  try {
    const res = await fetch('/api/panels')
    availablePanels.value = await res.json()
  } catch {
    availablePanels.value = []
  }
})
</script>
