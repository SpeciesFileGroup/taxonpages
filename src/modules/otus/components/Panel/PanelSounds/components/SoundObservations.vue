<template>
  <button
    class="h-8 w-8 flex items-center justify-center rounded-full text-primary-content bg-primary-color"
    title="Observations"
    @click="() => (isVisible = true)"
  >
    <IconFiles class="size-4" />
  </button>
  <VModal
    v-if="isVisible"
    container-class="w-auto"
    @close="() => (isVisible = false)"
  >
    <template #header>
      <h3 class="font-medium">Observations</h3>
    </template>
    <VSpinner v-if="isLoading" />
    <div :class="['px-4 pb-6 min-w-80', isLoading && 'min-h-32']">
      <div
        v-if="isLoading === false && !observations.length"
        class="text-center text-lg pt-4 pb-6"
      >
        No records found
      </div>
      <TableObservations
        v-else
        :observations="observations"
      />
    </div>
  </VModal>
</template>

<script setup>
import { ref, watch } from 'vue'
import { makeObservation } from '../utils'
import TableObservations from './TableObservations.vue'
import TaxonWorks from '@/modules/otus/services/TaxonWorks'

const props = defineProps({
  soundId: {
    type: Number,
    required: true
  }
})

const isVisible = ref(false)

const isLoading = ref(true)
const observations = ref([])

watch(
  isVisible,
  () => {
    TaxonWorks.getObservations({
      sound_id: props.soundId,
      extend: ['character_state', 'depictions', 'image', 'descriptor']
    })
      .then(({ data }) => {
        const list = data.map((item) => makeObservation(item))

        list.sort((a, b) => a.descriptorName.localeCompare(b.descriptorName))

        observations.value = list
      })
      .catch(() => {})
      .finally(() => {
        isLoading.value = false
      })
  },
  { once: true }
)
</script>
