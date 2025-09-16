<template>
  <div class="container mx-auto box-border">
    <h1 class="text-4xl px-4 md:px-0 mt-4 mb-6 font-bold">Bibliography</h1>
    <ClientOnly>
      <VSpinner v-if="isLoading" />
    </ClientOnly>
    <VCard class="mb-4">
      <VCardContent>
        <div
          class="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-2 text-sm"
        >
          <div class="flex flex-col w-full md:w-fit">
            <label>Author</label>
            <InputText
              class="w-full"
              type="text"
              placeholder="Type..."
              v-model="parameters.author"
              @keypress.enter="() => loadList()"
            />
          </div>
          <div class="w-full md:w-auto">
            <span>Published between:</span>
            <div class="flex flex-row gap-2">
              <YearPicker
                v-model="parameters.year_start"
                :min="MIN_YEAR"
                :max="MAX_YEAR"
              />
              <VSlider
                class="w-full md:w-64"
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
            </div>
          </div>
          <VButton
            class="text-sm py-1.5 md:self-end border border-primary-color"
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
  year_end: 2025,
  author: undefined
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
