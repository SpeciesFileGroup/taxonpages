<template>
  <IconPlusCircle
    class="size-6 text-secondary-color cursor-pointer"
    @click="() => (isModalVisible = true)"
  />
  <Teleport to="body">
    <VModal
      v-if="isModalVisible"
      @close="() => (isModalVisible = false)"
    >
      <template #header>
        <div class="text-sm">Bibliography - <span v-html="label" /></div>
      </template>

      <div class="md:max-h-[64vh] min-h-28 px-4 overflow-y-auto pb-4">
        <ClientOnly>
          <VSpinner v-if="isLoading" />
        </ClientOnly>

        <div
          v-if="!isLoading && !list.length"
          class="text-xl text-center my-8 w-full"
        >
          No records found.
        </div>

        <div v-if="list.length">
          <VPagination
            v-if="pagination.total > pagination.per"
            class="py-4"
            v-model="pagination.page"
            :total="pagination.total"
            :per="pagination.per"
            @update:modelValue="
              (page) => {
                loadPage(page)
              }
            "
          />

          <VTable>
            <VTableHeader>
              <VTableHeaderRow>
                <VTableHeaderCell>OTU</VTableHeaderCell>
              </VTableHeaderRow>
            </VTableHeader>
            <VTableBody>
              <VTableBodyRow
                v-for="otu in list"
                :key="otu.id"
              >
                <VTableBodyCell>
                  <RouterLink
                    :to="{ name: 'otus-id', params: { id: otu.id } }"
                    v-html="otu.object_tag"
                  />
                </VTableBodyCell>
              </VTableBodyRow>
            </VTableBody>
          </VTable>

          <VPagination
            v-if="pagination.total > pagination.per"
            class="pt-4"
            v-model="pagination.page"
            :total="pagination.total"
            :per="pagination.per"
            @update:modelValue="
              (page) => {
                loadPage(page)
              }
            "
          />
        </div>
      </div>
    </VModal>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { makeAPIRequest } from '@/utils'
import { getPagination } from '../utils/getPagination'

const props = defineProps({
  sourceId: {
    type: Number,
    required: true
  },

  label: {
    type: String,
    required: true
  }
})

const pagination = ref({ page: 1, total: 0, per: 50 })

const isLoading = ref(false)
const isModalVisible = ref(false)
const list = ref([])

function loadPage(page = 1) {
  isLoading.value = true
  makeAPIRequest
    .get('/otus', {
      params: {
        page,
        per: 50,
        'taxon_name_query[source_query][source_id][]': props.sourceId,
        paginate: true
      }
    })
    .then(({ data, headers }) => {
      list.value = data
      pagination.value = getPagination(headers)
    })
    .catch(() => {})
    .finally(() => {
      isLoading.value = false
    })
}

watch(isModalVisible, (newVal) => {
  if (newVal) {
    loadPage()
  }
})
</script>
