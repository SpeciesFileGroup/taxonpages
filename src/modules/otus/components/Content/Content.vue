<template>
  <VCard>
    <VCardHeader>
      <h1 class="text-md">
        Content
      </h1>
    </VCardHeader>
    <VCardContent class="text-sm">
      <ContentTopic
        v-for="(text, title) in contentList"
        :key="title"
        class="mb-6 last:mb-0"
        :title="title"
        :text-list="text"
      />
    </VCardContent>
  </VCard>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import OtuService from '../../services/OtuService'
import ContentTopic from './ContentTopic.vue'

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
      OtuService.getContent(id).then(({ data }) => {
        contents.value = data
      })
    } else {
      contents.value = []
    }
  },
  { immediate: true }
)

</script>