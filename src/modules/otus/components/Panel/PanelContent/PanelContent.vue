<template>
  <VCard v-if="contents.length">
    <ContentTopic
      v-for="(text, title) in contentList"
      :key="title"
      :title="title"
      :text-list="text"
    />
  </VCard>
</template>

<script setup>
import { computed, ref, onBeforeMount, onBeforeUnmount } from 'vue'
import { useOtuPageRequest } from '@/modules/otus/helpers/useOtuPageRequest'
import TaxonWorks from '../../../services/TaxonWorks'
import ContentTopic from './PanelContentTopic.vue'

const props = defineProps({
  otuId: {
    type: Number,
    required: true
  }
})

const contents = ref([])
const controller = new AbortController()

const contentList = computed(() =>
  contents.value.reduce((acc, current) => {
    if (acc[current.name]) {
      acc[current.name].push(current.text)
    } else {
      acc[current.name] = [current.text]
    }

    return acc
  }, {})
)

onBeforeMount(() => {
  useOtuPageRequest('panel:content', () =>
    TaxonWorks.getOtuContent(props.otuId, {
      params: {
        extend: ['depiction']
      },
      signal: controller.signal
    })
  )
    .then(({ data }) => {
      contents.value = data
    })
    .catch((e) => {})
})

onBeforeUnmount(() => {
  controller.abort()
})
</script>
