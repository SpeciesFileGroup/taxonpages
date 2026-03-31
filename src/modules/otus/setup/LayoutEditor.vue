<template>
  <div>
    <!-- Tab bar -->
    <div class="flex items-center gap-1 mb-5">
      <div class="flex gap-1 p-1 bg-base-muted rounded-lg flex-wrap">
        <button
          v-for="(tab, tabKey) in layoutData"
          :key="tabKey"
          class="px-3.5 py-1.5 rounded-md text-sm font-medium transition-all duration-150 cursor-grab active:cursor-grabbing"
          :class="activeTab === tabKey
            ? 'bg-base-foreground text-base-content shadow-sm'
            : 'text-base-soft hover:text-base-content'"
          draggable="true"
          @dragstart="onTabDragStart($event, tabKey)"
          @dragover.prevent
          @drop="onTabDrop($event, tabKey)"
          @click="activeTab = tabKey"
        >
          <span class="inline-flex items-center gap-1.5">
            <svg class="w-3 h-3 text-base-soft/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 8h16M4 16h16" />
            </svg>
            {{ tab.label || tabKey }}
          </span>
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
    <div v-if="activeTab && layoutData[activeTab]" class="tp-card">
      <!-- Tab settings -->
      <div class="p-5 border-b border-base-border space-y-4">
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
              :value="layoutData[activeTab].label || ''"
              placeholder="Uses tab key if empty"
              @input="updateTabProp(activeTab, 'label', $event.target.value || undefined)"
            >
          </div>
          <button
            class="tp-btn tp-btn-danger tp-btn-sm"
            @click="removeTab(activeTab)"
          >
            Remove Tab
          </button>
        </div>
        <RankGroupSelector
          :model-value="layoutData[activeTab].rank_group || []"
          label="Tab visible for rank groups"
          @update:model-value="updateTabProp(activeTab, 'rank_group', $event)"
        />
      </div>

      <!-- Rows -->
      <div class="p-5">
        <div
          v-for="(row, rowIdx) in layoutData[activeTab].panels"
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
                class="bg-base-foreground border border-base-border rounded-md mb-1.5 cursor-grab active:cursor-grabbing hover:border-secondary/40 transition-colors"
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
                    class="tp-btn tp-btn-ghost tp-btn-sm !px-1.5 !py-0.5"
                    @click="openPanelModal(rowIdx, colIdx, panelIdx)"
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
              v-if="row.length < MAX_COLUMNS"
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
        :disabled="!isFileDirty(fileName)"
        @click="saveConfig(fileName)"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Save Layout
      </button>
      <span v-if="isFileDirty(fileName)" class="text-xs text-warning font-medium">
        Unsaved changes
      </span>
    </div>

    <!-- Panel settings modal -->
    <Teleport to="body">
      <div
        v-if="panelModal"
        class="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div
          class="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
          @click="closePanelModal"
        />
        <div class="relative tp-card w-full max-w-lg mx-4 shadow-xl">
          <div class="flex items-center justify-between p-5 border-b border-base-border">
            <h3 class="text-sm font-semibold text-base-content">
              <span class="font-mono">{{ getPanelId(modalPanel) }}</span>
            </h3>
            <button
              class="w-7 h-7 flex items-center justify-center rounded-md text-base-soft hover:bg-base-muted hover:text-base-content transition-colors"
              @click="closePanelModal"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
            <RankGroupSelector
              :model-value="getPanelRankGroup(modalPanel)"
              label="Panel visible for rank groups"
              @update:model-value="updatePanelRankGroup(panelModal.rowIdx, panelModal.colIdx, panelModal.panelIdx, $event)"
            />
            <PanelConfigEditor
              v-if="getPanelSchema(getPanelId(modalPanel))"
              :schema="getPanelSchema(getPanelId(modalPanel))"
              :model-value="typeof modalPanel === 'object' ? (modalPanel.bind || {}) : {}"
              @update:model-value="updatePanelBindObject(panelModal.rowIdx, panelModal.colIdx, panelModal.panelIdx, $event)"
            />
            <div v-else-if="hasBind(modalPanel)">
              <label class="block text-sm font-medium text-base-content mb-1.5">Bind (JSON)</label>
              <input
                type="text"
                class="tp-input"
                :value="JSON.stringify(modalPanel.bind || {})"
                @change="updatePanelBind(panelModal.rowIdx, panelModal.colIdx, panelModal.panelIdx, $event.target.value)"
              >
            </div>
          </div>
          <div class="flex justify-end p-5 border-t border-base-border">
            <button
              class="tp-btn tp-btn-primary tp-btn-sm"
              @click="closePanelModal"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import PanelConfigEditor from '@setup/components/PanelConfigEditor.vue'
