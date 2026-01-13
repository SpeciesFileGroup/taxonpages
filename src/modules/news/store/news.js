import { defineStore } from 'pinia'
import { News } from '../services/News'
import { makeNews } from '../adapters/makeNews.js'
import { getPagination } from '../utils/getPagination.js'

export default defineStore('newsModule', {
  state: () => ({
    pinnedNews: [],
    news: [],
    pagination: null,
    isLoading: false
  }),
  actions: {
    setPinnedNews(news) {
      this.pinnedNews = news
    },
    setNewsList(news) {
      this.newsList = news
    },
    setPagination(pagination) {
      this.pagination = pagination
    },

    async loadPinnedNews(ids) {
      try {
        const { data } = await News.where({
          news_id: ids
        })

        this.pinnedNews = data.map((item) => makeNews(item))
      } catch {}
    },

    async loadNews(page = 1, per) {
      try {
        this.isLoading = true
        const request = await News.where({ page, per })

        this.pagination = getPagination(request.headers)

        this.news = request.data
          .filter((n) => !this.pinnedNews.some((pn) => pn.id === n.id))
          .map((item) => makeNews(item))
      } catch {
      } finally {
        this.isLoading = false
      }
    }
  }
})
