<template>
  <div class="container mx-auto px-4 md:px-0 box-border py-8">
    <h1 class="font-medium text-4xl mb-4">News</h1>

    <PinnedNews
      v-if="store.pinnedNews.length"
      class="mb-8 border-b border-base-border pb-8"
      :news="store.pinnedNews"
      :date="show_date"
    />

    <div :class="['grid gap-4', layout]">
      <NewsCard
        v-for="item in store.news"
        :key="item.id"
        :news="item"
        :date="show_date"
      />
    </div>

    <div class="flex justify-center items-center gap-2 mt-8">
      <VPagination
        v-if="store.pagination"
        v-model="store.pagination.page"
        :total="store.pagination.total"
        :per="store.pagination.per"
        @select="(page) => store.loadNews(page, per)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import PinnedNews from '../components/PinnedNews.vue'
import NewsCard from '../components/NewsCard.vue'
import useNewsStore from '../store/news.js'

const { news_module = {} } = __APP_ENV__
const {
  index_page: { pinned_news_id = [], news_per_page = 10, show_date = true } = {}
} = news_module

const per = news_per_page || 5

const LAYOUT_CLASSES = {
  list: 'grid gap-4',
  cards: 'grid md:grid-cols-2 lg:grid-cols-3 gap-6'
}

const pinnedNewsId = computed(() => {
  return [pinned_news_id].flat().filter(Boolean)
})

const store = useNewsStore()

const layout = computed(() => {
  return LAYOUT_CLASSES[news_module.layout] || LAYOUT_CLASSES.list
})

async function init() {
  if (pinnedNewsId.value.length) {
    await store.loadPinnedNews(pinnedNewsId.value)
  }
  await store.loadNews(1, per)
}

init()
</script>
