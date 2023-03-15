<template>
  <VCard>
    <VCardHeader class="flex justify-between">
      <h2 class="text-md">Nomenclature references ({{ list.length }})</h2>
      <Dropdown :items="menuOptions">
        <template #button>
          <IconHamburger class="text-base-soft h-4" />
        </template>
      </Dropdown>
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
import { splitList } from './splitList'
import PanelNomenclatureShowMore from './PanelNomenclatureShowMore.vue'
import PanelReferenceRow from './PanelReferenceRow.vue'

const MAX_REFERENCES = 2

const props = defineProps({
  list: {
    type: Array,
    default: () => []
  }
})

const showAll = ref(false)
const referenceList = computed(() => splitList(props.list, MAX_REFERENCES))

const menuOptions = computed(() => [
  {
    label: showAll.value ? 'Show less' : 'Show all',
    action: () => (showAll.value = !showAll.value)
  }
])
</script>
