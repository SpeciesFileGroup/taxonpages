<template>
  <VCard>
    <CardHeader>
      <h1 class="text-md">
        Type specimen
      </h1>
    </CardHeader>
    <CardContent class="text-sm">
      <p v-if="typeMaterials.length">
        {{ typeMaterials[0].label }}
      </p>
    </CardContent>
  </VCard>
</template>

<script setup>
import { ref, watch } from 'vue'
import OtuService from '../services/OtuService'

const TYPE_ORDER = [
  'neotype',
  'holotype',
  'neolectotype',
  'lectotype',
  'syntype',
  'paratype',
  'paratypes'
]

const props = defineProps({
  otuId: {
    type: [String, Number],
    required: true
  }
})

const typeMaterials = ref([])

watch(
  () => props.otuId, async () => {
  if (!props.otuId) { return }

  OtuService.getTypes(props.otuId).then(({ data }) => {
    typeMaterials.value = data.type_materials_catalog_labels.sort((a, b) => TYPE_ORDER.indexOf(a.type_type) - TYPE_ORDER.indexOf(b.type_type))
  })
}, { immediate: true })
</script>