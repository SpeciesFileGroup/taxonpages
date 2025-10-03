<template>
  <div class="container mx-auto box-border">
    <div class="px-4 md:px-0 mt-4 mb-6">
      <h1 class="text-4xl font-bold">Search the Darwin Core</h1>
      <h2>
        Filter OTUs by scientific name, author, and distribution (Darwin Core)
      </h2>
    </div>
    <ClientOnly>
      <VSpinner
        v-if="isLoading"
        full-screen
      />
    </ClientOnly>
    <FilterBar
      v-model="parameters"
      @search="() => loadList()"
      @reset="reset"
    />

    <VCard>
      <VCardContent>
        <div class="flex flex-row justify-between items-center mb-4">
          <div class="flex flex-col md:flex-row gap-3 md:items-center">
            <VPagination
              v-model="pagination.page"
              :total="pagination.total"
              :per="pagination.per"
              @update:modelValue="
                (page) => {
                  loadList(page)
                }
              "
            />
            <VPaginationInfo :pagination="pagination" />
          </div>
          <DropdownMenu
            :parameters="{ ...parameters, ...wildcardParam }"
            :request="requestData"
          />
        </div>

        <VTable>
          <VTableHeader>
            <VTableHeaderRow>
              <VTableHeaderCell class="w-2" />
              <VTableHeaderCell>OTU</VTableHeaderCell>
            </VTableHeaderRow>
          </VTableHeader>
          <VTableBody>
            <VTableBodyRow
              v-for="item in list"
              :key="item.id"
            >
              <VTableBodyCell class="pr-1">
                <OtuModal
                  :otu="item"
                  :parameters="{ ...parameters, ...wildcardParam }"
                />
              </VTableBodyCell>
              <VTableBodyCell class="break-all">
                <RouterLink
                  :to="{ name: 'otus-id', params: { id: item.id } }"
                  v-html="item.object_tag"
                />
              </VTableBodyCell>
            </VTableBodyRow>
          </VTableBody>
        </VTable>
        <div class="flex flex-col md:flex-row gap-3 md:items-center mt-4">
          <VPagination
            v-model="pagination.page"
            :total="pagination.total"
            :per="pagination.per"
            @select="
              (page) => {
                loadList(page)
              }
            "
          />
          <VPaginationInfo :pagination="pagination" />
        </div>
      </VCardContent>
    </VCard>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { makeAPIRequest } from '@/utils'
import { useRoute, useRouter } from 'vue-router'
import { flattenParameters } from '../utils/flattenParameters'
import FilterBar from '../components/FilterBar.vue'
import DropdownMenu from '../components/DropdownMenu.vue'
import OtuModal from '../components/OtuModal/OtuModal.vue'

const PER = 50

const route = useRoute()
const router = useRouter()

const list = ref([])
const isLoading = ref(false)
const pagination = ref({ page: 1, total: 0, per: PER })
const parameters = ref({})
const requestData = ref()
const wildcardParam = computed(() => ({
  wildcard_attribute: Object.keys(parameters.value)
}))

function getPagination(headers) {
  return {
    page: Number(headers['pagination-page']),
    per: Number(headers['pagination-per-page']),
    total: Number(headers['pagination-total'])
  }
}

function setParameters(data = {}) {
  parameters.value = data
}

function setPagination(data = {}) {
  pagination.value = {
    page: Number(data.page) || 1,
    total: 0,
    per: PER
  }
}

function setQuery() {
  router.push({
    query: { ...parameters.value, page: pagination.value.page }
  })
}

function loadList(page = 1) {
  isLoading.value = true

  makeAPIRequest
    .get('/otus', {
      params: {
        ...flattenParameters({
          dwc_occurrence_query: {
            ...parameters.value,
            ...wildcardParam.value
          }
        }),
        page,
        per: PER
      }
    })
    .then(({ data, headers, request }) => {
      list.value = data
      pagination.value = getPagination(headers)

      requestData.value = {
        data,
        url: request.responseURL
      }

      setQuery()
    })
    .finally(() => {
      isLoading.value = false
    })
}

function reset() {
  setParameters()
  setPagination()
  setQuery()
  list.value = []
}

onMounted(() => {
  const { page, ...params } = route.query

  setParameters(params)
  setPagination({ page })
  loadList()
})
</script>
