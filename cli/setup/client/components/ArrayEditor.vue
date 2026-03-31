<template>
  <div class="mb-5">
    <label v-if="field.label" class="block text-sm font-medium text-base-content mb-2">
      {{ field.label }}
    </label>

    <div
      v-for="(item, index) in items"
      :key="index"
      class="relative bg-base-muted/40 border border-base-border rounded-lg p-4 mb-2.5 group"
    >
      <div class="flex justify-between items-center mb-3">
        <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-base-muted text-[10px] font-semibold text-base-soft">
          {{ index + 1 }}
        </span>
        <button
          class="tp-btn tp-btn-danger tp-btn-sm opacity-0 group-hover:opacity-100 transition-opacity"
          @click="removeItem(index)"
        >
          Remove
        </button>
      </div>

      <div class="space-y-1">
        <!-- Simple value array -->
        <template v-if="isSimpleType">
          <input
            :type="field.items.type === 'number' ? 'number' : 'text'"
            class="tp-input"
            :value="item"
            @input="updateSimpleItem(index, $event.target.value)"
          >
        </template>

        <!-- Object array -->
        <template v-else>
          <div
            v-for="(subField, subKey) in field.items"
            :key="subKey"
          >
            <template v-if="subField.type !== 'array'">
              <FormField
                :field="subField"
                :model-value="item[subKey]"
                @update:model-value="updateItemField(index, subKey, $event)"
              />
            </template>
          </div>
        </template>
      </div>
    </div>

    <button
      class="tp-btn tp-btn-outline tp-btn-sm"
      @click="addItem"
    >
      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      Add item
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import FormField from './FormField.vue'

const props = defineProps({
  field: { type: Object, required: true },
  modelValue: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:modelValue'])

const items = computed(() => props.modelValue || [])

const isSimpleType = computed(() => {
  const itemsDef = props.field.items
  return itemsDef && typeof itemsDef.type === 'string' && !itemsDef.fields
})

function addItem() {
  const newItems = [...items.value]

  if (isSimpleType.value) {
    newItems.push(props.field.items.type === 'number' ? 0 : '')
  } else {
    const obj = {}
    for (const [key, subField] of Object.entries(props.field.items)) {
      if (subField.type === 'string') obj[key] = ''
      else if (subField.type === 'number') obj[key] = 0
      else if (subField.type === 'boolean') obj[key] = false
      else if (subField.type === 'array') obj[key] = []
      else obj[key] = ''
    }
    newItems.push(obj)
  }

  emit('update:modelValue', newItems)
}

function removeItem(index) {
  const newItems = [...items.value]
  newItems.splice(index, 1)
  emit('update:modelValue', newItems)
}

function updateItemField(index, key, value) {
  const newItems = [...items.value]
  newItems[index] = { ...newItems[index], [key]: value }
  emit('update:modelValue', newItems)
}

function updateSimpleItem(index, value) {
  const newItems = [...items.value]
  newItems[index] = props.field.items.type === 'number' ? Number(value) : value
  emit('update:modelValue', newItems)
}
</script>
