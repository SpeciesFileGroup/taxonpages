<template>
  <div class="grid gap-3">
    <div
      v-for="row in pageLayout.panels"
      :class="['grid', 'grid-cols-1', 'gap-3', columnClasses[row.length]]"
    >
      <div
        v-for="(column, index) in row"
        class="grid grid-cols-1 gap-3 auto-rows-min"
        :key="index"
      >
        <template
          v-for="{ component, rankGroup, id, bind } in column"
          :key="id"
        >
          <component
            :is="component"
            v-if="!rankGroup || isAvailableForRank(rankGroup, taxonRank)"
            :otu-id="otuId"
            :otu="otu"
            :taxon-id="taxonId"
            :taxon="taxon"
            :panel-key="id"
            v-bind="bind"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { isAvailableForRank } from '../utils'
import layouts from '../constants/layouts.js'

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
