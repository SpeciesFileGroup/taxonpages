<template>
  <div class="mb-5 rounded-lg border border-base-border bg-base-muted/30 p-4">
    <div
      v-if="field.label"
      class="text-base font-semibold text-base-content mb-3 pb-2.5 border-b border-base-border"
    >
      {{ field.label }}
    </div>

    <template
      v-for="(subField, subKey) in field.fields"
      :key="subKey"
    >
      <!-- Nested object -->
      <ObjectEditor
        v-if="subField.type === 'object'"
        :field="subField"
        :model-value="(modelValue || {})[subKey]"
        @update:model-value="updateField(subKey, $event)"
      />

      <!-- Nested array -->
      <ArrayEditor
        v-else-if="subField.type === 'array'"
        :field="subField"
        :model-value="(modelValue || {})[subKey]"
        @update:model-value="updateField(subKey, $event)"
      />

      <!-- Scalar field -->
      <FormField
        v-else
        :field="subField"
        :model-value="(modelValue || {})[subKey]"
        @update:model-value="updateField(subKey, $event)"
      />
    </template>
  </div>
</template>

<script setup>
import FormField from './FormField.vue'
import ArrayEditor from './ArrayEditor.vue'

const props = defineProps({
  field: { type: Object, required: true },
  modelValue: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['update:modelValue'])

function updateField(key, value) {
  emit('update:modelValue', {
    ...(props.modelValue || {}),
    [key]: value
  })
}
</script>
