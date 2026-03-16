<template>
  <div
    v-if="loading"
    class="flex items-center justify-center min-h-screen bg-base-background text-base-content"
  >
    Loading...
  </div>

  <template v-else>
    <!-- Sidebar -->
    <nav class="fixed top-0 left-0 bottom-0 bg-base-foreground border-r border-base-border overflow-y-auto" style="width: var(--sidebar-width);">
      <div class="p-4 pl-5 pr-5 border-b border-base-muted font-medium text-base-content">
        TaxonPages Setup
      </div>

      <template v-for="(group, groupKey) in schema" :key="groupKey">
        <div class="text-xs font-semibold uppercase tracking-wide text-base-soft px-4 pt-3 pb-1">
          {{ group.label }}
        </div>
        <button
          v-for="(section, sectionKey) in group.sections"
          :key="sectionKey"
          class="block w-full text-left py-1.5 px-4 pl-6 text-sm text-base-content transition-colors duration-150"
          :class="activeSection === `${groupKey}.${sectionKey}`
            ? 'bg-secondary-color/10 text-secondary-color font-medium'
            : 'hover:bg-base-background'"
          @click="activeSection = `${groupKey}.${sectionKey}`"
        >
          {{ section.label }}
          <span
            v-if="isFileDirty(section.file)"
            class="text-warning ml-1"
          >*</span>
        </button>
      </template>
    </nav>

    <!-- Main content -->
    <main class="flex-1 p-6 pb-16 max-w-3xl" style="margin-left: var(--sidebar-width);">
      <SectionEditor
        v-if="currentSection"
        :key="activeSection"
        :section="currentSection"
      />
    </main>

    <!-- Status bar -->
    <div
      class="fixed bottom-0 right-0 bg-base-foreground border-t border-base-border px-6 py-2 text-sm"
      style="left: var(--sidebar-width);"
    >
      <span
        :class="{
          'text-success': status === 'saved',
          'text-warning': isDirty,
          'text-danger': status === 'error'
        }"
      >
        <template v-if="status === 'saving'">Saving...</template>
        <template v-else-if="status === 'saved'">{{ statusMessage }}</template>
        <template v-else-if="status === 'error'">Error: {{ statusMessage }}</template>
        <template v-else-if="isDirty">Unsaved changes</template>
        <template v-else>Ready</template>
      </span>
    </div>

    <!-- Toast -->
    <Transition name="toast">
      <div
        v-if="toast"
        class="fixed top-4 right-4 py-2 px-4 rounded-md text-sm text-white z-50"
        :class="toast.type === 'error' ? 'bg-danger' : 'bg-success'"
      >
        {{ toast.message }}
      </div>
    </Transition>
  </template>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useConfig } from './composables/useConfig.js'
import SectionEditor from './components/SectionEditor.vue'

const {
  schema,
  status,
  statusMessage,
  isDirty,
  loadSchema,
  loadAllConfig,
  isFileDirty
} = useConfig()

const loading = ref(true)
const activeSection = ref('')
const toast = ref(null)

const currentSection = computed(() => {
  if (!activeSection.value || !schema.value) return null
  const [groupKey, sectionKey] = activeSection.value.split('.')
  return schema.value[groupKey]?.sections?.[sectionKey] || null
})

watch(status, (val) => {
  if (val === 'saved') {
    toast.value = { type: 'success', message: statusMessage.value }
    setTimeout(() => { toast.value = null }, 2000)
  } else if (val === 'error') {
    toast.value = { type: 'error', message: statusMessage.value }
    setTimeout(() => { toast.value = null }, 4000)
  }
})

onMounted(async () => {
  await Promise.all([loadSchema(), loadAllConfig()])
  loading.value = false

  if (schema.value) {
    const firstGroup = Object.keys(schema.value)[0]
    const firstSection = Object.keys(schema.value[firstGroup].sections)[0]
    activeSection.value = `${firstGroup}.${firstSection}`
  }
})
</script>

<style scoped>
.toast-enter-active { animation: slideIn 0.2s ease-out; }
.toast-leave-active { animation: slideIn 0.2s ease-out reverse; }

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
</style>
