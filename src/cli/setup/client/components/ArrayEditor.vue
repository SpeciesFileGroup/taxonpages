<template>
  <div class="mb-4">
    <label v-if="field.label" class="block text-sm font-medium text-base-content mb-2">
      {{ field.label }}
    </label>

    <div
      v-for="(item, index) in items"
      :key="index"
      class="bg-base-background border border-base-border rounded p-3 mb-2"
    >
      <div class="flex justify-between items-center mb-2">
        <span class="text-xs text-base-soft">#{{ index + 1 }}</span>
        <button
          class="px-2 py-0.5 rounded text-xs text-danger border border-danger hover:bg-danger hover:text-white transition-colors"
          @click="removeItem(index)"
        >
          Remove
        </button>
      </div>

      <div class="flex flex-col gap-2">
        <!-- Simple value array -->
        <template v-if="isSimpleType">
          <input
            :type="field.items.type === 'number' ? 'number' : 'text'"
            class="box-border w-full p-1.5 px-2 text-base-content rounded border border-base-border sm:text-sm focus:ring-1 focus:ring-secondary-color focus:border-secondary-color"
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
      class="px-3 py-1 rounded-md text-sm border border-base-border text-base-content hover:bg-base-muted transition-colors"
      @click="addItem"
    >
      + Add
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
