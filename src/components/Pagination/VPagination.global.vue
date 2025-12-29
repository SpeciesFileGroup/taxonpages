<template>
  <ul
    aria-disabled="false"
    aria-label="Pagination"
    class="flex flex-row text-sm"
  >
    <li>
      <button
        type="button"
        :disabled="currentPage < 2 || !pages"
        aria-label="Go to first page"
        class="border border-base-border rounded-l-md px-2 py-1.5"
        @click="currentPage = 1"
      >
        «
      </button>
    </li>
    <li
      role="presentation"
      class="page-item"
    >
      <button
        type="button"
        :disabled="currentPage < 2 || !pages"
        aria-label="Go to previous page"
        class="border border-base-border px-2 py-1.5"
        @click="currentPage--"
      >
        ‹
      </button>
    </li>

    <li
      v-if="modelValue > props.rangePages"
      class="border border-base-border px-2 py-1.5"
    >
      ...
    </li>

    <template
      v-for="n in pages"
      :key="n"
    >
      <li
        v-if="n < rangeMax && rangeMin < n"
        class="page-item"
      >
        <button
          type="button"
          aria-label="Go to page 1"
          :disabled="currentPage === n"
          :class="[
            'border',
            'border-base-border',
            'px-2',
            'py-1.5',
            currentPage === n
              ? 'text-primary-content bg-primary-color'
              : 'text-base-content'
          ]"
          @click="() => (currentPage = n)"
        >
          {{ n }}
        </button>
      </li>
    </template>

    <li
      v-if="pages - modelValue >= rangePages"
      class="border border-base-border px-2 py-1.5"
    >
      ...
    </li>

    <li class="page-item">
      <button
        type="button"
        aria-label="Go to next page"
        class="border border-base-border px-2 py-1.5"
        :disabled="currentPage === pages || !pages"
        @click="() => currentPage++"
      >
        ›
      </button>
    </li>
    <li role="presentation">
      <button
        type="button"
        :disabled="currentPage === pages || !pages"
        aria-label="Go to last page"
        class="border border-base-border rounded-r-md px-2 py-1.5"
        @click="() => (currentPage = pages)"
      >
        »
      </button>
    </li>
  </ul>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Number,
    required: true
  },

  total: {
    type: Number,
    required: true
  },

  per: {
    type: Number,
    required: true
  },

  rangePages: {
    type: Number,
    default: 5
  }
})

const emit = defineEmits(['update:modelValue', 'select'])

const pages = computed(() => Math.ceil(props.total / props.per))
const currentPage = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('select', value)
    emit('update:modelValue', value)
  }
})

const rangeMax = computed(() => props.modelValue + props.rangePages)
const rangeMin = computed(() => props.modelValue - props.rangePages)
</script>
