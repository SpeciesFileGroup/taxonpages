<template>
  <div>
    <span class="text-1xl">
      {{ rankLabel(store.taxon.rank, i18n) || $t('otus.combination') }}
    </span>
    <h1 class="text-xl text-base-content">
      <span>
        <span
          :title="store.taxon.short_status"
          v-html="store.taxon.full_name_tag"
        />
        <span
          v-if="!store.taxon.is_valid"
          class="ml-1 text-danger"
          :title="$t('otus.invalid')"
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
import { useI18n } from 'vue-i18n'
import { useOtuStore } from '../store/store'
import { rankLabel } from '@/i18n/vocabulary'
import CommonNames from './CommonNames.vue'

const store = useOtuStore()
const i18n = useI18n()
</script>
