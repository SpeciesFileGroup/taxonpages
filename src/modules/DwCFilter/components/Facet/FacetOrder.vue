<template>
  <div>
    <label class="text-base font-medium">Classification</label>

    <div class="flex flex-col flex-wrap gap-2 mt-2">
      <div
        v-for="rank in DWC_CLASSIFICATION_HIERARCHY"
        :key="rank"
        class="flex flex-col"
      >
        <label class="capitalize">{{ rank }}</label>
        <InputText
          placeholder="Type name..."
          v-model="parameters[rank]"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
const DWC_CLASSIFICATION_HIERARCHY = [
  'kingdom',
  'phylum',
  'class',
  'order',
  'family',
  'genus',
  'subgenus',
  'specificEpithet',
  'infraspecificEpithet'
]

const parameters = defineModel({
  type: Object,
  required: true
})
</script>
