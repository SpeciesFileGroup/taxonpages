<template>
  <div
    class="flex flex-col h-full overflow-y-hidden container mx-auto interactive-key-container"
  >
    <ClientOnly>
      <VueInteractiveKey v-bind="options">
        <template #remaining-row-filter="{ selectedIds, rows }">
          <ImageMatrixButton
            :rows="rows"
            :selectedIds="selectedIds"
          />
        </template>
        <template #remaining-item="{ item }">
          <RouterLink
            v-if="item.observationObjectType === OTU"
            :to="{ name: 'otus-id', params: { id: item.observationObjectId } }"
            v-html="item.objectTag"
          />
          <span
            v-else
            v-html="item.objectTag"
          />
        </template>
        <template #eliminated-item="{ item }">
          <RouterLink
            v-if="item.observationObjectType === OTU"
            :to="{ name: 'otus-id', params: { id: item.observationObjectId } }"
            v-html="item.objectTag"
          />
          <span
            v-else
            v-html="item.objectTag"
          />
        </template>
      </VueInteractiveKey>
    </ClientOnly>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { ref } from 'vue'
import { OTU } from '@/constants/objectTypes.js'
import { VueInteractiveKey } from '@sfgrp/distinguish'
import ImageMatrixButton from '../components/ImageMatrixButton.vue'
import '@sfgrp/distinguish/dist/distinguish.css'

const route = useRoute()
const query = route.query
const { url, project_token } = __APP_ENV__

const options = ref({
  observationMatrixId: Number(route.params.id),
  otuId: parseOtuId(query.otu_filter),
  apiConfig: {
    baseURL: url,
    projectToken: project_token
  }
})

function parseOtuId(otuId) {
  if (!otuId) {
    return []
  }

  return otuId
    .split('|')
    .map((id) => Number(id.trim()))
    .filter((id) => !isNaN(id))
}
</script>

<style>
@reference "@/assets/css/tailwind.css";

:root {
  --distinguish-primary-content-color: var(--tp-primary-content);
  --distinguish-bg-color: var(--tp-base-foreground);
  --distinguish-bg-panel-color: var(--tp-base-foreground);
  --distinguish-bg-modal-color: var(--tp-base-foreground);
  --distinguish-bg-disabled-color: var(--tp-base-muted);
  --distinguish-disabled-color: var(--tp-base-soft);
  --distinguish-error-color: var(--tp-danger);
  --distinguish-primary-color: var(--tp-primary);
  --distinguish-border-color: var(--tp-base-border);
  --distinguish-link-color: var(--tp-secondary);
  --distinguish-btn-medium-size: 20px;
}

.distinguish-app-container {
  @apply font-main shadow-2xl border border-base-border;

  & > .distinguish-title-section {
    @apply bg-base-foreground px-4 border-b border-base-border;
  }
}

.interactive-key-container {
  max-height: calc(100vh - 12rem);
  height: calc(100vh - 12rem);

  hr {
    @apply my-4;
  }
}

.distinguish-header-bar {
  @apply rounded-t-lg;
}

.distinguish-panel {
  h2 {
    @apply text-base font-medium mb-2;
    font-weight: var(--font-weight-medium) !important;
  }
}

.distinguish-app-container {
  color: var(--tp-base-content);
}

.distinguish-modal-header h3 {
  @apply text-lg;
}

.distinguish-btn {
  @apply px-2 py-1.25 rounded-md;
}

.distinguish-title {
  @apply text-lg font-medium my-4;
}

.distinguish-title-citation {
  @apply text-sm  mb-4;
}

.distinguish-row-filter-buttons {
  @apply my-4;
}

.distinguish-grid-icon {
  @apply rounded-none w-3 h-3 border-0;
  background-color: var(--tp-primary);
}
</style>
