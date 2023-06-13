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
      const keys = Object.keys(state.requests).sort()

      return Object.fromEntries(
        keys.map((key) => [key, state.requests[key].url])
      )
    }
  },

  actions: {
    setRequest(key, { data, request }) {
      const url = request.res?.responseUrl || request.responseURL

      this.requests[key] = {
        url,
        data
      }
    }
  }
})
