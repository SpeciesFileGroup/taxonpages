import { makeAPIRequest } from '@/utils'

export class ObservationMatrixImage {
  static find(id, params) {
    return makeAPIRequest.get(`/observation_matrices/${id}/image_matrix`, {
      params
    })
  }
}
