<template>
  <div class="mb-3">
    <label v-if="field.label" class="block text-sm font-medium text-base-content mb-1.5">
      {{ field.label }}
      <span v-if="field.required" class="text-danger/70 ml-0.5">*</span>
    </label>
    <p v-if="field.description" class="text-xs text-base-soft mb-2 leading-relaxed">
      {{ field.description }}
    </p>

    <!-- String -->
    <input
      v-if="field.type === 'string'"
      type="text"
      class="tp-input"
      :value="modelValue"
      :placeholder="field.placeholder || ''"
      @input="$emit('update:modelValue', $event.target.value)"
    >

    <!-- Number -->
    <input
      v-if="field.type === 'number'"
      type="number"
      class="tp-input"
      :value="modelValue"
      @input="$emit('update:modelValue', Number($event.target.value))"
    >

    <!-- Boolean (toggle switch) -->
    <label v-if="field.type === 'boolean'" class="inline-flex items-center gap-3 cursor-pointer group">
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
          style="margin-top: 2px;"
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
defineProps({
  field: { type: Object, required: true },
  modelValue: { default: null }
})

defineEmits(['update:modelValue'])
</script>
