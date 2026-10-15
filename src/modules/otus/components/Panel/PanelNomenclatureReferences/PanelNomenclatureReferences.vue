<template>
  <VCard>
    <VSpinner
      v-if="store.catalog.isLoading"
      logo-class="w-8 h-8"
      legend=""
    />
    <VCardHeader class="flex justify-between">
      <h2 class="text-md">
        {{ panelTitle }} ({{ sources.length }})
      </h2>
      <PanelDropdown
        :menu-options="menuOptions"
        panel-key="taxonomy"
      />
    </VCardHeader>

    <ul class="text-sm">
      <PanelReferenceRow
        v-for="reference in referenceList.first"
        :key="reference.id"
        :reference="reference"
      />

      <PanelNomenclatureShowMore
        v-if="!showAll && referenceList.middle.length"
        :count="referenceList.middle.length"
        @click="showAll = true"
      />
      <AnimationOpacity>
        <div v-show="showAll">
          <PanelReferenceRow
            v-for="reference in referenceList.middle"
            :key="reference.id"
            :reference="reference"
          />
        </div>
      </AnimationOpacity>

      <PanelReferenceRow
        v-for="reference in referenceList.last"
        :key="reference.id"
        :reference="reference"
      />
    </ul>
  </VCard>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { computed, ref } from 'vue'
import { splitList } from '../PanelNomenclature/splitList'
import { useOtuStore } from '@/modules/otus/store/store'
import { itemsForTaxonName, sourcesCitedBy } from '@/modules/otus/utils'
import PanelNomenclatureShowMore from '../PanelNomenclature/PanelNomenclatureShowMore.vue'
import PanelReferenceRow from './PanelReferenceRow.vue'
import PanelDropdown from '../PanelDropdown.vue'

const MAX_REFERENCES = 2

const props = defineProps({
  taxonId: {
    type: [Number, String],
    required: true
  },

  title: {
    type: String,
    default: undefined
  }
})

const { t } = useI18n()
const store = useOtuStore()

const panelTitle = computed(
  () => props.title ?? t('panel.nomenclature_references.title')
)

const showAll = ref(false)
const sources = computed(() =>
  sourcesCitedBy(
    itemsForTaxonName(props.taxonId, store.catalog.timeline),
    store.catalog.sources
  )
)
const referenceList = computed(() => splitList(sources.value, MAX_REFERENCES))

const menuOptions = computed(() => [
  {
    label: showAll.value ? t('otus.show_less') : t('otus.show_all_menu'),
    action: () => (showAll.value = !showAll.value)
  }
])
</script>
