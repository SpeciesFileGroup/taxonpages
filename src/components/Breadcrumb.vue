<template>
  <ul class="inline-flex items-center space-x-1 flex-wrap">
    <li
      v-for="(item, key, index) in list"
      :key="item.id"
      class="inline-flex items-center"
    >
      <svg
        v-if="index"
        class="w-4 h-4 text-gray-400"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill-rule="evenodd"
          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
          clip-rule="evenodd"
        />
      </svg>
      <router-link 
        v-if="item.length === 1"
        class="inline-flex items-center text-sm text-gray-700 hover:text-gray-900"
        :to="{ name: 'otus-id', params: { id: item[0].id } }"
      >
        {{ key }}
      </router-link>
      <breadcrumb-dropdown 
        v-else 
        :list="item.map(o => ({ ...o, name: o.name || key }))"
      >
        {{ key }}
      </breadcrumb-dropdown>
    </li>

    <li 
      class="inline-flex items-center"
    >
      <svg
        class="w-4 h-4 text-gray-400"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill-rule="evenodd"
          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
          clip-rule="evenodd"
        />
      </svg>
      <span
        class="text-sm"
        v-html="current.name_string"
      />
    </li>
  </ul>
</template>

<script setup>
import BreadcrumbDropdown from './BreadcrumbDropdown.vue';

const props = defineProps({
  list: {
    type: Object,
    default: () => ({})
  },

  current: {
    type: Object,
    required: true
  }
})
</script>