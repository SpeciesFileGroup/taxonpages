import { defineStore } from 'pinia'
import TaxonWorks from '../services/TaxonWorks'
import { useOtuPageRequest } from '../helpers/useOtuPageRequest'
import { useOtuPageRequestStore } from './request'
import {
  actionLoadDistribution,
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
      distribution: {
        geojson: null,
        errorMessage: null,
        currentShapeTypes: [],
        cachedMap: null
      },
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
    async loadTaxon(id) {
      const taxon = await useOtuPageRequest('summary', () =>
        TaxonWorks.summary(id)
      )

      this.taxon = taxon.data
    },
    async loadOtu(id) {
      const otu = await TaxonWorks.getOtu(id)

      this.otu = otu.data
    },

    async loadInit(otuId) {
      const requestStore = useOtuPageRequestStore()

      requestStore.$reset()

      try {
        await this.loadOtu(otuId)
        await this.loadTaxon(this.otu.taxon_name_id)
      } catch (error) {
        return false
      }

      await this.loadCatalog(this.otu.taxon_name_id)
      await this.loadTaxonomy(otuId)

      return true
    },

    async loadImages(otuId) {
      const params = {
        extend: ['depictions', 'attribution', 'source', 'citations'],
        otu_scope: ['all']
      }

      this.images = (
        await useOtuPageRequest('panel:images', () =>
          TaxonWorks.getOtuImages(otuId, params)
        )
      ).data
    },

    ...actionLoadDistribution,
    ...actionLoadCatalog,
    ...actionLoadTaxonomy,
    ...actionLoadCachedMap
  }
})
