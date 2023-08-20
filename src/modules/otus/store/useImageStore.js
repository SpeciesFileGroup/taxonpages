import TaxonWorks from '../services/TaxonWorks'
import { defineStore } from 'pinia'
import { useOtuPageRequest } from '../helpers/useOtuPageRequest'
import { RESPONSE_ERROR } from '../constants'

export const useImageStore = defineStore('imageStore', {
  state: () => {
    return {
      images: null,
      controller: null
    }
  },

  actions: {
    resetRequest() {
      this.controller?.abort()
    },

    async loadImages(otuId) {
      const params = {
        extend: ['depictions', 'attribution', 'source', 'citations'],
        otu_scope: ['all']
      }

      this.controller = new AbortController()

      try {
        const response = await useOtuPageRequest('panel:images', () =>
          TaxonWorks.getOtuImages(otuId, {
            params,
            signal: this.controller.signal
          })
        )

        this.images = response.data
        this.controller = null
      } catch (e) {
        if (e.name !== RESPONSE_ERROR.CanceledError) {
          this.controller = null
        }
      }
    }
  }
})
