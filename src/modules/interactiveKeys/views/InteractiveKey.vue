<template>
  <div
    class="flex flex-col h-full overflow-y-hidden container mx-auto interactive-key-container"
  >
    <ClientOnly>
      <VueInteractiveKey v-bind="options">
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
import '@sfgrp/distinguish/dist/distinguish.css'

const route = useRoute()

const options = ref({
  observationMatrixId: route.params.id,
  apiConfig: {
    baseURL: __APP_ENV__.url,
    projectToken: __APP_ENV__.project_token
  }
})
</script>

<style>
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

.interactive-key-container {
  max-height: calc(100vh - 12rem);

  hr {
    @apply my-4;
  }
}

.distinguish-grid {
  @apply shadow-md rounded border-base-muted;
}

.distinguish-header-bar {
  @apply rounded-t-md;
}

.distinguish-app-container {
  h2 {
    @apply text-lg my-2;
  }
}

.distinguish-app-container {
  color: var(--tp-base-content);
}

.distinguish-modal-header h3 {
  @apply text-lg;
}

.distinguish-btn {
  @apply px-4 py-1 rounded-none text-sm;
}

.distinguish-title {
  @apply text-xl my-4;
}

.distinguish-row-filter-buttons {
  @apply my-4;
}
</style>
