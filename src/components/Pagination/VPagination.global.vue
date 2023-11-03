<template>
  <ul
    aria-disabled="false"
    aria-label="Pagination"
    class="flex flex-row text-sm"
  >
    <li>
      <button
        type="button"
        :disabled="currentPage < 2"
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
        :disabled="currentPage < 2"
        aria-label="Go to previous page"
        class="border border-base-border px-2 py-1.5"
        @click="currentPage--"
      >
        ‹
      </button>
    </li>

    <li
      v-for="n in pages"
      class="page-item"
      :key="n"
    >
      <button
        type="button"
        aria-label="Go to page 1"
        class="border border-base-border px-2 py-1.5"
        :disabled="currentPage === n"
        :class="
          currentPage === n
            ? 'text-primary-content bg-primary-color'
            : 'text-base-content'
        "
        @click="() => (currentPage = n)"
      >
        {{ n }}
      </button>
    </li>

    <li class="page-item">
      <button
        type="button"
        aria-label="Go to next page"
        class="border border-base-border px-2 py-1.5"
        :disabled="currentPage === pages"
        @click="() => currentPage++"
      >
        ›
      </button>
    </li>
    <li role="presentation">
      <button
        type="button"
        :disabled="currentPage === pages"
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
  }
})

const emit = defineEmits(['update:modelValue'])

const pages = computed(() => Math.ceil(props.total / props.per))
const currentPage = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value)
  }
})
</script>
