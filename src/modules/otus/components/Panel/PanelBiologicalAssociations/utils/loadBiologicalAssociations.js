import { makeAPIRequest } from '@/utils'
import { makeBiologicalAssociation } from './makeBiologicalAssociation'
import { useOtuPageRequest } from '@/modules/otus/helpers/useOtuPageRequest'

const extend = [
  'object',
  'subject',
  'biological_relationship',
  'taxonomy',
  'biological_relationship_types'
]

export async function loadBiologicalAssociations(
  otuId,
  { page = 1, per = 50 } = {}
) {
  const { data, headers } = await useOtuPageRequest(
    'panel:biological-associations',
    () =>
      makeAPIRequest.get('/biological_associations/basic', {
        params: {
          'otu_query[coordinatify]': true,
          'otu_query[otu_id][]': otuId,
          per,
          page,
          extend
        }
      })
  )

  return {
    biologicalAssociations: data.map(makeBiologicalAssociation),
    pagination: {
      page: Number(headers['pagination-page']),
      per: Number(headers['pagination-per-page']),
      total: Number(headers['pagination-total'])
    }
  }
}
