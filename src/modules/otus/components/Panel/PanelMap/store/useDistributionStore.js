import TaxonWorks from '../../../../services/TaxonWorks'
import { defineStore } from 'pinia'
import { useOtuPageRequest } from '../../../../helpers/useOtuPageRequest'
import { RESPONSE_ERROR } from '../../../../constants'
import {
  isRankGroup,
  removeDuplicateShapes,
  makeGeoJSONFeature
} from '../utils'
import { ASSERTED_ABSENT } from '@/constants/objectTypes'
import { LEGEND } from '../constants'
import { makeAPIRequest } from '@/utils'

async function loadAbsentFeatures(otuId, enabled) {
  if (!enabled) return []

  const { data } = await makeAPIRequest.get(
    `/otus/${otuId}/inventory/distribution_is_absent.geojson`
  )

  data.features.forEach((feature) => {
    feature.properties.base = [
      {
        ...feature.properties.base,
        is_absent: true
      }
    ]
  })

  return data.features
}

function sortFeaturesByType({ features, shapeTypes }, reference) {
  const referenceMap = new Map()

  reference.forEach((item, index) => {
    referenceMap.set(item, index)
  })

  return {
    shapeTypes,
    features: features.toSorted((a, b) => {
      const indexA = Math.max(
        ...a.properties.base.map((item) =>
          referenceMap.has(item.type) ? referenceMap.get(item.type) : Infinity
        )
      )
      const indexB = Math.max(
        ...b.properties.base.map((item) =>
          referenceMap.has(item.type) ? referenceMap.get(item.type) : Infinity
        )
      )
      return indexA - indexB
    })
  }
}

export const useDistributionStore = defineStore('distributionStore', {
  state: () => {
    return {
      distribution: {
        geojson: null,
        errorMessage: null,
        currentShapeTypes: [],
        cachedMap: null
      },
      absencesCache: null,
      controller: null
    }
  },
  actions: {
    resetRequest() {
      this.controller?.abort()
    },

    loadCachedMap(mapId) {
      TaxonWorks.getCachedMap(mapId, { signal: this.controller.signal })
        .then((response) => {
          this.distribution.cachedMap = response.data
        })
        .catch(() => {})
    },

    applyDistribution({ features, shapeTypes, absent }) {
      this.absencesCache = absent
      this.distribution.currentShapeTypes = absent.length
        ? [...new Set([...shapeTypes, ASSERTED_ABSENT])]
        : shapeTypes
      this.distribution.geojson = {
        features: [...features, ...absent]
      }
    },

    async showAbsences(otuId) {
      if (!this.absencesCache) {
        this.absencesCache = await loadAbsentFeatures(otuId, true)
      }

      if (!this.absencesCache.length) return

      const currentFeatures = this.distribution.geojson?.features || []
      const alreadyVisible = currentFeatures.some((f) =>
        f.properties?.base?.some?.((b) => b.is_absent)
      )

      if (alreadyVisible) return

      this.distribution.geojson = {
        features: [...currentFeatures, ...this.absencesCache]
      }
      this.distribution.currentShapeTypes = [
        ...new Set([...this.distribution.currentShapeTypes, ASSERTED_ABSENT])
      ]
    },

    hideAbsences() {
      if (!this.distribution.geojson) return

      this.distribution.geojson = {
        features: this.distribution.geojson.features.filter(
          (f) => !f.properties?.base?.some?.((b) => b.is_absent)
        )
      }
      this.distribution.currentShapeTypes =
        this.distribution.currentShapeTypes.filter((t) => t !== ASSERTED_ABSENT)
    },

    async getAggregateShape(otuId, { withAbsences = true } = {}) {
      useOtuPageRequest('panel:map', () =>
        TaxonWorks.getOtuDistribution(otuId, {
          signal: this.controller.signal
        })
      )
        .then(async ({ data }) => {
          const absent = await loadAbsentFeatures(otuId, withAbsences)
          const geojson = JSON.parse(data.cached_map.geo_json)

          this.applyDistribution({
            features: [makeGeoJSONFeature(geojson, 'Aggregate')],
            shapeTypes: ['Aggregate'],
            absent
          })

          this.loadCachedMap(data.cached_map.id)
        })
        .catch((e) => {
          if (e.name != RESPONSE_ERROR.CanceledError) {
            this.distribution.errorMessage = e.response?.data?.error
            this.distribution.currentShapeTypes = []
            this.distribution.geojson = []
          }
        })
    },

    async loadSpeciesGroupShapes(otuId, { withAbsences }) {
      const { data } = await useOtuPageRequest('panel:map', () =>
        TaxonWorks.getOtuGeoJSONDistribution(otuId, {
          signal: this.controller.signal
        })
      )

      if (data.request_too_large) {
        this.distribution.geojson = null
        this.distribution.errorMessage = data.message
        return
      }

      const absent = await loadAbsentFeatures(otuId, withAbsences)

      const { features, shapeTypes } = sortFeaturesByType(
        removeDuplicateShapes(data.features),
        Object.keys(LEGEND)
      )

      this.applyDistribution({ features, shapeTypes, absent })
    },

    async loadDistribution({ otuId, rankString, withAbsences = true }) {
      const isSpeciesGroup =
        rankString &&
        (isRankGroup('SpeciesGroup', rankString) ||
          isRankGroup('SpeciesAndInfraspeciesGroup', rankString))

      this.controller = new AbortController()

      if (!isSpeciesGroup) {
        this.getAggregateShape(otuId, { withAbsences })
        return
      }

      try {
        await this.loadSpeciesGroupShapes(otuId, { withAbsences })
      } catch (e) {
        if (e.name !== RESPONSE_ERROR.CanceledError) {
          this.getAggregateShape(otuId, { withAbsences })
        }
      }
    }
  }
})
