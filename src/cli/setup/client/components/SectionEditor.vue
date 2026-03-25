<template>
  <div>
    <!-- Section header -->
    <div class="mb-6">
      <h2 class="text-xl font-semibold text-base-content tracking-tight">{{ section.label }}</h2>
      <p v-if="section.description" class="text-sm text-base-soft mt-1.5 leading-relaxed">
        {{ section.description }}
      </p>
    </div>

    <!-- Status overview -->
    <StatusOverview v-if="section.editor === 'status'" />

    <!-- API Connection editor -->
    <ApiConnectionEditor v-else-if="section.editor === 'api-connection'" :section="section" />

    <!-- Packages editor -->
    <PackagesEditor v-else-if="section.editor === 'packages'" />

    <!-- Custom module editor -->
    <component
      v-else-if="section.editor === 'custom' && section.component"
      :is="loadCustomEditor(section.component)"
      :section="section"
    />

    <!-- Standard form fields -->
    <div v-else class="tp-card p-5 sm:p-6">
      <div class="space-y-1">
        <template v-for="(field, key) in section.fields" :key="key">
          <ObjectEditor
            v-if="field.type === 'object'"
            :field="field"
            :model-value="getConfigValue(section.file, key)"
            @update:model-value="setConfigValue(section.file, key, $event)"
          />

          <ArrayEditor
            v-else-if="field.type === 'array'"
            :field="field"
            :model-value="getConfigValue(section.file, key)"
            @update:model-value="setConfigValue(section.file, key, $event)"
          />

          <FormField
            v-else
            :field="field"
            :model-value="getConfigValue(section.file, key)"
            @update:model-value="setConfigValue(section.file, key, $event)"
          />
        </template>
      </div>

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
import { defineAsyncComponent } from 'vue'
import FormField from './FormField.vue'
import ArrayEditor from './ArrayEditor.vue'
import ObjectEditor from './ObjectEditor.vue'
import PackagesEditor from './PackagesEditor.vue'
import ApiConnectionEditor from './ApiConnectionEditor.vue'
import StatusOverview from './StatusOverview.vue'
import { useConfig } from '../composables/useConfig.js'

defineProps({
  section: { type: Object, required: true }
})

const { getConfigValue, setConfigValue, saveConfig, isFileDirty } = useConfig()

const editorCache = new Map()

function loadCustomEditor(componentPath) {
  if (!editorCache.has(componentPath)) {
    editorCache.set(
      componentPath,
      defineAsyncComponent(() => import(/* @vite-ignore */ componentPath))
    )
  }

  return editorCache.get(componentPath)
}
</script>
