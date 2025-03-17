<template>
  <li class="tp-tab-item inline-flex items-center text-sm">
    <router-link
      class="p-2 pb-2 block py-2 pr-4 pl-3 text-base-content border-b-2 border-transparent"
      active-class="border-b-2 !border-secondary-color font-medium"
      :to="to"
    >
      <slot />
    </router-link>
  </li>
</template>

<script setup>
defineProps({
  to: {
    type: [String, Object],
    required: true
  }
})
</script>
