<template>
  <li
    class="py-2 last:border-0 truncate border-b border-base-border"
    :title="item.label"
  >
    <span>{{ item.label }}</span>
  </li>
</template>

<script setup>
defineProps({
  item: {
    type: Object,
    required: true
  }
})
</script>
