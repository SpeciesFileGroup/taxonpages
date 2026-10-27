import { makeAPIRequest } from '@/utils'

export async function loadTags(baIds) {
  const { data } = await makeAPIRequest.get('/tags', {
    params: {
      tag_object_type: ['BiologicalAssociation'],
      tag_object_id: baIds,
      per: 200
    }
  })

  return data
}
