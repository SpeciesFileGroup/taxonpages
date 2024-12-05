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

    async loadImages(otuId, { sortOrder }) {
      const params = {
        extend: ['depictions', 'attribution', 'source', 'citations'],
        otu_scope: ['all', 'coordinate_otus'],
        sort_order: sortOrder
      }

      this.controller = new AbortController()

      try {
        const response = await useOtuPageRequest('panel:images', () =>
          TaxonWorks.getOtuImages(otuId, {
            params,
            signal: this.controller.signal
          })
        )

        this.images = response.data.image_order.filter(Boolean).map((id) => {
          const image = { ...response.data.images[id] }
          const { url, project_token } = __APP_ENV__

          if (image.original_png) {
            image.original = `${url}/${image.original_png?.substring(
              8
            )}?project_token=${project_token}`
          }

          return image
        })

        this.controller = null
      } catch (e) {
        if (e.name !== RESPONSE_ERROR.CanceledError) {
          this.controller = null
        }
      }
    }
  }
})
