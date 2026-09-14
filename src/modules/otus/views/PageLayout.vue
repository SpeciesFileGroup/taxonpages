<template>
  <div class="grid gap-4">
    <div
      v-for="row in pageLayout.panels"
      :class="['grid', 'grid-cols-1', 'gap-4', columnClasses[row.length]]"
    >
      <div
        v-for="(column, index) in row"
        class="grid grid-cols-1 gap-4 auto-rows-min"
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
            v-bind="localizeBind(bind)"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { isAvailableForRank } from '../utils'
import { defaultTabRouteName } from '../router/index.js'
import { localizeDeep } from '@/i18n/localize'
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
const { locale } = useI18n()
const pageLayout = layouts[router.currentRoute.value.meta.tab]

// Panel props come from taxa_page.yml, where any of them may carry a
// translation (a title, typically) alongside values that are not text at all.
const localizeBind = (bind) => localizeDeep(bind, locale.value, __APP_ENV__)
const columnClasses = {
  1: ['md:grid-cols-1'],
  2: ['md:grid-cols-2'],
  3: ['md:grid-cols-3']
}

if (
  pageLayout.rankGroup?.length &&
  !isAvailableForRank(pageLayout.rankGroup, props.taxonRank) &&
  defaultTabRouteName
) {
  router.replace({ name: defaultTabRouteName })
}
</script>
