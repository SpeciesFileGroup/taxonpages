import { makeAPIRequest } from '@/utils'

export async function loadAssertedDistributions(baIds) {
  const { data } = await makeAPIRequest.get('/asserted_distributions', {
    params: {
      asserted_distribution_object_type: ['BiologicalAssociation'],
      asserted_distribution_object_id: baIds,
      per: 200
    }
  })

  return data
}
