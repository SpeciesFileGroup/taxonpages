<template>
  <div class="container mx-auto px-4 md:px-0 box-border">
    <h1 class="text-4xl mt-4 mb-6 font-bold">DwC</h1>
    <ClientOnly>
      <VSpinner
        v-if="isLoading"
        full-screen
      />
    </ClientOnly>
    <FilterBar
      v-model="parameters"
      @search="search()"
    />

    <VCard>
      <VCardContent>
        <VPagination
          class="mb-4"
          v-model="pagination.page"
          :total="pagination.total"
          :per="pagination.per"
          @update:modelValue="
            (page) => {
              loadList(page)
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
              v-for="item in list"
              :key="item.id"
            >
              <VTableBodyCell class="break-all">
                <RouterLink
                  :to="{ name: 'otus-id', params: { id: item.id } }"
                  v-html="item.object_tag"
                />
              </VTableBodyCell>
            </VTableBodyRow>
          </VTableBody>
        </VTable>
        <VPagination
          class="mt-4"
          v-model="pagination.page"
          :total="pagination.total"
          :per="pagination.per"
          @update:modelValue="
            (page) => {
              loadList(page)
            }
          "
        />
      </VCardContent>
    </VCard>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { makeAPIRequest } from '@/utils'
import FilterBar from '../components/FilterBar.vue'

const PER = 50

const list = ref([])
const isLoading = ref(false)
const pagination = ref({ page: 1, total: 0, per: PER })
const parameters = ref({})

function getPagination(headers) {
  return {
    page: Number(headers['pagination-page']),
    per: Number(headers['pagination-per-page']),
    total: Number(headers['pagination-total'])
  }
}

function search(page = 1) {
  isLoading.value = true

  makeAPIRequest
    .get('/otus', {
      params: {
        dwc_occurrence_query: {
          ...parameters.value
        },
        page,
        per: PER
      }
    })
    .then(({ data, headers }) => {
      list.value = data
      pagination.value = getPagination(headers)
    })
    .finally(() => {
      isLoading.value = false
    })
}
</script>
