<template>
  <li class="flex justify-start mb-1">
    <ButtonExpand
      v-model="isExpanded"
      class="mr-2"
    /> 
    <div>
      <template v-if="isExpanded">
        <span v-html="citation.source.label" />
        <span v-if="citation.pages">
          :{{ citation.pages }}
        </span>
      </template>

      <span
        v-else
        :title="citation.source.label"
        v-html="citation.citation_source_body"
      />
    </div>
  </li>
</template>

<script setup>
import ButtonExpand from '@/components/Button/ButtonExpand.vue'
import { ref } from 'vue';

defineProps({
  citation: {
    type: Object,
    required: true
  }
})

const isExpanded = ref(false)

const toggleCitation = () => {
  isExpanded.value = !isExpanded.value
}
</script>