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
import { computed, ref, watch } from 'vue'
import { useOtuPageRequest } from '@/modules/otus/helpers/useOtuPageRequest'
import TaxonWorks from '../../../services/TaxonWorks'
import ContentTopic from './PanelContentTopic.vue'

const props = defineProps({
  otuId: {
    type: Number,
    default: undefined
  }
})

const contents = ref([])

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

watch(
  () => props.otuId,
  (id) => {
    if (id) {
      useOtuPageRequest('panel:content', () =>
        TaxonWorks.getOtuContent(id)
      ).then(({ data }) => {
        contents.value = data
      })
    } else {
      contents.value = []
    }
  },
  { immediate: true }
)
</script>
