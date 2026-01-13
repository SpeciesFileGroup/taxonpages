<template>
  <div class="flex gap-2">
    <button
      v-for="item in categories"
      :key="item"
      :class="[
        'px-4 py-2 rounded-lg text-sm font-medium border border-base-border',
        value === item
          ? 'bg-primary-color text-primary-content'
          : 'text-base-content bg-base-foreground'
      ]"
      @click="() => (value = item)"
    >
      {{ item }}
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  categories: {
    type: Array,
    default: () => ['All', 'BlogPost', 'Instruction', 'Notice']
  }
})

const value = defineModel({
  type: String,
  default: 'all'
})
</script>
