<template>
  <div>
    <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
      <div class="grid grid-cols-1 gap-3 auto-rows-min">
        <template
          v-for="({ component, available }) in overviewLayout.left"
          :key="component"
        >
          <component
            :is="component"
            v-if="!available || isComponentForRank(available, taxonRank)"
            :otu-id="otuId"
            :taxon-id="taxonId"
            :taxon="taxon"
          />
        </template>
      </div>
      <div class="grid grid-cols-1 auto-rows-min gap-3">
        <template
          v-for="({ component, available }) in overviewLayout.right"
          :key="component"
        >
          <component
            :is="component"
            v-if="!available || isComponentForRank(available, taxonRank)"
            :otu-id="otuId"
            :taxon-id="taxonId"
            :taxon="taxon"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { overviewLayout } from '../constants/overviewLayout'

defineProps({
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

  taxon: {
    type: Object,
    required: true
  }
})

const isComponentForRank = (available, rankString) => available.some(rankGroup => rankString?.includes(rankGroup))

</script>