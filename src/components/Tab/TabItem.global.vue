<template>
  <li class="tp-tab-item inline-flex items-center text-sm">
    <RouterLink
      class="block py-2 px-3 text-base-content border-b-2 border-transparent"
      active-class="border-b-2 !border-secondary-color text-secondary-color"
      :to="to"
    >
      <slot />
    </RouterLink>
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
