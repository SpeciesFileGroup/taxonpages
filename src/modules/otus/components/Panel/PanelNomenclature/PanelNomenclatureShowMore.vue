<template>
  <li
    class="flex justify-start border-b p-3 px-4 cursor-pointer border-base-muted"
  >
    <div
      class="h-5 w-5 text-secondary-color opacity-60 mr-2 cursor-pointer"
      @click="() => (isExpanded = !isExpanded)"
    >
      <IconPlusCircle class="h-5 w-5" />
    </div>
    <span>... Show all ... ({{ count }})</span>
  </li>
</template>

<script setup>
defineProps({
  count: {
    type: Number,
    required: true
  }
})
</script>
