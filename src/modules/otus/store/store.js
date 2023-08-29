import { defineStore } from 'pinia'
import TaxonWorks from '../services/TaxonWorks'
import { useOtuPageRequest } from '../helpers/useOtuPageRequest'
import { useOtuPageRequestStore } from './request'

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

    async loadTaxonomy(otuId, { signal }) {
      const { data } = await TaxonWorks.getTaxonomy(otuId, {
        params: {
          max_descendants_depth: 0,
          extend: ['common_names']
        },
        signal
      })

      this.taxonomy = {
        commonNames: data.common_names,
        synonyms: data.nomenclatural_synonyms
      }
    },

    async loadCatalog(taxonId, { signal }) {
      this.catalog.isLoading = true

      const response = await useOtuPageRequest('taxonomy', () =>
        TaxonWorks.getTaxonNameCitations(taxonId, { signal })
      )

      this.catalog = {
        ...response.data,
        sources: response.data.sources.map(({ cached, url }) =>
          cached.replace(url, `<a href="${url}">${url}</a>`)
        ),
        isLoading: false
      }
    },

    async loadInit({ otuId, controller }) {
      const requestStore = useOtuPageRequestStore()

      requestStore.$reset()

      try {
        await this.loadOtu(otuId, controller)
        await this.loadTaxon(this.otu.taxon_name_id, controller)
        await this.loadCatalog(this.otu.taxon_name_id, controller)
        await this.loadTaxonomy(otuId, controller)
      } catch (error) {
        return Promise.reject(error)
      }
    }
  }
})
