<template>
  <VCard class="mb-4">
    <VCardContent>
      <div class="flex flex-col md:flex-row justify-center items-center gap-2">
        <div class="text-sm">
          <label>Scientific name</label>
          <input
            class="block box-border min-w-full p-1.5 pl-4 text-base-content rounded border sm:text-sm placeholder:text-sm dark:border-slate-700 border-gray-300 dark:placeholder:text-slate-400 focus:ring-primary-500 focus:border-primary-500"
            type="text"
            placeholder="Type name..."
            v-model="parameters.scientificName"
          />
        </div>
        <div class="text-sm">
          <label>Scientific name author</label>
          <input
            class="block box-border min-w-full p-1.5 pl-4 text-base-content rounded border sm:text-sm placeholder:text-sm dark:border-slate-700 border-gray-300 dark:placeholder:text-slate-400 focus:ring-primary-500 focus:border-primary-500"
            type="text"
            placeholder="Type author..."
            v-model="parameters.scientificNameAuthorship"
          />
        </div>
        <div class="text-sm">
          <label>Distribution</label>
          <div class="flex flex-col md:flex-row gap-2">
            <Autocomplete
              url="/dwc_occurrences"
              param="country"
              label="country"
              placeholder="Country..."
            />
            <Autocomplete
              url="/dwc_occurrences"
              param="stateProvince"
              placeholder="State/Province..."
              label="stateProvince"
            />
            <Autocomplete
              url="/dwc_occurrences"
              param="county"
              placeholder="County..."
              label="county"
            />
            <VButton
              primary
              @click="() => emit('search')"
            >
              Search
            </VButton>
          </div>
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
