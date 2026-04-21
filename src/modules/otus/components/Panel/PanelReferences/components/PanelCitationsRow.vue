<template>
  <li class="border-b border-base-muted p-3 px-5">
    <span v-html="sanitizeAndLinkifyHtml(citation.source.cached)" />
    <VBadge
      class="ml-1"
      color="blue"
      shape="pill"
      size="sm"
      weight="normal"
      >{{ citationType }}</VBadge
    >
    <VBadge
      v-for="topic in citation.topics"
      color="yellow"
      class="ml-1"
      weight="normal"
      shape="pill"
      size="sm"
    >
      {{ topic.name }}
    </VBadge>
  </li>
</template>

<script setup>
import { computed } from 'vue'
import { sanitizeAndLinkifyHtml } from '@/utils'

const props = defineProps({
  citation: {
    type: Object,
    required: true
  }
})

const citationType = computed(() =>
  [props.citation.citation_object_type, props.citation.pages]
    .filter(Boolean)
    .join(':')
)
</script>
