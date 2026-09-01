<template>
  <div>
    <span class="text-1xl capitalize">
      {{ store.taxon.rank || 'Combination' }}
    </span>
    <TaxaPageOutlet region="taxa_page:header:rank:after" />
    <div class="flex items-center flex-wrap gap-x-2">
      <h1 class="text-xl text-base-content">
        <span>
          <span
            :title="store.taxon.short_status"
            v-html="store.taxon.full_name_tag"
          />
          <span
            v-if="!store.taxon.is_valid"
            class="ml-1 text-danger"
            title="Invalid"
          >
            &#10005;
          </span>
          <span
            v-if="store.taxon.descorator_status.length"
            class="text-base-soft text-base"
          >
            ({{ store.taxon.descorator_status.join('; ') }})
          </span>
        </span>
      </h1>
      <TaxaPageOutlet region="taxa_page:header:taxonname:after" />
    </div>
    <span class="text-1xl">
      <CommonNames />
    </span>
    <TaxaPageOutlet region="taxa_page:header:taxoninfo:end" />
  </div>
</template>

<script setup>
import { useOtuStore } from '../store/store'
import CommonNames from './CommonNames.vue'
import TaxaPageOutlet from './TaxaPageOutlet.vue'

const store = useOtuStore()
</script>
