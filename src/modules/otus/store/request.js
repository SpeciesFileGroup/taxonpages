import { defineStore } from 'pinia'

export const useOtuPageRequestStore = defineStore('otuPageRequest', {
  state: () => {
    return {
      requests: {}
    }
  },

  getters: {
    getRequest: (state) => {
      return (key) => state.requests[key]
    },

    sitemap: (state) => {
      const entries = Object.entries(state.requests).map(([key, value]) => [
        key,
        value.url
      ])

      return Object.fromEntries(entries)
    }
  },

  actions: {
    setRequest(key, response) {
      this.requests[key] = {
        url: response.request.responseURL,
        data: response.data
      }
    }
  }
})
