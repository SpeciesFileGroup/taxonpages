<template>
  <Dropdown :items="menuOptions">
    <template #button>
      <IconHamburger class="text-base-soft h-4" />
    </template>
  </Dropdown>
  <VModal
    v-if="isModalVisible"
    @close="isModalVisible = false"
  >
    <template #header>
      <h3>JSON Data</h3>
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
import { ref, computed } from 'vue'
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

const menuOptions = computed(() => [
  {
    label: 'JSON Data',
    action: () => (isModalVisible.value = true)
  },
  {
    label: 'Download DwC',
    action: downloadDwcOccurrencesCSV
  }
])

async function downloadDwcOccurrencesCSV() {
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
}
</script>
