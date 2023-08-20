import { useOtuPageRequestStore } from '../store/request'
import { RESPONSE_ERROR } from '../constants'

export function useOtuPageRequest(key, requestFunction) {
  const store = useOtuPageRequestStore()
  const request = requestFunction()

  request
    .then((response) => {
      store.setRequest(key, response)
    })
    .catch((error) => {
      if (error.name !== RESPONSE_ERROR.CanceledError) {
        store.setRequest(key, error.response)
      }
    })

  return request
}
