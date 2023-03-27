<template>
  <ul class="inline-flex items-center flex-wrap">
    <li
      v-for="(item, key, index) in list"
      :key="item.id"
      class="inline-flex items-center"
    >
      <IconArrowRight
        v-if="index"
        class="w-3 h-3 mr-0.5 ml-0.5 opacity-50"
      />
      <router-link
        v-if="item.length === 1"
        class="inline-flex items-center text-sm text-accent-100 hover:text-gray-900 dark:hover:text-gray-500 text-secondary-color"
        :to="{ name: 'otus-id', params: { id: item[0].id } }"
      >
        {{ key }}
      </router-link>
      <BreadcrumbDropdown
        v-else
        :list="item.map((o) => ({ ...o, name: o.name || key }))"
      >
        {{ key }}
      </BreadcrumbDropdown>
    </li>

    <li class="inline-flex items-center ml-0 text-sm">
      <IconArrowRight class="w-3 h-3 mr-0.5 ml-0.5 opacity-50" />
      <span v-html="current.full_name_tag" />
    </li>
  </ul>
</template>

<script setup>
import BreadcrumbDropdown from './BreadcrumbDropdown.vue'

defineProps({
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
