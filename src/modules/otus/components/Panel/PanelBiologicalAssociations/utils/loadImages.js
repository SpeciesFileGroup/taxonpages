import { makeAPIRequest } from '@/utils'
import { makeImage } from './makeImage'

export async function loadImages(baIds) {
  const { data } = await makeAPIRequest.get('/depictions/gallery', {
    params: {
      depiction_object_type: ['BiologicalAssociation'],
      depiction_object_id: baIds,
      per: 200
    }
  })

  return data.map(makeImage)
}
