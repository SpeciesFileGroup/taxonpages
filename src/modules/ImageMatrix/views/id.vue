<template>
  <VCard class="container mx-auto">
    <VSpinner
      v-if="isLoading"
      full-screen
    />
    <VCardHeader>
      <div class="flex flex-row justify-between items-center">
        <h1>{{ observationMatrix.name }}</h1>
        <VPagination
          v-if="pagination"
          :total="pagination.total"
          v-model="pagination.page"
          :per="PER"
          @select="(page) => loadMatrix(matrixId, page)"
        />
      </div>
    </VCardHeader>
    <VCardContent>
      <div class="image-matrix overflow-auto">
        <VTable>
          <caption class="sr-only">
            Image matrix
          </caption>
          <VTableHeader>
            <VTableHeaderRow class="bg-base-foreground">
              <VTableBodyCell class="border-b" />
              <VTableHeaderCell
                v-for="{ id, label } in descriptors"
                :key="id"
                class="border-l border-b"
                scope="col"
              >
                {{ label }}
              </VTableHeaderCell>
            </VTableHeaderRow>
          </VTableHeader>
          <VTableBody>
            <VTableBodyRow v-for="item in list">
              <VTableBodyCell class="border-b text-base-content h-20">
                <RouterLink
                  :to="{ name: 'otus-id', params: { id: item.id } }"
                  v-html="item.label"
                />
              </VTableBodyCell>
              <VTableBodyCell
                v-for="images in item.depictions"
                class="border-l border-b"
              >
                <ListImage :images="images" />
              </VTableBodyCell>
            </VTableBodyRow>
          </VTableBody>
        </VTable>
      </div>
    </VCardContent>
  </VCard>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { makeImageObject } from '../utils/makeImageObject.js'
import ListImage from '../components/ListImages.vue'
import { ObservationMatrixImage } from '../services/Keys.js'

const PER = 50

const list = ref([])
const isLoading = ref(false)
const descriptors = ref([])
const observationMatrix = ref({})
const route = useRoute()
const pagination = ref()

const matrixId = route.params.id

async function loadMatrix(id, page = 1) {
  isLoading.value = true

  try {
    const { data } = await ObservationMatrixImage.find(id, {
      page,
      per: PER
    })

    observationMatrix.value = data.observation_matrix
    descriptors.value = data.list_of_descriptors.map((item) => ({
      label: item.name,
      id: item.id
    }))

    pagination.value = {
      page: data.pagination.pagination_page,
      total: data.pagination.pagination_total,
      per: data.pagination.pagination_per_page
    }

    list.value = data.depiction_matrix.map((item) => {
      const obj = {
        id: item.object.id,
        type: item.object.type,
        label: item.object.label,
        depictions: []
      }

      for (let i = 0; i < descriptors.value.length; i++) {
        const depictions = item.depictions[i].map((d) =>
          makeImageObject({
            ...d,
            ...data.image_hash[d.image_id]
          })
        )

        obj.depictions.push(depictions)
      }

      return obj
    })
  } catch {
  } finally {
    isLoading.value = false
  }
}

loadMatrix(route.params.id)
</script>

<style scoped>
.image-matrix {
  max-height: calc(100vh - 12rem);
}
</style>
