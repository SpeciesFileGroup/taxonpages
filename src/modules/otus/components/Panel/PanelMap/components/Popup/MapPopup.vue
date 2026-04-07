<template>
  <div class="max-h-32 overflow-y-auto text-xs min-w-80">
    <ul>
      <component
        v-for="(item, index) in items"
        :key="index"
        :is="POPUP_COMPONENTS[item.type] || PopupDefault"
        :item="item"
        @selected="(item) => emit('selected', item)"
      />
    </ul>
  </div>
</template>

<script setup>
import {
  ASSERTED_DISTRIBUTION,
  COLLECTION_OBJECT,
  FIELD_OCCURRENCE
} from '@/constants/objectTypes.js'
import PopupAssertedDistribution from './PopupAssertedDistribution.vue'
import PopupCollectionObject from './PopupCollectionObject.vue'
import PopupFieldOccurrence from './PopupFieldOccurrence.vue'
import PopupDefault from './PopupDefault.vue'

const POPUP_COMPONENTS = {
  [ASSERTED_DISTRIBUTION]: PopupAssertedDistribution,
  [COLLECTION_OBJECT]: PopupCollectionObject,
  [FIELD_OCCURRENCE]: PopupFieldOccurrence
}

defineProps({
  items: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['selected'])
</script>
