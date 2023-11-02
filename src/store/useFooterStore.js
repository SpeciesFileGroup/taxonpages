import { defineStore } from 'pinia'

export const useFooterStore = defineStore('footerStore', {
  state: () => {
    return {
      nextAuthor: ''
    }
  },
  actions: {
    setNextAuthorText(value) {
      this.nextAuthor = value
    }
  }
})
