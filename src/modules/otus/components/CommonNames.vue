<template>
  <span>{{ commonNameLabel }}</span>
</template>

<script setup>
import { computed } from 'vue'
import { useOtuStore } from '../store/store'

const store = useOtuStore()

const commonNameLabel = computed(() =>
  store.taxonomy.commonNames.map((item) => item.name).join('; ')
)
</script>
