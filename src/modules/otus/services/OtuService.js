import { makeAPIRequest } from "@/utils/request"

export default class OtuService {

  static getTaxonNameCitations (taxonId) {
    return makeAPIRequest.get('/citations.json', { 
      params: {
        citation_object_id: taxonId,
        citation_object_type: 'TaxonName',
        extend: ['source']
      }
    })
  }

  static getOtu (id) {
    return makeAPIRequest.get(`/otus/${id}`, { params: { extend: ['parents'] } })
  }

  static getTaxon (id) {
    return makeAPIRequest.get(`/taxon_names/${id}`)
  }

  static getTaxonTypeSpecies (id) {
    return makeAPIRequest.get(`/taxon_names/${id}`, { params: { extend: ['type_taxon_name_relationship'] } })
  }

  static getOtuImages (otuId, params = {}) {
    return makeAPIRequest.get(`/otus/${otuId}/inventory/images.json`, { params })
  }

  static getDescendants (otuId, params) {
    return makeAPIRequest.get(`/otus/${otuId}/inventory/taxonomy.json`, { params })
  }

  static getTypes (otuId) {
    return makeAPIRequest.get(`/otus/${otuId}/inventory/type_material.json`)
  }

  static getGeoJSON (otuId) {
    return makeAPIRequest.get(`/otus/${otuId}/inventory/distribution`)
  }
}