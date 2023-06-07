import {
  isRankGrpup,
  removeDuplicateShapes,
  makeGeoJSONFeature
} from '../../utils'
import TaxonWorks from '../../services/TaxonWorks'

export const actionLoadDistribution = {
  async loadDistribution({ otuId, rankString }) {
    const isSpeciesGroup = isRankGrpup('SpeciesGroup', rankString)

    const getAggregateShape = async (otuId) => {
      TaxonWorks.getOtuDistribution(otuId)
        .then(({ data }) => {
          const geojson = JSON.parse(data.cached_map.geo_json)

          this.distribution.currentShapeTypes = ['Aggregate']
          this.distribution.geojson = {
            features: [makeGeoJSONFeature(geojson, 'Aggregate')]
          }
        })
        .catch((e) => {
          this.distribution.errorMessage = e.response.data.error
          this.distribution.currentShapeTypes = []
          this.distribution.geojson = []
        })
    }

    if (isSpeciesGroup) {
      TaxonWorks.getOtuGeoJSONDistribution(otuId)
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
          getAggregateShape(otuId)
        })
    } else {
      getAggregateShape(otuId)
    }
  }
}
