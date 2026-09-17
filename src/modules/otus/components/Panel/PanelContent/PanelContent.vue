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
import { computed, ref, onBeforeMount, onBeforeUnmount, watch } from 'vue'
import { useOtuPageRequest } from '@/modules/otus/helpers/useOtuPageRequest'
import TaxonWorks from '../../../services/TaxonWorks'
import ContentTopic from './PanelContentTopic.vue'

const props = defineProps({
  otuId: {
    type: Number,
    required: true
  },

  params: {
    type: Object,
    default: () => ({})
  }
})

const contents = ref([])

let controller

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

function loadContents() {
  controller?.abort()
  controller = new AbortController()

  useOtuPageRequest('panel:content', () =>
    TaxonWorks.getOtuContent(props.otuId, {
      params: {
        ...props.params,
        extend: ['depiction']
      },
      signal: controller.signal
    })
  )
    .then(({ data }) => {
      contents.value = data
    })
    .catch(() => {})
}

onBeforeMount(loadContents)

watch(
  () => props.params,
  () => {
    contents.value = []
    loadContents()
  },
  { deep: true }
)

onBeforeUnmount(() => {
  controller?.abort()
})
</script>
