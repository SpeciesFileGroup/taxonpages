<template>
  <div class="grid gap-3">
    <div
      v-for="row in pageLayout.panels"
      class="grid grid-cols-1 gap-3"
      :class="[columnClasses[row.length]]"
    >
      <div
        v-for="(column, index) in row"
        class="grid grid-cols-1 gap-3 auto-rows-min"
        :key="index"
      >
        <template
          v-for="{ component, available, id } in column"
          :key="id"
        >
          <component
            :is="component"
            v-if="!available || isAvailableForRank(available, taxonRank)"
            :otu-id="otuId"
            :otu="otu"
            :taxon-id="taxonId"
            :taxon="taxon"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import layouts from '../constants/layouts.js'
import { isAvailableForRank } from '../utils'

const props = defineProps({
  taxonId: {
    type: [Number, String],
    required: true
  },

  taxonRank: {
    type: [String, null],
    required: true
  },

  otuId: {
    type: [Number, String],
    required: true
  },

  otu: {
    type: Object,
    required: true
  },

  taxon: {
    type: Object,
    required: true
  }
})

const router = useRouter()
const pageLayout = layouts[router.currentRoute.value.meta.tab]
const columnClasses = {
  1: ['md:grid-cols-1'],
  2: ['md:grid-cols-2'],
  3: ['md:grid-cols-3']
}

if (
  pageLayout.rankGroup?.length &&
  !isAvailableForRank(pageLayout.rankGroup, props.taxonRank)
) {
  router.replace({ name: 'otus-id-overview' })
}
</script>
