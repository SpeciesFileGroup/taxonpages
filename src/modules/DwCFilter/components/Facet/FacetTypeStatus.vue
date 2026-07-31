<template>
  <div>
    <h3>{{ $t('dwc_filter.type') }}</h3>
    <SelectInput
      class="w-full"
      v-model="parameters.typeStatus"
    >
      <option value="">{{ $t('dwc_filter.type_none') }}</option>
      <option
        v-for="type in TYPES"
        :key="type"
        :value="type"
      >
        {{ typeStatusLabel(type, i18n) }}
      </option>
    </SelectInput>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { typeStatusLabel } from '@/i18n/vocabulary'

const i18n = useI18n()

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
