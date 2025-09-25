export function flattenParameters(obj, prefix = '') {
  const result = {}

  for (const key in obj) {
    if (!obj.hasOwnProperty(key)) continue

    const value = obj[key]
    const newKey = prefix ? `${prefix}[${key}]` : key

    if (Array.isArray(value)) {
      result[`${newKey}[]`] = value
    } else if (typeof value === 'object' && value !== null) {
      Object.assign(result, flattenParameters(value, newKey))
    } else {
      result[newKey] = value
    }
  }

  return result
}
