import { defineStore } from 'pinia'
import { useOtuPageRequest } from '@/modules/otus/helpers/useOtuPageRequest'
import { RESPONSE_ERROR } from '@/modules/otus/constants'
import {
  loadBiologicalAssociations as fetchBiologicalAssociations,
  loadImages,
  loadAssertedDistributions
} from '../utils'

export const useBiologicalAssociationsStore = defineStore(
  'biologicalAssociationsStore',
  {
    state: () => ({
      biologicalAssociations: [],
      pagination: { page: 1, per: 50, total: 0 },
      isLoading: false,
      controller: null
    }),

    actions: {
      resetRequest() {
        this.controller?.abort()
      },

      async loadPage(
        otuId,
        { page = 1, per = 50, images = true, assertedDistribution = true } = {}
      ) {
        this.isLoading = true
        this.controller = new AbortController()

        try {
          const result = await useOtuPageRequest(
            'panel:biological-associations',
            () => fetchBiologicalAssociations(otuId, { page, per })
          )

          const baIds = result.biologicalAssociations.map((ba) => ba.id)

          const [depictions, ads] = await Promise.all([
            images ? loadImages(baIds) : [],
            assertedDistribution ? loadAssertedDistributions(baIds) : []
          ])

          this.biologicalAssociations = result.biologicalAssociations.map(
            (ba) => ({
              ...ba,
              images: depictions.filter((d) => d.objectId == ba.id),
              assertedDistributions: ads
                .filter(
                  (ad) => ad.asserted_distribution_object_id === ba.id
                )
                .map((ad) => ad.asserted_distribution_shape.name)
            })
          )

          this.pagination = result.pagination
          this.controller = null
        } catch (e) {
          if (e.name !== RESPONSE_ERROR.CanceledError) {
            this.controller = null
          }
        } finally {
          this.isLoading = false
        }
      }
    }
  }
)
