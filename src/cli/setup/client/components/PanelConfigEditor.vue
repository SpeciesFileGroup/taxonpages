<template>
  <div class="space-y-2">
    <template v-for="(field, key) in schema.fields" :key="key">
      <ObjectEditor
        v-if="field.type === 'object'"
        :field="field"
        :model-value="(modelValue || {})[key]"
        @update:model-value="update(key, $event)"
      />

      <ArrayEditor
        v-else-if="field.type === 'array'"
        :field="field"
        :model-value="(modelValue || {})[key]"
        @update:model-value="update(key, $event)"
      />

      <FormField
        v-else
        :field="field"
        :model-value="(modelValue || {})[key] ?? field.default"
        @update:model-value="update(key, $event)"
      />
    </template>
  </div>
</template>

<script setup>
import FormField from './FormField.vue'
import ArrayEditor from './ArrayEditor.vue'
import ObjectEditor from './ObjectEditor.vue'

const props = defineProps({
  schema: { type: Object, required: true },
  modelValue: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['update:modelValue'])

function update(key, value) {
  const updated = { ...(props.modelValue || {}) }

  if (value === undefined || value === null || value === '') {
    delete updated[key]
  } else {
    updated[key] = value
  }

  emit('update:modelValue', updated)
}
</script>
