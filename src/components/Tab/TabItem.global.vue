<template>
  <li class="tp-tab-item inline-flex items-center text-sm">
    <RouterLink
      class="block py-2 px-3 text-base-soft border-b-2 border-transparent hover:text-base-content transition-colors duration-150 -mb-px"
      active-class="border-b-2 !border-secondary !text-secondary font-medium"
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
