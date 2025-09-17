<template>
  <div class="text-sm">
    <span
      v-if="haveRecords"
      class="horizontal-left-content"
    >
      {{ recordsAtCurrentPage }} - {{ recordsAtNextPage }} of
      {{ pagination.total }} records.
    </span>
    <span v-else>0 records.</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  pagination: {
    type: Object,
    required: true
  }
})

const recordsAtCurrentPage = computed(
  () => (props.pagination.page - 1) * props.pagination.per || 1
)

const recordsAtNextPage = computed(() => {
  const recordsCount = props.pagination.page * props.pagination.per
  return recordsCount > props.pagination.total
    ? props.pagination.total
    : recordsCount
})

const haveRecords = computed(() => Number(props.pagination.total))
</script>
