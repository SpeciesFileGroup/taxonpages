<template>
  <div>
    <!-- Tab bar (matching TaxonPages TabMenu/TabItem pattern) -->
    <nav class="mb-4">
      <ul class="inline-flex items-center gap-0.5 flex-wrap">
        <li
          v-for="(tab, tabKey) in taxaPage"
          :key="tabKey"
          class="inline-flex items-center text-sm"
        >
          <button
            class="block py-2 px-3 text-base-content border-b-2 transition-colors"
            :class="activeTab === tabKey
              ? 'border-secondary-color text-secondary-color'
              : 'border-transparent hover:text-secondary-color'"
            @click="activeTab = tabKey"
          >
            {{ tab.label || tabKey }}
          </button>
        </li>
        <li class="inline-flex items-center">
          <button
            class="block py-2 px-3 text-sm border-b-2 border-transparent text-base-soft hover:text-secondary-color"
            @click="addTab"
          >
            + Add Tab
          </button>
        </li>
      </ul>
    </nav>

    <!-- Active tab content -->
    <div v-if="activeTab && taxaPage[activeTab]" class="tp-card rounded bg-base-foreground">
      <!-- Tab settings -->
      <div class="p-4 pl-5 pr-5 border-b border-base-muted">
        <div class="flex gap-3 flex-wrap items-end">
          <div class="flex-1 min-w-[140px]">
            <label class="block text-sm font-medium text-base-content mb-1">Tab Key</label>
            <input
              type="text"
              class="box-border w-full p-1.5 px-2 text-base-content rounded border border-base-border sm:text-sm focus:ring-1 focus:ring-secondary-color focus:border-secondary-color"
              :value="activeTab"
              @change="renameTab(activeTab, $event.target.value)"
            >
          </div>
          <div class="flex-1 min-w-[140px]">
            <label class="block text-sm font-medium text-base-content mb-1">Label</label>
            <input
              type="text"
              class="box-border w-full p-1.5 px-2 text-base-content rounded border border-base-border sm:text-sm placeholder:text-sm focus:ring-1 focus:ring-secondary-color focus:border-secondary-color"
              :value="taxaPage[activeTab].label || ''"
              placeholder="Uses tab key if empty"
              @input="updateTabProp(activeTab, 'label', $event.target.value || undefined)"
            >
          </div>
          <div class="flex-1 min-w-[180px]">
            <label class="block text-sm font-medium text-base-content mb-1">Rank Groups</label>
            <input
              type="text"
              class="box-border w-full p-1.5 px-2 text-base-content rounded border border-base-border sm:text-sm placeholder:text-sm focus:ring-1 focus:ring-secondary-color focus:border-secondary-color"
              :value="(taxaPage[activeTab].rank_group || []).join(', ')"
              placeholder="e.g. SpeciesGroup, GenusGroup"
              @change="updateTabProp(activeTab, 'rank_group', parseRankGroups($event.target.value))"
            >
          </div>
          <button
            class="px-2 py-1 rounded text-xs text-danger border border-danger hover:bg-danger hover:text-white transition-colors"
            @click="removeTab(activeTab)"
          >
            Remove Tab
          </button>
        </div>
      </div>

      <!-- Rows -->
      <div class="p-4 pl-5 pr-5">
        <div
          v-for="(row, rowIdx) in taxaPage[activeTab].panels"
          :key="rowIdx"
          class="border border-base-border rounded mb-3 p-3"
        >
          <div class="flex justify-between items-center mb-2">
            <span class="text-xs font-semibold uppercase tracking-wide text-base-soft">
              Row {{ rowIdx + 1 }}
            </span>
            <button
              class="px-2 py-0.5 rounded text-xs text-danger border border-danger hover:bg-danger hover:text-white transition-colors"
              @click="removeRow(rowIdx)"
            >
              Remove Row
            </button>
          </div>

          <div class="flex gap-2 items-start">
            <!-- Columns -->
            <div
              v-for="(col, colIdx) in row"
              :key="colIdx"
              class="flex-1 min-w-[150px] bg-base-background rounded p-2"
            >
              <div class="flex justify-between items-center mb-2">
                <span class="text-xs font-semibold uppercase tracking-wide text-base-soft">
                  Col {{ colIdx + 1 }}
                </span>
                <button
                  class="w-5 h-5 flex items-center justify-center rounded text-xs text-danger hover:bg-danger hover:text-white transition-colors"
                  @click="removeColumn(rowIdx, colIdx)"
                >
                  &times;
                </button>
              </div>

              <!-- Panel items -->
              <div
                v-for="(panel, panelIdx) in col"
                :key="panelIdx"
                class="bg-base-foreground border border-base-border rounded mb-1 cursor-grab active:cursor-grabbing"
                draggable="true"
                @dragstart="onDragStart($event, rowIdx, colIdx, panelIdx)"
                @dragover.prevent
                @drop="onDrop($event, rowIdx, colIdx, panelIdx)"
              >
                <div class="flex items-center gap-1.5 px-2 py-1">
                  <span class="text-base-soft text-xs cursor-grab">&#x2630;</span>
                  <span class="flex-1 text-sm font-mono text-base-content">{{ getPanelId(panel) }}</span>
                  <button
                    v-if="hasBind(panel)"
                    class="px-1.5 py-0.5 rounded text-xs border border-base-border text-base-soft hover:bg-base-muted transition-colors"
                    @click="toggleBindEditor(rowIdx, colIdx, panelIdx)"
                  >
                    bind
                  </button>
                  <button
                    class="w-5 h-5 flex items-center justify-center rounded text-xs text-danger hover:bg-danger hover:text-white transition-colors"
                    @click="removePanel(rowIdx, colIdx, panelIdx)"
                  >
                    &times;
                  </button>
                </div>

                <!-- Bind editor -->
                <div
                  v-if="isBindEditorOpen(rowIdx, colIdx, panelIdx)"
                  class="px-2 pb-2 pt-1 border-t border-base-border"
                >
                  <label class="block text-xs font-medium text-base-content mb-1">Bind (JSON)</label>
                  <input
                    type="text"
                    class="box-border w-full p-1 px-2 text-base-content rounded border border-base-border text-xs focus:ring-1 focus:ring-secondary-color focus:border-secondary-color"
                    :value="JSON.stringify(panel.bind || {})"
                    @change="updatePanelBind(rowIdx, colIdx, panelIdx, $event.target.value)"
                  >
                </div>
              </div>

              <!-- Add panel picker -->
              <select
                class="w-full p-1 rounded text-xs border border-dashed border-base-border text-base-soft bg-transparent cursor-pointer hover:border-secondary-color transition-colors"
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
              class="px-2 py-1 rounded-md text-xs border border-base-border text-base-soft hover:bg-base-muted whitespace-nowrap self-stretch transition-colors"
              @click="addColumn(rowIdx)"
            >
              + Col
            </button>
          </div>
        </div>

        <button
          class="px-3 py-1 rounded-md text-sm border border-base-border text-base-content hover:bg-base-muted transition-colors"
          @click="addRow"
        >
          + Add Row
        </button>
      </div>
    </div>

    <div class="flex gap-2 mt-4">
      <button
        class="px-3 py-1 rounded-md bg-secondary-color text-secondary-content hover:bg-opacity-80 text-sm"
        :disabled="!isFileDirty('taxa_page.yml')"
        :class="{ 'opacity-50 cursor-not-allowed': !isFileDirty('taxa_page.yml') }"
        @click="saveConfig('taxa_page.yml')"
      >
        Save Layout
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
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
