<template>
  <VCard>
    <VSpinner
      v-if="store.catalog.isLoading"
      logo-class="w-8 h-8"
      legend=""
    />
    <VCardHeader class="flex justify-between">
      <h2 class="text-md">
        Nomenclature references ({{ store.catalog.sources.length }})
      </h2>
      <PanelDropdown
        :menu-options="menuOptions"
        panel-key="taxonomy"
      />
    </VCardHeader>

    <ul class="text-sm">
      <PanelReferenceRow
        v-for="reference in referenceList.first"
        :key="reference"
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
            :key="reference"
            :reference="reference"
          />
        </div>
      </AnimationOpacity>

      <PanelReferenceRow
        v-for="reference in referenceList.last"
        :key="reference"
        :reference="reference"
      />
    </ul>
  </VCard>
</template>

<script setup>
import { computed, ref } from 'vue'
import { splitList } from '../PanelNomenclature/splitList'
import { useOtuStore } from '@/modules/otus/store/store'
import PanelNomenclatureShowMore from '../PanelNomenclature/PanelNomenclatureShowMore.vue'
import PanelReferenceRow from './PanelReferenceRow.vue'
import PanelDropdown from '../PanelDropdown.vue'

const MAX_REFERENCES = 2

const store = useOtuStore()

const showAll = ref(false)
const referenceList = computed(() =>
  splitList(store.catalog.sources, MAX_REFERENCES)
)

const menuOptions = computed(() => [
  {
    label: showAll.value ? 'Show less' : 'Show all',
    action: () => (showAll.value = !showAll.value)
  }
])
</script>