import RankGroupSelector from './RankGroupSelector.vue'
import { injectConfig } from '@setup/composables/useConfig.js'
import { DEFAULT_OVERVIEW_LAYOUT } from '../constants/layouts/overview.js'

const props = defineProps({
  section: { type: Object, required: true }
})

const {
  configData,
  setConfigValue,
  saveConfig,
  isFileDirty
} = injectConfig()

const MAX_COLUMNS = 3

const fileName = computed(() => props.section.file)
const configKey = computed(() => props.section.configKey || fileName.value.replace('.yml', ''))

const activeTab = ref('')
const availablePanels = ref([])
const panelModal = ref(null)
const dragSource = ref(null)
const tabDragSource = ref(null)

const modalPanel = computed(() => {
  if (!panelModal.value) return null
  const { rowIdx, colIdx, panelIdx } = panelModal.value
  const tab = layoutData.value[activeTab.value]
  return tab?.panels?.[rowIdx]?.[colIdx]?.[panelIdx] ?? null
})

const layoutData = computed(() => {
  return configData[fileName.value]?.[configKey.value] || {}
})

function markDirty() {
  setConfigValue(fileName.value, configKey.value, { ...layoutData.value })
}

// --- Tab operations ---

function addTab() {
  const key = prompt('Tab key (e.g. my_tab):')
  if (!key) return

  const tp = { ...layoutData.value }
  tp[key] = { panels: [[[]]] }
  setConfigValue(fileName.value, configKey.value, tp)
  activeTab.value = key
}

function removeTab(tabKey) {
  if (!confirm(`Remove tab "${tabKey}"?`)) return

  const tp = { ...layoutData.value }
  delete tp[tabKey]
  setConfigValue(fileName.value, configKey.value, tp)

  const keys = Object.keys(tp)
  activeTab.value = keys.length ? keys[0] : ''
}

function renameTab(oldKey, newKey) {
  if (!newKey || newKey === oldKey) return

  const tp = {}
  for (const [k, v] of Object.entries(layoutData.value)) {
    tp[k === oldKey ? newKey : k] = v
  }

  setConfigValue(fileName.value, configKey.value, tp)
  activeTab.value = newKey
}

function updateTabProp(tabKey, prop, value) {
  const tp = { ...layoutData.value }
  const tab = { ...tp[tabKey] }

  if (value === undefined || (Array.isArray(value) && value.length === 0)) {
    delete tab[prop]
  } else {
    tab[prop] = value
  }

  tp[tabKey] = tab
  setConfigValue(fileName.value, configKey.value, tp)
}

// --- Row/Column operations ---

function addRow() {
  const tab = layoutData.value[activeTab.value]
  if (!tab) return

  tab.panels.push([[]])
  markDirty()
}

function removeRow(rowIdx) {
  const tab = layoutData.value[activeTab.value]
  if (!tab) return

  tab.panels.splice(rowIdx, 1)
  markDirty()
}

function addColumn(rowIdx) {
  const tab = layoutData.value[activeTab.value]
  if (!tab) return
  if (tab.panels[rowIdx].length >= MAX_COLUMNS) return

  tab.panels[rowIdx].push([])
  markDirty()
}

function removeColumn(rowIdx, colIdx) {
  const tab = layoutData.value[activeTab.value]
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

  const tab = layoutData.value[activeTab.value]
  if (!tab) return

  tab.panels[rowIdx][colIdx].push(panelId)
  markDirty()
}

