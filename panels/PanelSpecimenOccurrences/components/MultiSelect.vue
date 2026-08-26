<!--
  A checkbox-list multi-select dropdown — this framework has no ready-made
  multi-select component (SelectInput is single-value only, Autocomplete is
  an API-backed single-pick search), so this is a small local one for
  filtering against an already-known, fixed local list of values.
-->
<template>
  <div class="relative">
    <button
      type="button"
      class="box-border p-2 px-3 text-base-content rounded-md border sm:text-sm text-left min-w-32 border-base-border hover:border-base-soft/40 focus:border-secondary focus:ring-2 focus:ring-secondary/15 focus:outline-none transition-[border-color,box-shadow] duration-150"
      :class="modelValue.length ? 'ring-2 ring-secondary' : ''"
      @click="open ? close() : openAndFocus()"
    >{{ summaryLabel }}</button>

    <div
      v-if="open"
      class="fixed inset-0 z-10"
      @click="close"
    />
    <div
      v-if="open"
      class="absolute z-20 mt-1 bg-base-foreground border border-base-border rounded-md shadow-lg min-w-48 p-1"
    >
      <InputText
        ref="searchInput"
        v-model="search"
        placeholder="Search..."
        class="block w-full mb-1"
      />
      <div class="max-h-56 overflow-y-auto">
        <label
          v-for="option in filteredOptions"
          :key="option"
          class="flex items-center gap-2 px-2 py-1 text-sm hover:bg-base-muted rounded cursor-pointer"
        >
          <input
            type="checkbox"
            :checked="modelValue.includes(option)"
            @change="toggleOption(option)"
          />
          {{ option }}
        </label>
        <div
          v-if="!filteredOptions.length"
          class="px-2 py-1 text-sm opacity-50"
        >No matching options</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, useTemplateRef } from 'vue'

const props = defineProps({
  options: {
    type: Array,
    default: () => []
  },

  modelValue: {
    type: Array,
    default: () => []
  },

  placeholder: {
    type: String,
    default: 'All'
  }
})

const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const search = ref('')
const searchInputRef = useTemplateRef('searchInput')

async function openAndFocus() {
  open.value = true
  await nextTick()
  searchInputRef.value?.inputRef?.value?.focus()
}

const summaryLabel = computed(() => {
  if (!props.modelValue.length) return props.placeholder
  if (props.modelValue.length <= 2) return props.modelValue.join(', ')
  return `${props.modelValue.length} selected`
})

const filteredOptions = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return props.options
  return props.options.filter((option) => option.toLowerCase().includes(term))
})

function toggleOption(option) {
  const next = props.modelValue.includes(option)
    ? props.modelValue.filter((o) => o !== option)
    : [...props.modelValue, option]
  emit('update:modelValue', next)
}

function close() {
  open.value = false
  search.value = ''
}
</script>
