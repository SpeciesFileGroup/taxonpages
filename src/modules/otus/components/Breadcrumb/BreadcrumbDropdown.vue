<template>
  <div class="relative">
    <div>
      <button
        class="inline-flex items-center text-sm hover:text-gray-900 text-primary-500 dark:hover:text-gray-500"
        @click="dropdownOpen = !dropdownOpen"
      >
        <slot />
        <svg
          class="h-5 w-5 text-primary-500 print:hidden"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clip-rule="evenodd"
          />
        </svg>
      </button>

      <div
        v-if="dropdownOpen"
        class="fixed inset-0 h-full w-full z-10"
        @click="dropdownOpen = false"
      />

      <div
        v-if="dropdownOpen"
        class="absolute right-0 py-2 bg-white dark:bg-gray-900 rounded-md shadow-xl z-20"
      >
        <router-link
          v-for="otu in list"
          :key="otu.id"
          class="block px-4 py-2 text-sm capitalize hover:bg-secondary-color hover:bg-opacity-5"
          :to="{ name: 'otus-id', params: { id: otu.id } }"
        >
          {{ otu.name || key }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  list: {
    type: Array,
    required: true
  }
})

const dropdownOpen = ref(false)
</script>
