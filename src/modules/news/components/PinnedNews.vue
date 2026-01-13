<template>
  <div :class="['grid gap-2 md:gap-8', `md:${gridCols}`]">
    <article
      v-for="item in news"
      :key="item.id"
      class="bg-base-foreground rounded-md shadow overflow-hidden"
    >
      <div class="md:flex h-full">
        <div class="p-8 md:p- flex flex-col justify-between">
          <div>
            <div
              v-if="date"
              class="flex items-center gap-2 mb-4"
            >
              <IconCalendar class="h-3.5 w-3.5" />
              <span class="text-sm text-base-lighter">{{
                item.createdAt
              }}</span>
            </div>
            <h2 class="text-3xl font-medium mb-4 leading-tight">
              {{ item.title }}
            </h2>
            <div
              class="leading-relaxed mb-6 line-clamp-3 text-ellipsis break-all"
              v-html="item.content"
            />
          </div>
          <div class="flex items-center justify-between">
            <RouterLink
              :to="`/news/${item.id}`"
              class="px-6 py-3 bg-primary-color text-primary-content font-medium rounded-lg"
            >
              Read more →
            </RouterLink>
          </div>
        </div>
      </div>
    </article>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const GRID_COLS = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3'
}

const props = defineProps({
  news: {
    type: Array,
    required: true
  },

  date: {
    type: Boolean,
    default: true
  }
})

const gridCols = computed(() => {
  const count = props.news.length

  if (count <= 2) return GRID_COLS[count]
  if (count === 4) return GRID_COLS[2]
  return GRID_COLS[3]
})
</script>
