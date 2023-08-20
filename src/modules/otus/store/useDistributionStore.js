import TaxonWorks from '../services/TaxonWorks'
import { defineStore } from 'pinia'
import { useOtuPageRequest } from '../helpers/useOtuPageRequest'
import { RESPONSE_ERROR } from '../constants'
import {
  isRankGrpup,
  removeDuplicateShapes,
  makeGeoJSONFeature
} from '../utils'

export const useDistributionStore = defineStore('distributionStore', {
  state: () => {
    return {
      distribution: {
        geojson: null,
        errorMessage: null,
        currentShapeTypes: [],
        cachedMap: null
      },
      controller: null
    }
  },
  actions: {
    resetRequest() {
      this.controller?.abort()
    },

    loadCachedMap(mapId) {
      TaxonWorks.getCachedMap(mapId, { signal: this.controller.signal }).then(
        (response) => {
          this.distribution.cachedMap = response.data
        }
      )
    },

    async getAggregateShape(otuId) {
      useOtuPageRequest('panel:map', () =>
        TaxonWorks.getOtuDistribution(otuId, {
          signal: this.controller.signal
        })
      )
        .then(({ data }) => {
          const geojson = JSON.parse(data.cached_map.geo_json)

          this.distribution.currentShapeTypes = ['Aggregate']
          this.distribution.geojson = {
            features: [makeGeoJSONFeature(geojson, 'Aggregate')]
          }

          this.loadCachedMap(data.cached_map.id)
        })
        .catch((e) => {
          if (e.name != RESPONSE_ERROR.CanceledError) {
            this.distribution.errorMessage = e.response.data.error
            this.distribution.currentShapeTypes = []
            this.distribution.geojson = []
          }
        })
    },

    async loadDistribution({ otuId, rankString }) {
      const isSpeciesGroup =
        rankString && isRankGrpup('SpeciesGroup', rankString)

      this.controller = new AbortController()

      if (isSpeciesGroup) {
        useOtuPageRequest('panel:map', () =>
          TaxonWorks.getOtuGeoJSONDistribution(otuId, {
            signal: this.controller.signal
          })
        )
          .then(({ data }) => {
            if (data.request_too_large) {
              this.distribution.geojson = null
              this.distribution.errorMessage = data.message
            } else {
              const { features, shapeTypes } = removeDuplicateShapes(data)

              this.distribution.currentShapeTypes = shapeTypes
              this.distribution.geojson = {
                features
              }
            }
          })
          .catch((e) => {
            if (e.name !== RESPONSE_ERROR.CanceledError) {
              this.getAggregateShape(otuId)
            }
          })
      } else {
        this.getAggregateShape(otuId)
      }
    }
  }
})
