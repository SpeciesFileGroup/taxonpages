<template>
  <article class="bg-base-foreground rounded-md shadow overflow-hidden">
    <div class="p-6">
      <div
        v-if="date"
        class="flex items-center gap-2 mb-3"
      >
        <IconCalendar class="h-3.5 w-3.5" />
        <span class="text-sm text-base-lighter">{{ news.createdAt }}</span>
      </div>

      <h3 class="text-2xl mb-3 leading-snug">
        <RouterLink :to="`/news/${news.id}`"> {{ news.title }}</RouterLink>
      </h3>
      <p
        class="mb-4 line-clamp-3"
        v-html="news.content"
      />
    </div>
  </article>
</template>

<script setup>
const props = defineProps({
  news: {
    type: Object,
    required: true
  },

  date: {
    type: Boolean,
    default: true
  }
})
</script>
