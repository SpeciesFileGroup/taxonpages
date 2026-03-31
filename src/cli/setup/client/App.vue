<template>
  <!-- Loading screen -->
  <div
    v-if="loading"
    class="flex flex-col items-center justify-center min-h-screen bg-base-background"
  >
    <div class="flex flex-col items-center gap-4">
      <div class="tp-spinner" style="width: 2rem; height: 2rem; border-width: 2.5px;" />
      <div class="text-sm text-base-soft font-medium">Loading configuration…</div>
    </div>
  </div>

  <template v-else>
    <div class="flex min-h-screen">
      <!-- Sidebar -->
      <nav class="fixed top-0 left-0 bottom-0 flex flex-col bg-sidebar-bg overflow-y-auto" style="width: var(--sidebar-width);">
        <!-- Brand -->
        <div class="px-5 pt-5 pb-4">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-secondary-color/20 flex items-center justify-center">
              <svg class="w-4.5 h-4.5 text-sidebar-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <div class="text-sm font-semibold text-white tracking-tight">TaxonPages</div>
              <div class="text-[11px] text-sidebar-muted font-medium">Setup Wizard</div>
            </div>
          </div>
        </div>

        <div class="h-px bg-sidebar-border mx-4 mb-2" />

        <!-- Navigation -->
        <div class="flex-1 px-3 pb-4 space-y-4">
          <div v-for="(group, groupKey) in schema" :key="groupKey">
            <div class="flex items-center gap-2 px-2 mb-1">
              <span class="text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted">
                {{ group.label }}
              </span>
              <span
                v-if="getGroupDirtyCount(groupKey) > 0"
                class="w-1.5 h-1.5 rounded-full bg-warning"
              />
            </div>

            <button
              v-for="(section, sectionKey) in group.sections"
              :key="sectionKey"
              class="group flex items-center gap-2.5 w-full text-left py-1.5 px-2.5 rounded-lg text-[13px] transition-all duration-150"
              :class="activeSection === `${groupKey}.${sectionKey}`
                ? 'bg-sidebar-active text-sidebar-accent font-medium'
                : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white'"
              @click="activeSection = `${groupKey}.${sectionKey}`"
            >
              <span
                class="w-1.5 h-1.5 rounded-full shrink-0 transition-colors"
                :class="activeSection === `${groupKey}.${sectionKey}`
                  ? 'bg-sidebar-accent'
                  : isFileDirty(section.file) ? 'bg-warning' : 'bg-sidebar-muted/50'"
              />
              <span class="truncate">{{ section.label }}</span>
            </button>
          </div>
        </div>

        <!-- Sidebar footer -->
        <div class="px-4 py-3 border-t border-sidebar-border">
          <div class="flex items-center gap-2 text-[11px] text-sidebar-muted">
            <span
              class="w-2 h-2 rounded-full"
              :class="isDirty ? 'bg-warning' : 'bg-success'"
            />
            <span>{{ isDirty ? 'Unsaved changes' : 'All saved' }}</span>
          </div>
        </div>
      </nav>

      <!-- Main content -->
      <main class="flex-1 min-h-screen" style="margin-left: var(--sidebar-width);">
        <!-- Top bar -->
        <header class="sticky top-0 z-10 bg-base-background/80 backdrop-blur-sm border-b border-base-border">
          <div class="max-w-4xl mx-auto px-8 py-3.5 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <nav v-if="currentGroupLabel" class="flex items-center gap-1.5 text-sm">
                <span class="text-base-soft">{{ currentGroupLabel }}</span>
                <svg class="w-3.5 h-3.5 text-base-soft/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                <span class="font-medium text-base-content">{{ currentSection?.label }}</span>
              </nav>
            </div>
            <Transition name="status-fade">
              <div
                v-if="status === 'saving'"
                class="flex items-center gap-2 text-xs text-base-soft"
              >
                <div class="tp-spinner-sm" />
                <span>Saving…</span>
              </div>
            </Transition>
          </div>
        </header>

        <!-- Content area -->
        <div class="max-w-4xl mx-auto px-8 py-8">
          <Transition name="section" mode="out-in">
            <SectionEditor
              v-if="currentSection"
              :key="activeSection"
              :section="currentSection"
            />
          </Transition>
        </div>
      </main>
    </div>

    <!-- Toast -->
    <Transition name="toast">
      <div
        v-if="toast"
        class="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 py-3 px-4 rounded-xl text-sm font-medium shadow-lg"
        :class="toast.type === 'error'
          ? 'bg-danger text-white'
          : 'bg-base-content text-base-foreground'"
      >
        <svg v-if="toast.type !== 'error'" class="w-4 h-4 text-success shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        <svg v-else class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" />
        </svg>
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

const currentGroupLabel = computed(() => {
  if (!activeSection.value || !schema.value) return ''
  const [groupKey] = activeSection.value.split('.')
  return schema.value[groupKey]?.label || ''
})

function getGroupDirtyCount(groupKey) {
  if (!schema.value?.[groupKey]?.sections) return 0
  return Object.values(schema.value[groupKey].sections)
    .filter(s => s.file && isFileDirty(s.file))
    .length
}

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
.toast-enter-active { animation: toastIn 0.25s ease-out; }
.toast-leave-active { animation: toastIn 0.2s ease-in reverse; }

@keyframes toastIn {
  from { transform: translateY(12px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.status-fade-enter-active,
.status-fade-leave-active {
  transition: opacity 0.2s ease;
}
.status-fade-enter-from,
.status-fade-leave-to {
  opacity: 0;
}
</style>
