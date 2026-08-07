import { defineStore } from 'pinia'

export const DESCENDANTS_TREE_ROOT_ID = Symbol('descendantsTreeRootId')

export const useDescendantsTreeStore = defineStore('descendantsTree', {
  state: () => {
    return {
      expanded: {},
      descendants: {}
    }
  },

  getters: {
    isExpanded: (state) => {
      return (rootOtuId, otuId) => state.expanded[rootOtuId]?.[otuId]
    },

    getDescendants: (state) => {
      return (rootOtuId, otuId) => state.descendants[rootOtuId]?.[otuId]
    }
  },

  actions: {
    setExpanded(rootOtuId, otuId, isExpanded) {
      this.expanded[rootOtuId] = {
        ...this.expanded[rootOtuId],
        [otuId]: isExpanded
      }
    },

    setDescendants(rootOtuId, otuId, list) {
      this.descendants[rootOtuId] = {
        ...this.descendants[rootOtuId],
        [otuId]: list
      }
    }
  }
})
