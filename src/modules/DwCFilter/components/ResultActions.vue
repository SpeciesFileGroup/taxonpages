<template>
  <div class="flex flex-row items-center gap-2">
    <VButton
      class="flex flex-row gap-1 items-center"
      size="sm"
      :title="$t('dwc_filter.download_dwc')"
      :disabled="isDownloading"
      :aria-busy="isDownloading"
      @click="downloadDwcOccurrencesCSV"
    >
      <IconSpinner
        v-if="isDownloading"
        class="w-4 h-4"
      />
      <IconDownload
        v-else
        class="w-4 h-4"
      />
    </VButton>
    <VButton
      size="sm"
      :title="$t('common.json_data')"
      @click="isModalVisible = true"
    >
      <IconJson class="w-4 h-4" />
    </VButton>
  </div>
  <VModal
    v-if="isModalVisible"
    @close="isModalVisible = false"
  >
    <template #header>
      <h3>{{ $t('common.json_data') }}</h3>
    </template>
    <div
      v-if="request"
      class="p-5 font-normal"
    >
      <h3 class="pb-2 text-sm">
        URL: <a :href="request.url">{{ request.url }}</a>
      </h3>
      <div class="relative">
        <p
          class="bg-base-background p-2 text-sm font-normal whitespace-pre-wrap"
          v-html="JSON.stringify(request.data, null, 4)"
        />
        <VClipboard
          class="absolute right-2 top-2 opacity-75"
          :text="JSON.stringify(request.data, null, 2)"
        />
      </div>
    </div>
  </VModal>
</template>

<script setup>
import { ref } from 'vue'
import { makeAPIRequest } from '@/utils'
import { downloadFile } from '@/utils'

const props = defineProps({
  request: {
    type: Object,
    default: () => ({})
  },

  parameters: {
    type: Object,
    required: true
  }
})

const isModalVisible = ref(false)
const isDownloading = ref(false)

async function downloadDwcOccurrencesCSV() {
  isDownloading.value = true

  try {
    const response = await makeAPIRequest.get('/dwc_occurrences.csv', {
      params: {
        ...props.parameters
      },
      responseType: 'blob',
      headers: {
        Accept: 'text/tsv'
      }
    })
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

    downloadFile(response.data, `dwc_occurrences_${timestamp}.tsv`, 'text/tsv')
  } finally {
    isDownloading.value = false
  }
}
</script>
