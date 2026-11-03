<template>
  <VCard v-if="typeMaterials.length">
    <VCardHeader class="flex justify-between">
      <h2 class="text-md">{{ $t('panel.type_specimen.title') }}</h2>
      <PanelDropdown panel-key="panel:typeMaterial" />
    </VCardHeader>
    <VCardContent class="text-sm">
      <p v-if="currentTypeMaterial">
        {{ currentTypeMaterial.label }}
      </p>
      <div
        v-if="otherTypeMaterials.length"
        :class="{ 'mt-4 pt-4 border-t border-base-border': currentTypeMaterial }"
      >
        <h3 class="font-medium mb-2">
          {{ $t('panel.type_specimen.related_names') }}
        </h3>
        <ul class="flex flex-col gap-3">
          <li
            v-for="item in otherTypeMaterials"
            :key="item.protonym_id"
          >
            <div class="text-base-soft">
              <span
                v-if="!item.is_valid"
                class="text-orange-500 mr-1"
              >
                =
              </span>
              {{ item.taxon_name }}
            </div>
            <p>{{ item.label }}</p>
          </li>
        </ul>
      </div>
    </VCardContent>
  </VCard>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { SPECIMEN_TYPES } from '../../../constants'
import { useOtuPageRequest } from '@/modules/otus/helpers/useOtuPageRequest'
import PanelDropdown from '../PanelDropdown.vue'
import TaxonWorks from '../../../services/TaxonWorks'

const props = defineProps({
  otuId: {
    type: [String, Number],
    required: true
  },

  taxonId: {
    type: [String, Number],
    default: undefined
  }
})

const typeMaterials = ref([])

const currentTypeMaterial = computed(() =>
  typeMaterials.value.find(
    (item) => String(item.protonym_id) === String(props.taxonId)
  )
)

const otherTypeMaterials = computed(() =>
  typeMaterials.value.filter((item) => item !== currentTypeMaterial.value)
)

watch(
  () => props.otuId,
  () => {
    if (!props.otuId) {
      return
    }

    useOtuPageRequest('panel:typeMaterial', () =>
      TaxonWorks.getOtuTypeMaterial(props.otuId)
    )
      .then(({ data }) => {
        const sorted = data.type_materials_catalog_labels.sort(
          (a, b) =>
            SPECIMEN_TYPES.indexOf(a.type_type) -
            SPECIMEN_TYPES.indexOf(b.type_type)
        )
        const firstByTaxon = new Map()

        sorted.forEach((item) => {
          if (!firstByTaxon.has(item.protonym_id)) {
            firstByTaxon.set(item.protonym_id, item)
          }
        })

        typeMaterials.value = [...firstByTaxon.values()]
      })
      .catch(() => {})
  },
  { immediate: true }
)
</script>
