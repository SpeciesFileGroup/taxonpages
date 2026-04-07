<template>
  <VModal
    v-if="isModalVisible"
    @close="() => (isModalVisible = false)"
  >
    <template #header>
      <h3 class="font-medium">{{ title }}</h3>
    </template>
    <div class="px-4 pt-0 min-h-72">
      <VSpinner v-if="isLoading" />
      <template v-else-if="hasData">
        <div
          v-for="(group, index) in groupedEntries"
          :key="group.category"
          class="pb-4"
        >
          <h4
            class="text-xs font-semibold uppercase tracking-wide text-base-soft mb-3 px-4 rounded-lg bg-base-background py-2"
          >
            {{ group.category }}
          </h4>
          <dl class="grid grid-cols-[12rem_1fr] gap-x-4 gap-y-1.5 px-6">
            <template
              v-for="entry in group.entries"
              :key="entry.key"
            >
              <dt class="text-sm text-base-soft">
                {{ getLabel(entry.key) }}
              </dt>
              <dd class="text-sm text-base-content">
                <component
                  :is="fieldComponents[entry.transformed.type]"
                  v-bind="entry.transformed"
                />
              </dd>
            </template>
          </dl>
        </div>
      </template>
    </div>
  </VModal>
</template>

<script setup>
import { ref } from 'vue'
import { makeAPIRequest } from '@/utils'
import { FIELD_OCCURRENCE, COLLECTION_OBJECT } from '@/constants/objectTypes'
import {
  groupEntries,
  getLabel,
  transformEntries,
  HIDDEN_FIELDS
} from './DwcCategories.js'
import DwcFieldText from './DwcFieldText.vue'
import DwcFieldImages from './DwcFieldImages.vue'

const fieldComponents = {
  text: DwcFieldText,
  images: DwcFieldImages
}

const isLoading = ref(false)
const isModalVisible = ref(false)
const groupedEntries = ref([])
const title = ref()

const hasData = ref(false)

const TYPES = {
  [COLLECTION_OBJECT]: (id) => `/collection_objects/${id}/dwc`,
  [FIELD_OCCURRENCE]: (id) => `/field_occurrences/${id}/dwc`
}

async function show({ label, id, type }) {
  isModalVisible.value = true
  isLoading.value = true
  groupedEntries.value = []
  hasData.value = false
  title.value = label

  try {
    const { data } = await makeAPIRequest(TYPES[type](id))

    const entries = Object.entries(data).filter(
      ([key, value]) => value != null && value !== '' && !HIDDEN_FIELDS.has(key)
    )

    const transformed = await transformEntries(entries)

    groupedEntries.value = groupEntries(transformed)
    hasData.value = transformed.length > 0
  } catch {
    // silently fail
  } finally {
    isLoading.value = false
  }
}

defineExpose({
  show
})
</script>
