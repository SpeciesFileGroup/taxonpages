import { computed } from 'vue'

export function splitList(list, MAX_RECORDS) {
  const copyArr = list.slice()
  const first = copyArr.splice(0, MAX_RECORDS)
  const last = copyArr.splice(-MAX_RECORDS)
  const middle = copyArr

  return {
    first,
    middle,
    last
  }
}
