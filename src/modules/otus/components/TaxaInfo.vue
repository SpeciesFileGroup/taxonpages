<template>
  <div>
    <h2 class="text-1xl capitalize">
      {{ store.taxon.rank || 'Combination' }}
    </h2>
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
      </span>
    </h1>
    <h2 class="text-1xl">
      <CommonNames />
    </h2>
  </div>
</template>

<script setup>
import { useOtuStore } from '../store/store'
import CommonNames from './CommonNames.vue'

const store = useOtuStore()
</script>
