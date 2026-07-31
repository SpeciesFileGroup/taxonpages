<template>
  <li class="border-b border-base-muted p-3 px-5">
    <span v-html="sanitizeAndLinkifyHtml(reference.source.cached)" />
    <VBadge
      v-for="type in citationTypes"
      :key="type"
      class="ml-1"
      color="blue"
      shape="pill"
      size="sm"
      weight="normal"
      >{{ type }}</VBadge
    >
    <VBadge
      v-for="topic in topics"
      :key="topic.id"
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
  reference: {
    type: Object,
    required: true
  }
})

const TYPE_LABELS = {
  Lead: 'Key'
}

const citationTypes = computed(() => {
  const seen = new Set()

  for (const citation of props.reference.citations) {
    const type =
      TYPE_LABELS[citation.citation_object_type] ||
      citation.citation_object_type

    const label = [type, citation.pages].filter(Boolean).join(':')

    seen.add(label)
  }

  return [...seen]
})

const topics = computed(() => {
  const seen = new Map()

  for (const citation of props.reference.citations) {
    for (const topic of citation.topics) {
      seen.set(topic.id, topic)
    }
  }

  return [...seen.values()]
})
</script>
