<template>
  <div class="w-full">
    <label>{{ $t('dwc_filter.distribution') }}</label>
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
        :placeholder="$t('dwc_filter.country_placeholder')"
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
        :placeholder="$t('dwc_filter.state_placeholder')"
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
        :placeholder="$t('dwc_filter.county_placeholder')"
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
