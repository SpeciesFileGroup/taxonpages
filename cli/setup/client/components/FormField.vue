<template>
  <div class="mb-3">
    <label
      v-if="field.label"
      :class="[
        'block text-sm font-medium text-base-content',
        !field.description && 'mb-1.5'
      ]"
    >
      {{ field.label }}
      <span
        v-if="field.required"
        class="text-danger/70 ml-0.5"
        >*</span
      >
    </label>
    <p
      v-if="field.description"
      class="text-xs text-base-soft mb-2 leading-relaxed"
    >
      {{ field.description }}
    </p>

    <!-- String, one text per locale -->
    <TranslatableField
      v-if="asTranslation"
      :field="field"
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
    />

    <!-- String -->
    <input
      v-else-if="field.type === 'string'"
      type="text"
      class="tp-input"
      :value="modelValue"
      :placeholder="field.placeholder || ''"
      @input="$emit('update:modelValue', $event.target.value)"
    />

    <!-- Number -->
    <input
      v-if="field.type === 'number'"
      type="number"
      class="tp-input"
      :value="modelValue"
      @input="$emit('update:modelValue', Number($event.target.value))"
    />

    <!-- Boolean (toggle switch) -->
    <label
      v-if="field.type === 'boolean'"
      class="inline-flex items-center gap-3 cursor-pointer group"
    >
      <button
        type="button"
        role="switch"
        :aria-checked="!!modelValue"
        class="relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-secondary-color focus-visible:ring-offset-2"
        :class="modelValue ? 'bg-secondary-color' : 'bg-base-muted'"
        @click="$emit('update:modelValue', !modelValue)"
      >
        <span
          class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200"
          :class="modelValue ? 'translate-x-5' : 'translate-x-0.5'"
          style="margin-top: 2px"
        />
      </button>
      <span class="text-sm text-base-content select-none">
        {{ modelValue ? 'Enabled' : 'Disabled' }}
      </span>
    </label>

    <!-- Select -->
    <select
      v-if="field.type === 'select'"
      class="tp-select"
      :value="modelValue"
      @change="$emit('update:modelValue', $event.target.value)"
    >
      <option
        v-for="opt in field.options"
        :key="opt"
        :value="opt"
      >
        {{ opt }}
      </option>
    </select>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import TranslatableField from './TranslatableField.vue'
import { useI18nConfig } from '../composables/useI18nConfig.js'

const props = defineProps({
  field: { type: Object, required: true },
  modelValue: { default: null }
})

defineEmits(['update:modelValue'])

const { isTranslation } = useI18nConfig()

/**
 * Whether to edit this value as one text per locale.
 *
 * Two ways in. The schema marking the field `translatable` is the intended
 * one; on a single-locale site the component still renders a single input and
 * emits a plain string, so the form looks exactly as it did before i18n
 * existed.
 *
 * The value already being a translation is the other, and holds whatever the
 * schema says. That is what stops the plain input from rendering a map as
 * "[object Object]" and flattening every translation in it on the next
 * keystroke — for a field nobody remembered to mark, or one belonging to a
 * package whose schema this wizard cannot change.
 */
const asTranslation = computed(() => {
  if (props.field.type !== 'string') return false

  return (
    props.field.translatable === true ||
    isTranslation(props.modelValue, false)
  )
})
</script>
