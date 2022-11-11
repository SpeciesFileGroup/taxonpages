<template>
  <div :class="{ invisible: !taxon.id }">
    <h2 class="text-1xl capitalize">
      {{ taxon.rank || 'Combination' }}
    </h2>
    <h1 class="text-xl dark:text-gray-100">
      <span>
        <span 
          :title="taxon.short_status"
          v-html="taxon.full_name_tag" 
        />
        <span 
          v-if="!taxon.is_valid"
          class="ml-1"
          :class="statusStyle"
          title="Invalid"
          v-html="status"
        />
        
      </span>
    </h1>
    <h2 class="text-1xl">
      <CommonNames :otu-id="props.otuId" />
    </h2>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import CommonNames from './CommonNames.vue'

const props = defineProps({
  taxon: {
    type: Object,
    default: () => ({})
  },

  otuId: {
    type: Number,
    default: undefined
  }
})

const status = computed(() => 
  props.taxon.cached_is_valid
    ? ''
    : '&#10005;'
)
const statusStyle = computed(() => 
  props.taxon.cached_is_valid
    ? ''
    : 'text-red-600'
)

</script>
