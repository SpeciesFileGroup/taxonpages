<template>
  <VCard class="mb-4">
    <VCardContent>
      <div class="flex flex-col gap-2">
        <div
          class="flex flex-col lg:flex-row justify-center items-center gap-4 lg:gap-2 text-sm"
        >
          <div class="text-sm w-full">
            <label>Scientific name</label>
            <InputText
              class="block w-full"
              type="text"
              placeholder="Type name..."
              v-model="parameters.scientificName"
              @keypress.enter="() => emit('search')"
            />
          </div>
          <div class="w-full lg:w-96">
            <label>Author</label>
            <InputText
              class="block w-full"
              type="text"
              placeholder="Type author..."
              v-model="parameters.scientificNameAuthorship"
              @keypress.enter="() => emit('search')"
            />
          </div>
          <FacetDistribution v-model="parameters" />
          <div
            class="hidden md:flex flex-row gap-2 justify-center md:self-end text-sm"
          >
            <VButton
              class="py-1.5 border border-primary-color"
              primary
              @click="() => emit('search')"
            >
              Search
            </VButton>
            <VButton
              class="py-1.5 border border-primary-color"
              primary
              @click="() => emit('reset')"
            >
              Reset
            </VButton>
          </div>
        </div>

        <div>
          <div
            class="text-sm mt-2"
            @click="
              () => {
                showMoreFilters = !showMoreFilters
              }
            "
          >
            <div
              class="text-secondary-color flex flex-row gap-1 cursor-pointer"
            >
              <IconMinusCircle
                v-if="showMoreFilters"
                class="w-5 h-5"
              />
              <IconPlusCircle
                v-else
                class="w-5 h-5"
              />
              <span>More filters</span>
            </div>
          </div>
        </div>
        <div
          v-if="showMoreFilters"
          class="text-sm pt-4 flex gap-4"
        >
          <FacetOrder v-model="parameters" />
          <div class="flex flex-col gap-2">
            <h3 class="text-base font-medium">Specimen records</h3>
            <FacetInstitutionCode v-model="parameters" />
            <FacetTypeStatus v-model="parameters" />
          </div>
        </div>

        <div
          class="flex md:hidden flex-row gap-2 justify-center md:self-end text-sm"
        >
          <VButton
            class="py-1.5 border border-primary-color"
            primary
            @click="() => emit('search')"
          >
            Search
          </VButton>
          <VButton
            class="py-1.5 border border-primary-color"
            primary
            @click="() => emit('reset')"
          >
            Reset
          </VButton>
        </div>
      </div>
    </VCardContent>
  </VCard>
</template>

<script setup>
import { ref } from 'vue'
import FacetOrder from './Facet/FacetOrder.vue'
import FacetDistribution from './Facet/FacetDistribution.vue'
import FacetTypeStatus from './Facet/FacetTypeStatus.vue'
import FacetInstitutionCode from './Facet/FacetInstitutionCode.vue'

const parameters = defineModel({
  type: Object,
  required: true
})

const emit = defineEmits(['search'])

const showMoreFilters = ref(false)
</script>
