<template>
  <div>
    <div class="mb-4">
      <h2 class="text-lg font-medium text-base-content">{{ section.label }}</h2>
      <p v-if="section.description" class="text-sm text-base-soft mt-1">
        {{ section.description }}
      </p>
    </div>

    <!-- API Connection editor (project browser + manual input) -->
    <ApiConnectionEditor v-if="section.editor === 'api-connection'" :section="section" />

    <!-- Layout editor (special type for taxa_page.yml) -->
    <LayoutEditor v-else-if="section.editor === 'layout'" />

    <!-- Packages editor -->
    <PackagesEditor v-else-if="section.editor === 'packages'" />

    <!-- Standard form fields -->
    <div v-else class="tp-card rounded bg-base-foreground p-4 pl-5 pr-5">
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

      <div class="flex gap-2 mt-4">
        <button
          class="px-3 py-1 rounded-md bg-secondary-color text-secondary-content hover:bg-secondary-color/80 text-sm"
          :disabled="!isFileDirty(section.file)"
          :class="{ 'opacity-50 cursor-not-allowed': !isFileDirty(section.file) }"
          @click="saveConfig(section.file)"
        >
          Save {{ section.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import FormField from './FormField.vue'
import ArrayEditor from './ArrayEditor.vue'
import ObjectEditor from './ObjectEditor.vue'
import LayoutEditor from './LayoutEditor.vue'
import PackagesEditor from './PackagesEditor.vue'
import ApiConnectionEditor from './ApiConnectionEditor.vue'
import { useConfig } from '../composables/useConfig.js'

defineProps({
  section: { type: Object, required: true }
})

const { getConfigValue, setConfigValue, saveConfig, isFileDirty } = useConfig()
</script>
