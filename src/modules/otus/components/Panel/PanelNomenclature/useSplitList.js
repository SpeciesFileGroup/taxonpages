import { computed } from 'vue'

export function useSplitList(props, MAX_RECORDS) {
  return computed(() => {
    const copyArr = props.list.slice()
    const first = copyArr.splice(0, MAX_RECORDS)
    const last = copyArr.splice(-MAX_RECORDS)
    const middle = copyArr

    return {
      first,
      middle,
      last
    }
  })
}
