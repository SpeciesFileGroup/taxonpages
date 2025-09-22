<template>
  <VCard class="mb-4">
    <VCardContent>
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
        <div class="w-full">
          <label>Distribution</label>
          <div class="flex flex-col md:flex-row gap-2 w-full">
            <Autocomplete
              class="w-full"
              url="/dwc_occurrences/area_autocomplete"
              query-param="term"
              v-model:input="parameters.country"
              retain-input
              :params="{
                target: 'country'
              }"
              placeholder="Country..."
            />
            <Autocomplete
              class="w-full"
              url="/dwc_occurrences/area_autocomplete"
              query-param="term"
              retain-input
              v-model:input="parameters.stateProvince"
              :params="{
                target: 'stateProvince'
              }"
              placeholder="State/Province..."
            />
            <Autocomplete
              class="w-full"
              url="/dwc_occurrences/area_autocomplete"
              query-param="term"
              retain-input
              v-model:input="parameters.county"
              :params="{
                target: 'county'
              }"
              placeholder="County..."
            />
          </div>
        </div>
        <div class="flex flex-row gap-2 justify-center md:self-end text-sm">
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
const parameters = defineModel({
  type: Object,
  required: true
})

const emit = defineEmits(['search'])
</script>
