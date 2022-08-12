<template>
  <div
    class="
      flex
      justify-start
      border-b
      p-3
      px-4
      dark:border-b-slate-700"
  >
    <div 
      class="h-5 w-5 text-secondary-color opacity-60 mr-2 cursor-pointer"
      @click="isExpanded = !isExpanded"
    >
      <IconArrowRight 
        v-if="!isExpanded"
        class="h-5 w-5"
      />
      <IconArrowDown
        v-else
        class="h-5 w-5"
      />
    </div>
 
    <div>
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
  </div>
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