function removePanel(rowIdx, colIdx, panelIdx) {
  const tab = layoutData.value[activeTab.value]
  if (!tab) return

  tab.panels[rowIdx][colIdx].splice(panelIdx, 1)
  markDirty()
}

function openPanelModal(rowIdx, colIdx, panelIdx) {
  panelModal.value = { rowIdx, colIdx, panelIdx }
}

function closePanelModal() {
  panelModal.value = null
}

function getPanelSchema(panelId) {
  const panel = availablePanels.value.find((p) => p.id === panelId)
  return panel?.configSchema || null
}

function rebuildPanelObject(id, bind, rankGroup) {
  const hasBind = bind && Object.keys(bind).length > 0
  const hasRankGroup = rankGroup && rankGroup.length > 0

  if (!hasBind && !hasRankGroup) return id

  const obj = { id }
  if (hasRankGroup) obj.rank_group = rankGroup
  if (hasBind) obj.bind = bind
  return obj
}

function updatePanelBindObject(rowIdx, colIdx, panelIdx, bind) {
  const tab = layoutData.value[activeTab.value]
  if (!tab) return

  const panel = tab.panels[rowIdx][colIdx][panelIdx]
  const id = getPanelId(panel)
  const rankGroup = getPanelRankGroup(panel)

  tab.panels[rowIdx][colIdx][panelIdx] = rebuildPanelObject(id, bind, rankGroup)
  markDirty()
}

function updatePanelBind(rowIdx, colIdx, panelIdx, jsonStr) {
  const tab = layoutData.value[activeTab.value]
  if (!tab) return

  try {
    const bind = JSON.parse(jsonStr)
    const panel = tab.panels[rowIdx][colIdx][panelIdx]
    const id = getPanelId(panel)
    const rankGroup = getPanelRankGroup(panel)

    tab.panels[rowIdx][colIdx][panelIdx] = rebuildPanelObject(id, bind, rankGroup)
    markDirty()
  } catch {
    // Invalid JSON, ignore
  }
}

function getPanelRankGroup(panel) {
  return typeof panel === 'object' ? (panel.rank_group || []) : []
}

function updatePanelRankGroup(rowIdx, colIdx, panelIdx, rankGroup) {
  const tab = layoutData.value[activeTab.value]
  if (!tab) return

  const panel = tab.panels[rowIdx][colIdx][panelIdx]
  const id = getPanelId(panel)
  const bind = typeof panel === 'object' ? panel.bind : undefined

  tab.panels[rowIdx][colIdx][panelIdx] = rebuildPanelObject(id, bind, rankGroup)
  markDirty()
}

// --- Tab drag and drop ---

function onTabDragStart(event, tabKey) {
  tabDragSource.value = tabKey
  event.dataTransfer.effectAllowed = 'move'
}

function onTabDrop(event, targetTabKey) {
  const sourceKey = tabDragSource.value
  tabDragSource.value = null

  if (!sourceKey || sourceKey === targetTabKey) return

  const oldData = layoutData.value
  const keys = Object.keys(oldData)
  const reordered = keys.filter((k) => k !== sourceKey)
  const targetIdx = reordered.indexOf(targetTabKey)
  reordered.splice(targetIdx, 0, sourceKey)

  const newData = {}
  for (const key of reordered) {
    newData[key] = oldData[key]
  }

  setConfigValue(fileName.value, configKey.value, newData)
}

// --- Drag and drop ---

function onDragStart(event, rowIdx, colIdx, panelIdx) {
  dragSource.value = { rowIdx, colIdx, panelIdx }
  event.dataTransfer.effectAllowed = 'move'
}

function onDrop(event, toRow, toCol, toPanel) {
  const from = dragSource.value
  if (!from) return

  const tab = layoutData.value[activeTab.value]
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
  if (!Object.keys(layoutData.value).length) {
    setConfigValue(fileName.value, configKey.value, structuredClone(DEFAULT_OVERVIEW_LAYOUT))
  }

  activeTab.value = Object.keys(layoutData.value)[0] || ''

  try {
    const res = await fetch('/api/panels')
    availablePanels.value = await res.json()
  } catch {
    availablePanels.value = []
  }
})
</script>
