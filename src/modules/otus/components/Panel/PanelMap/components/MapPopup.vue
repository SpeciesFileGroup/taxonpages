<template>
  <div class="max-h-32 overflow-y-auto text-xs min-w-80">
    <ul>
      <li
        v-for="item in items"
        class="py-2 last:border-0 truncate border-b"
        title="label"
      >
        <span
          v-if="CLICKEABLE_TYPES.includes(item.type)"
          class="cursor-pointer text-secondary-color"
          v-text="item.label"
          @click="() => emit('selected', item)"
        />
        <span v-else>{{ item.label }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { COLLECTION_OBJECT, FIELD_OCCURRENCE } from '@/constants/objectTypes.js'

const CLICKEABLE_TYPES = [COLLECTION_OBJECT, FIELD_OCCURRENCE]

defineProps({
  items: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['selected'])
</script>
