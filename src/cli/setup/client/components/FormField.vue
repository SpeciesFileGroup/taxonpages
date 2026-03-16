<template>
  <div class="mb-4">
    <label v-if="field.label" class="block text-sm font-medium text-base-content mb-1">
      {{ field.label }}
    </label>
    <p v-if="field.description" class="text-xs text-base-soft mb-1">
      {{ field.description }}
    </p>

    <!-- String -->
    <input
      v-if="field.type === 'string'"
      type="text"
      class="box-border w-full p-1.5 px-2 text-base-content rounded border border-base-border sm:text-sm placeholder:text-sm focus:ring-1 focus:ring-secondary-color focus:border-secondary-color"
      :value="modelValue"
      :placeholder="field.placeholder || ''"
      @input="$emit('update:modelValue', $event.target.value)"
    >

    <!-- Number -->
    <input
      v-if="field.type === 'number'"
      type="number"
      class="box-border w-full p-1.5 px-2 text-base-content rounded border border-base-border sm:text-sm focus:ring-1 focus:ring-secondary-color focus:border-secondary-color"
      :value="modelValue"
      @input="$emit('update:modelValue', Number($event.target.value))"
    >

    <!-- Boolean -->
    <label v-if="field.type === 'boolean'" class="inline-flex items-center gap-2 cursor-pointer">
      <span
        class="relative inline-block w-9 h-5 rounded-full transition-colors duration-200"
        :class="modelValue ? 'bg-secondary-color' : 'bg-base-muted'"
      >
        <span
          class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200"
          :class="{ 'translate-x-4': modelValue }"
        />
        <input
          type="checkbox"
          class="sr-only"
          :checked="modelValue"
          @change="$emit('update:modelValue', $event.target.checked)"
        >
      </span>
      <span class="text-sm text-base-content">{{ modelValue ? 'Enabled' : 'Disabled' }}</span>
    </label>

    <!-- Select -->
    <select
      v-if="field.type === 'select'"
      class="box-border w-full p-1.5 px-2 text-base-content rounded border border-base-border sm:text-sm focus:ring-1 focus:ring-secondary-color focus:border-secondary-color bg-base-foreground"
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
