<template>
  <VCard>
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
  id => {
    if (id) {
      TaxonWorks.getOtuContent(id).then(({ data }) => {
        contents.value = data
      })
    } else {
      contents.value = []
    }
  },
  { immediate: true }
)

</script>