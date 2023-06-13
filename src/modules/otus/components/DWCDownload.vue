<template>
  <VButton
    primary
    class="text-sm flex items-center"
    @click="download"
  >
    <IconDownload class="w-4 h-4 mr-1" />
    DwC
  </VButton>
</template>

<script setup>
import TaxonWorks from '../services/TaxonWorks'
import { downloadTextFile } from '../utils/files'

const props = defineProps({
  otu: {
    type: Object,
    required: true
  }
})

function download() {
  TaxonWorks.getDwC(props.otu.id).then(({ data }) => {
    downloadTextFile(data, 'text/csv', 'dwc_records')
  })
}

downloadTextFile
</script>
