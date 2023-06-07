import { makeAPIRequest } from '@/utils/request'

export default class TaxonWorks {
  static getTaxonNameCitations(taxonId) {
    return makeAPIRequest.get(`/taxon_names/${taxonId}/inventory/catalog`)
  }

  static getOtu(id) {
    return makeAPIRequest.get(`/otus/${id}`, {
      params: { extend: ['parents'] }
    })
  }

  static getOtus(params) {
    return makeAPIRequest.get(`/otus.json`, {
      params
    })
  }

  static getTaxon(id) {
    return makeAPIRequest.get(`/taxon_names/${id}`)
  }

  static summary(id) {
    return makeAPIRequest.get(`/taxon_names/${id}/inventory/summary`)
  }

  static getTaxonTypeDesignation(id) {
    return makeAPIRequest.get(`/taxon_names/${id}`, {
      params: { extend: ['type_taxon_name_relationship'] }
    })
  }

  static getOtuImages(otuId, params = {}) {
    return makeAPIRequest.get(`/otus/${otuId}/inventory/images.json`, {
      params
    })
  }

  static getTaxonomy(otuId, params) {
    return makeAPIRequest.get(`/otus/${otuId}/inventory/taxonomy.json`, {
      params
    })
  }

  static getOtuTypeMaterial(otuId) {
    return makeAPIRequest.get(`/otus/${otuId}/inventory/type_material.json`)
  }

  static getOtuDistribution(otuId) {
    return makeAPIRequest.get(`/otus/${otuId}/inventory/distribution.json`)
  }

  static getOtuGeoJSONDistribution(otuId) {
    return makeAPIRequest.get(`/otus/${otuId}/inventory/distribution.geojson`)
  }

  static getCachedMap(cachedId) {
    return makeAPIRequest.get(`/cached_maps/${cachedId}`)
  }

  static getOtuContent(otuId) {
    return makeAPIRequest.get(`/otus/${otuId}/inventory/content`, {
      extend: ['depiction']
    })
  }

  static getDwC(otuId) {
    return makeAPIRequest.get(`/otus/${otuId}/inventory/dwc`)
  }
}
