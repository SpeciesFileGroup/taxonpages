import { defineStore } from 'pinia'
import TaxonWorks from '../services/TaxonWorks'
import { actionLoadDistribution } from './actions'

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
      const otu = (await TaxonWorks.getOtu(otuId)).data
      const taxon = (await TaxonWorks.summary(otu.taxon_name_id)).data

      this.otu = otu
      this.taxon = taxon
    },

    async loadImages(otuId) {
      const params = {
        extend: ['depictions', 'attribution', 'source', 'citations'],
        otu_scope: ['all']
      }

      this.images = (await TaxonWorks.getOtuImages(otuId, params)).data
    },

    ...actionLoadDistribution
  }
})
