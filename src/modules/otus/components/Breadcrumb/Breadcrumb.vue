<template>
  <nav :aria-label="$t('otus.breadcrumb')">
    <ul class="breadcrumb inline-flex items-center flex-wrap">
      <li
        v-for="([item], key, index) in list"
        :key="key"
        class="inline-flex items-center"
      >
        <IconArrowRight
          v-if="index"
          class="w-3 h-3 mr-0.5 ml-0.5 opacity-50"
        />
        <RouterLink
          v-if="item.id"
          class="inline-flex items-center text-sm font-normal hover:text-secondary/75 text-secondary"
          :to="{ name: 'otus-id', params: { id: item.id } }"
        >
          {{ key }}
        </RouterLink>
        <span
          v-else
          class="inline-flex items-center text-sm font-normal"
        >
          {{ key }}
        </span>
      </li>
      <li class="inline-flex items-center ml-0 text-sm">
        <IconArrowRight class="w-3 h-3 mr-0.5 ml-0.5 opacity-50" />
        <span v-html="current.full_name_tag" />
      </li>
    </ul>
  </nav>
</template>

<script setup>
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
