<template>
  <VButton
    class="flex items-center"
    title="Download DwC Occurrences"
    size="sm"
    @click="
      () => {
        downloadCSV()
      }
    "
  >
    <div class="flex gap-1 items-center">
      <IconDownload class="w-3.5 h-3.5" />
    </div>
  </VButton>
</template>

<script setup>
const { url, project_token } = __APP_ENV__

const props = defineProps({
  otu: {
    type: Object,
    required: true
  }
})

function downloadCSV() {
  window.open(
    `${url}/otus/${props.otu.id}/inventory/dwc.csv?project_token=${project_token}`,
    '_self'
  )
}
</script>
