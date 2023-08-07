import { useOtuPageRequestStore } from '../store/request'

export function useOtuPageRequest(key, requestFunction) {
  const store = useOtuPageRequestStore()
  const request = requestFunction()

  request
    .then((response) => {
      store.setRequest(key, response)
    })
    .catch((error) => {
      store.setRequest(key, error.response)
    })

  return request
}
