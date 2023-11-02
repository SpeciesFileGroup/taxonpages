import { defineStore } from 'pinia'

export const useFooterStore = defineStore('footerStore', {
  state: () => ({
    nextAuthor: ''
  }),

  actions: {
    async setNextAuthorText(value) {
      this.nextAuthor = value
    }
  }
})
