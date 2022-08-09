<template>
  <li>
    <ButtonExpand
      v-if="false"
      v-model="isExpanded"
      class="mr-2"
    />
    <div>
      <svg 
        v-if="!isExpanded"
        xmlns="http://www.w3.org/2000/svg" 
        class="h-6 w-6 text-primary-700 opacity-60 mr-2"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
        @click="isExpanded = !isExpanded"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>

      <svg
        v-else
        xmlns="http://www.w3.org/2000/svg" 
        class="h-6 w-6 text-primary-700 opacity-60 mr-2" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
        stroke-width="2"
        @click="isExpanded = !isExpanded"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
 
    <div class="pt-0.5">
      <div v-if="isExpanded">
        <span v-html="citation.source.label" />
        <span v-if="citation.pages">
          :{{ citation.pages }}
        </span>
      </div>

      <span
        v-else
        :title="citation.source.label"
        v-html="citation.citation_source_body"
      />
    </div>
  </li>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  citation: {
    type: Object,
    required: true
  }
})

const isExpanded = ref(false)

</script>