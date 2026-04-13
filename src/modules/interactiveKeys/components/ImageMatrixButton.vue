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

function openImageMatrix() {
  const otuIds = props.rows
    .filter(
      (r) =>
        props.selectedIds.includes(r.rowId) && r.observationObjectType === 'Otu'
    )
    .map((r) => r.observationObjectId)

  window.open(`/image_matrices/0?otu_filter=${otuIds.join('|')}`, '_self')
}
</script>
