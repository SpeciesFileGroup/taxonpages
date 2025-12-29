<template>
  <div>
    <label class="block">Institution code</label>
    <InputText
      type="text"
      v-model="parameters.institutionCode"
      placeholder="Type..."
    />
  </div>
</template>

<script setup>
const parameters = defineModel({
  type: Object,
  required: true
})
</script>
