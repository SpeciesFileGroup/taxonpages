<template>
  <div class="container mx-auto px-4 md:px-0 box-border">
    <h1 class="text-4xl mt-4 mb-6 font-bold">Bibliography</h1>
    <ClientOnly>
      <VSpinner v-if="isLoading" />
    </ClientOnly>
    <VCard class="mb-4">
      <VCardContent>
        <div
          class="flex flex-col md:flex-row justify-center items-center gap-2"
        >
          <span>Published between:</span>
          <YearPicker
            v-model="parameters.year_start"
            :min="MIN_YEAR"
            :max="MAX_YEAR"
          />
          <VSlider
            :min="MIN_YEAR"
            :max="MAX_YEAR"
            v-model:start="parameters.year_start"
            v-model:end="parameters.year_end"
          />
          <YearPicker
            v-model="parameters.year_end"
            :min="MIN_YEAR"
            :max="MAX_YEAR"
          />
          <VButton
            primary
            @click="() => loadList()"
            >Search</VButton
          >
        </div>
      </VCardContent>
    </VCard>

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
              <VTableHeaderCell>Source</VTableHeaderCell>
            </VTableHeaderRow>
          </VTableHeader>
          <VTableBody>
            <VTableBodyRow
              v-for="item in list"
              :key="item.id"
            >
              <VTableBodyCell
                class="break-all"
                v-html="item.cached"
              />
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
import { ref, onBeforeMount, reactive } from 'vue'
import { makeAPIRequest } from '@/utils'
import YearPicker from '../components/YearPicker.vue'
import VSlider from '../components/VSlider.vue'

const PER = 50
const MIN_YEAR = 1650
const MAX_YEAR = new Date().getFullYear()

const parameters = reactive({
  year_start: 1650,
  year_end: 2025
})

const list = ref([])
const isLoading = ref(false)
const pagination = ref({ page: 1, total: 0, per: PER })

async function loadList(page = 1) {
  isLoading.value = true

  makeAPIRequest
    .get('/sources', {
      params: {
        in_project: true,
        page,
        per: PER,
        ...parameters
      }
    })
    .then(({ data, headers }) => {
      pagination.value = getPagination(headers)
      list.value = data
    })
    .finally(() => {
      isLoading.value = false
    })
}

function getPagination(headers) {
  return {
    page: Number(headers['pagination-page']),
    per: Number(headers['pagination-per-page']),
    total: Number(headers['pagination-total'])
  }
}

onBeforeMount(loadList)
</script>
