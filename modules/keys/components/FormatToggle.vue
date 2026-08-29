<template>
  <div class="inline-flex rounded border border-base-muted overflow-hidden text-sm">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      class="px-3 py-1"
      :class="modelValue === opt.value
        ? 'bg-primary text-primary-content'
        : 'bg-base-foreground text-base-content hover:bg-base-muted'"
      @click="$emit('update:modelValue', opt.value)"
    >{{ opt.label }}</button>
  </div>
</template>

<script setup>
defineProps({ modelValue: { type: String, required: true } })
defineEmits(['update:modelValue'])

const options = [
  { value: 'guided', label: 'Guided' },
  { value: 'full', label: 'Full key' }
]
</script>
