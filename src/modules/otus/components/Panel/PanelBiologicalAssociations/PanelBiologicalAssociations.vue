<template>
  <VCard>
    <VCardHeader>
      Biological associations ({{ pagination.total }})
    </VCardHeader>
    <VCardContent class="min-h-28">
      <ClientOnly>
        <VSpinner v-if="isLoading" />
      </ClientOnly>
      <template v-if="biologicalAssociations.length">
        <VPagination
          v-model="pagination.page"
          :total="pagination.total"
          :per="pagination.per"
          @select="loadPage"
        />

        <div class="overflow-x-auto my-4">
          <BiologicalAssociationTable
            :biological-associations="biologicalAssociations"
            :citations="citations"
            :images="images"
            :asserted-distribution="assertedDistribution"
          />
        </div>

        <VPagination
          v-model="pagination.page"
          :total="pagination.total"
          :per="pagination.per"
          @select="loadPage"
        />
      </template>

      <div
        v-else-if="!isLoading"
        class="text-xl text-center my-8 w-full"
      >
        No records found.
      </div>
    </VCardContent>
  </VCard>
</template>

<script setup>
import { onBeforeUnmount, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useBiologicalAssociationsStore } from './store/useBiologicalAssociationsStore'
import BiologicalAssociationTable from './components/Table/BiologicalAssociationTable.vue'

const props = defineProps({
  otuId: {
    type: Number,
    required: true
  },

  per: {
    type: Number,
    default: 50
  },

  citations: {
    type: Boolean,
    default: true
  },

  images: {
    type: Boolean,
    default: true
  },

  assertedDistribution: {
    type: Boolean,
    default: true
  }
})

const store = useBiologicalAssociationsStore()
const { biologicalAssociations, pagination, isLoading } = storeToRefs(store)

function loadPage(page = 1) {
  store.loadPage(props.otuId, {
    page,
    per: props.per,
    images: props.images,
    assertedDistribution: props.assertedDistribution
  })
}

onMounted(() => {
  loadPage()
})

onBeforeUnmount(() => {
  store.resetRequest()
  store.$reset()
})
</script>
