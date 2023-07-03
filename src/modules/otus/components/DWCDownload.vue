<template>
  <VButton
    primary
    class="text-sm flex items-center"
    title="Download DwC Occurrences"
    @click="
      () => {
        downloadCSV()
      }
    "
  >
    <IconDownload class="w-4 h-4 mr-1" />
    DwC
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
    `${url}/otus/${props.otu.id}/inventory/dwc?project_token=${project_token}`,
    '_self'
  )
}
</script>
