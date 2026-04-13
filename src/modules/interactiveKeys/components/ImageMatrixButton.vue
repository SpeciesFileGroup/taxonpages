<template>
  <div>
    <VButton
      size="sm"
      color="primary"
      :disabled="!props.selectedIds.length"
      @click="openImageMatrix"
    >
      View Image Matrix
    </VButton>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  rows: {
    type: Array,
    required: true
  },

  selectedIds: {
    type: Array,
    required: true
  }
})

const router = useRouter()

function openImageMatrix() {
  const otuIds = props.rows
    .filter(
      (r) =>
        props.selectedIds.includes(r.rowId) && r.observationObjectType === 'Otu'
    )
    .map((r) => r.observationObjectId)

  router.push({
    name: 'image-matrices-id',
    params: { id: '0' },
    query: { otu_filter: otuIds.join('|') }
  })
}
</script>
