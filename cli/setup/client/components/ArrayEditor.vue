<template>
  <div class="mb-3">
    <label
      v-if="field.label"
      class="block text-sm font-medium text-base-content mb-2"
    >
      {{ field.label }}
    </label>
    <p
      v-if="field.description"
      class="text-xs text-base-soft mb-2 leading-relaxed"
    >
      {{ field.description }}
    </p>

    <!-- Simple value array: compact inline rows -->
    <template v-if="isSimpleType">
      <div
        v-for="(item, index) in items"
        :key="index"
        class="flex items-center gap-2 mb-1.5 group"
      >
        <input
          :type="field.items.type === 'number' ? 'number' : 'text'"
          class="tp-input"
          :placeholder="field.items.placeholder || 'Enter a value'"
          :value="item"
          @input="updateSimpleItem(index, $event.target.value)"
        />
        <div
          class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        >
          <template v-if="field.sortable">
            <button
              class="tp-btn tp-btn-sm p-1"
              :disabled="index === 0"
              @click="moveItem(index, -1)"
            >
              <svg
                class="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M5 15l7-7 7 7"
                />
              </svg>
            </button>
            <button
              class="tp-btn tp-btn-sm p-1"
              :disabled="index === items.length - 1"
              @click="moveItem(index, 1)"
            >
              <svg
                class="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </template>
          <button
            class="tp-btn tp-btn-danger tp-btn-sm p-1"
            @click="removeItem(index)"
          >
            <svg
              class="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </template>

    <!-- Object array: card layout -->
    <template v-else>
      <div
        v-for="(item, index) in items"
        :key="index"
        class="flex gap-3 bg-base-muted/40 border border-base-border rounded-lg p-3 mb-2"
      >
        <div class="flex-1 space-y-1">
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
        </div>

        <div
          :class="[
            'flex flex-col items-center shrink-0',
            field.sortable ? 'justify-between' : 'justify-center'
          ]"
        >
          <button
            v-if="field.sortable"
            class="tp-btn tp-btn-sm p-1"
            :disabled="index === 0"
            @click="moveItem(index, -1)"
          >
            <svg
              class="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M5 15l7-7 7 7"
              />
            </svg>
          </button>
          <button
            :class="['tp-btn tp-btn-danger p-1', !field.sortable && 'mt-3.5']"
            @click="removeItem(index)"
          >
            <svg
              class="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
          <button
            v-if="field.sortable"
            class="tp-btn tp-btn-sm p-1"
            :disabled="index === items.length - 1"
            @click="moveItem(index, 1)"
          >
            <svg
              class="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>
    </template>

    <button
      class="tp-btn tp-btn-outline tp-btn-sm"
      @click="addItem"
    >
      <svg
        class="w-3.5 h-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M12 4v16m8-8H4"
        />
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
    newItems.push('')
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

function moveItem(index, direction) {
  const target = index + direction
  if (target < 0 || target >= items.value.length) return

  const newItems = [...items.value]
  const temp = newItems[index]
  newItems[index] = newItems[target]
  newItems[target] = temp
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
