<template>
  <div>
    <h3>{{ $t('dwc_filter.type') }}</h3>
    <SelectInput
      class="w-full capitalize"
      v-model="parameters.typeStatus"
    >
      <option value="">{{ $t('dwc_filter.type_none') }}</option>
      <option
        v-for="type in TYPES"
        :key="type"
        :value="type"
      >
        {{ type }}
      </option>
    </SelectInput>
  </div>
</template>

<script setup>
const TYPES = [
  'neotype',
  'holotype',
  'neolectotype',
  'lectotype',
  'syntype',
  'paralectotype',
  'paratype'
]

const parameters = defineModel({
  type: Object,
  required: true
})
</script>
