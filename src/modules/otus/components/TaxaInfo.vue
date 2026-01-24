<template>
  <div>
    <span class="text-1xl capitalize">
      {{ store.taxon.rank || 'Combination' }}
    </span>
    <h1 class="text-xl dark:text-gray-100">
      <span>
        <span
          :title="store.taxon.short_status"
          v-html="store.taxon.full_name_tag"
        />
        <span
          v-if="!store.taxon.is_valid"
          class="ml-1 text-red-600"
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
    <span class="text-1xl">
      <CommonNames />
    </span>
  </div>
</template>

<script setup>
import { useOtuStore } from '../store/store'
import CommonNames from './CommonNames.vue'

const store = useOtuStore()
</script>
