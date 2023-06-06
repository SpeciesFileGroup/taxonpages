import { defineStore } from 'pinia'
import TaxonWorks from '../services/TaxonWorks'
import { actionLoadDistribution, actionLoadCatalog } from './actions'

export const useOtuStore = defineStore('otuStore', {
  state: () => {
    return {
      otu: null,
      taxon: null,
      images: null,
      distribution: {
        geojson: null,
        errorMessage: null,
        currentShapeTypes: []
      },
      catalog: {
        sources: [],
        stats: {},
        timeline: []
      }
    }
  },
  actions: {
    async loadTaxon(id) {
      const taxon = await TaxonWorks.summary(id)

      this.taxon = taxon.data
    },
    async loadOtu(id) {
      const otu = await TaxonWorks.getOtu(id)

      this.otu = otu.data
    },

    async loadInit(otuId) {
      await this.loadOtu(otuId)
      await this.loadTaxon(this.otu.taxon_name_id)
      await this.loadCatalog(this.otu.taxon_name_id)
    },

    async loadImages(otuId) {
      const params = {
        extend: ['depictions', 'attribution', 'source', 'citations'],
        otu_scope: ['all']
      }

      this.images = (await TaxonWorks.getOtuImages(otuId, params)).data
    },

    ...actionLoadDistribution,
    ...actionLoadCatalog
  }
})
