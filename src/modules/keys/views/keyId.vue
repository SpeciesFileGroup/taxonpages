<template>
  <div class="flex flex-col h-full container mx-auto">
    <ClientOnly>
      <VuePinpoint
        ref="pinpoint"
        v-bind="options"
      >
        <template #title="{ metadata }">
          <div class="flex gap-2 justify-center items-center">
            <h1>{{ metadata.title }}</h1>
            <MetadataModal :metadata="metadata" />
          </div>
        </template>
        <template #button-up-label>
          <div class="flex gap-2 items-center">
            <IconArrowUp class="h-3" /> Back <IconArrowUp class="h-3" />
          </div>
        </template>
        <template #button-next-label>
          <div class="flex gap-2 items-center">
            <IconArrowDown class="h-3" /> Next <IconArrowDown class="h-3" />
          </div>
        </template>
        <template #target="{ id, label }">
          <RouterLink
            :to="{ name: 'otus-id', params: { id } }"
            v-html="label"
          />
        </template>
      </VuePinpoint>
    </ClientOnly>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { ref } from 'vue'
import { VuePinpoint } from '@sfgrp/pinpoint'
import '@sfgrp/pinpoint/dist/pinpoint.css'
import MetadataModal from '../components/MetadataModal.vue'

const route = useRoute()

const options = ref({
  leadId: route.params.id,
  baseUrl: __APP_ENV__.url,
  projectToken: __APP_ENV__.project_token
})
</script>

<style>
.pinpoint-app {
  @apply py-4 flex flex-col gap-4;
  ul {
    @apply ml-4;
  }
}

.pinpoint-tree {
  @apply pb-1;

  li {
    @apply text-secondary-color;
  }
}

.pinpoint-previous-list-item {
  @apply text-secondary-color;
}

.pinpoint-previous-couplets {
  h2 {
    @apply px-5;
    @apply p-4 pl-5 pr-5 border-b font-medium border-base-muted flex justify-between;
  }
}

.pinpoint-previous-list {
  @apply py-4 px-1;
}

.pinpoint-couplet {
  @apply flex  flex-col gap-4;
}

.pinpoint-couplet-container {
  @apply flex flex-col justify-center items-center;
}

.pinpoint-couplet-node {
  h1 {
    @apply px-5;
    @apply p-4 pl-5 pr-5 border-b font-medium border-base-muted flex justify-between;
  }

  div {
    display: none;
  }
}

.pinpoint-node-container {
  @apply px-5;

  h3 {
    @apply text-lg text-center my-4;
  }
}

.pinpoint-button-go {
  display: none;
}
.pinpoint-button-up,
.pinpoint-node-next-button {
  @apply px-3 py-1 hover:bg-opacity-80 bg-primary-color text-primary-content text-sm items-center;
}

.pinpoint-node-next-container {
  @apply flex justify-center mb-4;
}

pinpoint-button-up::before {
  content: 's';
}

.pinpoint-node-target {
  @apply my-4;
}

.pinpoint-key-title {
  @apply text-center text-xl;
}

.pinpoint-couplet-node,
.pinpoint-previous-couplets,
.pinpoint-node,
.pinpoint-node-container {
  @apply border-base-muted bg-base-foreground print:shadow-none print:border-0 rounded;
  box-shadow: rgba(30, 41, 59, 0.04) 0 2px 4px 0;
  border: 1px solid rgba(98, 105, 118, 0.16);
  transition: transform 0.3s ease-out, opacity 0.3s ease-out,
    box-shadow 0.3s ease-out;
}

.pinpoint-node {
  @apply px-4;
}

.pinpoint-couplet-node {
  @apply min-w-96 flex justify-center;

  .pinpoint-node-target {
    @apply mx-5;
  }
}

.pinpoint-couplet-children-container {
  @apply gap-4;
  @apply grid-cols-1;
  @apply md:grid-cols-[repeat(auto-fit,minmax(100px,1fr))];
}
</style>
