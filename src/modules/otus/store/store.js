import { defineStore } from 'pinia'
import TaxonWorks from '../services/TaxonWorks'
import { useOtuPageRequest } from '../helpers/useOtuPageRequest'
import { useOtuPageRequestStore } from './request'
import {
  actionLoadCatalog,
  actionLoadTaxonomy,
  actionLoadCachedMap
} from './actions'

export const useOtuStore = defineStore('otuStore', {
  state: () => {
    return {
      otu: null,
      taxon: null,
      images: null,
      catalog: {
        sources: [],
        stats: {},
        timeline: [],
        isLoading: false
      },
      taxonomy: {
        commonNames: [],
        synonyms: []
      }
    }
  },
  actions: {
    async loadTaxon(id, { signal }) {
      const taxon = await useOtuPageRequest('summary', () =>
        TaxonWorks.summary(id, { signal })
      )

      this.taxon = taxon.data
    },
    async loadOtu(id, { signal }) {
      const otu = await TaxonWorks.getOtu(id, { signal })

      this.otu = otu.data
    },

    async loadInit({ otuId, controller }) {
      const requestStore = useOtuPageRequestStore()
      const { signal } = controller

      requestStore.$reset()

      try {
        await this.loadOtu(otuId, { signal })
        await this.loadTaxon(this.otu.taxon_name_id, {
          signal
        })
        await this.loadCatalog(this.otu.taxon_name_id, {
          signal
        })
        await this.loadTaxonomy(otuId, { signal })
      } catch (error) {
        return Promise.reject(error)
      }
    },

    ...actionLoadCatalog,
    ...actionLoadTaxonomy,
    ...actionLoadCachedMap
  }
})
