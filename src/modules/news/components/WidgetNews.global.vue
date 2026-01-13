<template>
  <div class="flex flex-col gap-4">
    <article
      v-for="item in news"
      :key="item.id"
      class="bg-base-foreground rounded-md shadow overflow-hidden"
    >
      <div class="p-6">
        <div class="flex flex-row gap-2 items-center mb-3">
          <div
            v-if="show_date"
            class="flex items-center gap-2"
          >
            <IconCalendar class="h-3.5 w-3.5" />
            <span class="text-sm text-base-lighter">{{ item.createdAt }}</span>
          </div>
        </div>
        <h3 class="text-xl font-medium mb-3 leading-snug">
          <RouterLink :to="`/news/${item.id}`">{{ item.title }}</RouterLink>
        </h3>
        <p
          v-if="show_content"
          class="mb-4 line-clamp-2"
          v-html="item.content"
        />
      </div>
    </article>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { News } from '../services/News'
import { makeNews } from '../adapters/makeNews'

const { news_module = {} } = __APP_ENV__

const {
  widget: { news_count = 3, show_content = true, show_date = true } = {}
} = news_module

const news = ref([])

function loadNews() {
  News.where({ per: news_count }).then(({ data }) => {
    news.value = data.map(makeNews)
  })
}

onMounted(() => {
  loadNews()
})
</script>
