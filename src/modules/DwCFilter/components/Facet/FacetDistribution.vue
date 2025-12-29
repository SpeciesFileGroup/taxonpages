<template>
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
</template>

<script setup>
const parameters = defineModel({
  type: Object,
  required: true
})
</script>
