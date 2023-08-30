<template>
  <component :is="tag">
    <slot
      v-for="([type, value], index) in list"
      :type="type"
      :value="value"
    >
      <span>
        {{ type }}: {{ value }}{{ index < list.length - 1 ? '; ' : '' }}
      </span>
    </slot>
  </component>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { makeAPIRequest } from '@/utils'

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },

  tag: {
    type: String,
    default: 'span'
  }
})

const stats = ref({ data: [] })

const selectedData = computed(() =>
  props.data.map((item) => item.toLowerCase())
)
const list = computed(() => {
  const currentStats = stats.value.data

  return currentStats.length
    ? filterStats(currentStats)
    : selectedData.value.map((item) => [item, '??'])
})

function filterStats(currentStats) {
  const list = props.data.length
    ? currentStats.filter(([key]) => selectedData.value.includes(key))
    : currentStats

  list.sort(
    ([a], [b]) => selectedData.value.indexOf(a) - selectedData.value.indexOf(b)
  )

  return list
}

onMounted(() => {
  makeAPIRequest.get('/stats').then((response) => {
    const data = Object.entries(response.data.data).map(([key, value]) => [
      key.toLowerCase(),
      value.toLocaleString()
    ])

    stats.value.data = data
  })
})
</script>
