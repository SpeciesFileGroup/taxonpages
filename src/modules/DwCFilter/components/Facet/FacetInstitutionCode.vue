<template>
  <div>
    <label class="block">{{ $t('dwc_filter.institution_code') }}</label>
    <InputText
      type="text"
      v-model="parameters.institutionCode"
      :placeholder="$t('dwc_filter.institution_code_placeholder')"
    />
  </div>
</template>

<script setup>
const parameters = defineModel({
  type: Object,
  required: true
})
</script>
