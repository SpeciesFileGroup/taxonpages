import { makeAPIRequest } from '@/utils'

export class News {
  static where(params) {
    return makeAPIRequest.get('/news', { params })
  }

  static find(id) {
    return makeAPIRequest.get(`/news/${id}`)
  }
}
