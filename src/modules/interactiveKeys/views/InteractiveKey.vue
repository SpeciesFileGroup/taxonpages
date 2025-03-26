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
  --distinguish-primary-content-color: rgb(var(--color-primary-content));
  --distinguish-bg-color: rgb(var(--color-base-foreground));
  --distinguish-bg-panel-color: rgb(var(--color-base-foreground));
  --distinguish-bg-modal-color: rgb(var(--color-base-foreground));
  --distinguish-bg-disabled-color: #e5e5e5;
  --distinguish-disabled-color: #999;
  --distinguish-error-color: rgb(var(--color-danger));
  --distinguish-primary-color: rgb(var(--color-primary));
  --distinguish-border-color: #cccccc;
  --distinguish-link-color: rgb(var(--color-secondary));
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
  color: rgb(var(--color-base-content));
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
